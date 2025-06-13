from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForCausalLM
import json
import gc

app = Flask(__name__)
CORS(app)

# Global model variables
model = None
tokenizer = None
device = "cuda" if torch.cuda.is_available() else "cpu"

class PatchscopesAnalyzer:
    def __init__(self, model_id="meta-llama/Llama-3.2-1B"):
        self.model_id = model_id
        self.model = None
        self.tokenizer = None
        self.load_model()
    
    def load_model(self):
        """Load the model and tokenizer"""
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_id)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_id,
                device_map=device,
                torch_dtype=torch.float16,
            )
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            print(f"Model loaded successfully on {device}")
        except Exception as e:
            print(f"Error loading model: {e}")
            raise e
    
    def get_model_info(self):
        """Get basic model information"""
        if self.model is None:
            return None
        
        num_layers = len(self.model.model.layers)
        vocab_size = self.model.config.vocab_size
        hidden_size = self.model.config.hidden_size
        
        return {
            "num_layers": num_layers,
            "vocab_size": vocab_size,
            "hidden_size": hidden_size,
            "model_id": self.model_id
        }
    
    def get_activations(self, prompt, layer_indices=None):
        """Get activations for all layers and tokens"""
        if layer_indices is None:
            layer_indices = list(range(len(self.model.model.layers)))
        
        tokens = self.tokenizer(prompt, return_tensors="pt").to(device)
        
        with torch.no_grad():
            outputs = self.model(**tokens, output_hidden_states=True, return_dict=True)
            hidden_states = outputs.hidden_states
        
        # Convert to numpy for JSON serialization
        activations = {}
        for layer_idx in layer_indices:
            if layer_idx < len(hidden_states):
                # Get activations for this layer [batch_size, seq_len, hidden_size]
                layer_activations = hidden_states[layer_idx][0].cpu().numpy()
                # Take norm for visualization (reduce dimensionality)
                activation_norms = np.linalg.norm(layer_activations, axis=-1).tolist()
                activations[f"layer_{layer_idx}"] = activation_norms
        
        token_strings = [self.tokenizer.decode([token_id]) for token_id in tokens['input_ids'][0]]
        
        return {
            "activations": activations,
            "tokens": token_strings,
            "token_ids": tokens['input_ids'][0].tolist()
        }
    
    def patchscope_analysis(self, source_prompt, target_prompt, source_token_idx, 
                          target_token_idx, source_layer_idx, target_layer_idx, n_tokens=10):
        """Perform patchscope analysis"""
        
        # Get source activation
        source_tokens = self.tokenizer(source_prompt, return_tensors="pt").to(device)
        
        with torch.no_grad():
            source_outputs = self.model(**source_tokens, output_hidden_states=True, return_dict=True)
            source_hidden_states = source_outputs.hidden_states
            source_activation = source_hidden_states[source_layer_idx][0, source_token_idx]
        
        # Original target generation
        target_tokens = self.tokenizer(target_prompt, return_tensors="pt").to(device)
        
        with torch.no_grad():
            original_outputs = self.model.generate(
                **target_tokens, 
                max_new_tokens=n_tokens,
                do_sample=False,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        original_response = self.tokenizer.decode(
            original_outputs[0, target_tokens['input_ids'].shape[1]:], 
            skip_special_tokens=True
        )
        
        # Patched generation
        def patch_hook(module, inp):
            if inp[0].shape[1] > abs(target_token_idx):
                inp[0][:, target_token_idx] = source_activation
            return inp
        
        hook = self.model.model.layers[target_layer_idx].register_forward_pre_hook(patch_hook)
        
        with torch.no_grad():
            patched_outputs = self.model.generate(
                **target_tokens, 
                max_new_tokens=n_tokens,
                do_sample=False,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        hook.remove()
        
        patched_response = self.tokenizer.decode(
            patched_outputs[0, target_tokens['input_ids'].shape[1]:], 
            skip_special_tokens=True
        )
        
        return {
            "source_prompt": source_prompt,
            "target_prompt": target_prompt,
            "original_response": original_response,
            "patched_response": patched_response,
            "source_tokens": [self.tokenizer.decode([t]) for t in source_tokens['input_ids'][0]],
            "target_tokens": [self.tokenizer.decode([t]) for t in target_tokens['input_ids'][0]],
            "patch_config": {
                "source_token_idx": source_token_idx,
                "target_token_idx": target_token_idx,
                "source_layer_idx": source_layer_idx,
                "target_layer_idx": target_layer_idx
            }
        }

# Initialize analyzer
analyzer = PatchscopesAnalyzer()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/model-info', methods=['GET'])
def get_model_info():
    """Get model information"""
    try:
        info = analyzer.get_model_info()
        return jsonify({"success": True, "data": info})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/activations', methods=['POST'])
def get_activations():
    """Get activations for a prompt"""
    try:
        data = request.json
        prompt = data.get('prompt', '')
        layer_indices = data.get('layer_indices', None)
        
        if not prompt:
            return jsonify({"success": False, "error": "Prompt is required"}), 400
        
        result = analyzer.get_activations(prompt, layer_indices)
        return jsonify({"success": True, "data": result})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/patchscope', methods=['POST'])
def patchscope():
    """Perform patchscope analysis"""
    try:
        data = request.json
        
        required_fields = ['source_prompt', 'target_prompt', 'source_token_idx', 
                          'target_token_idx', 'source_layer_idx', 'target_layer_idx']
        
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "error": f"Missing field: {field}"}), 400
        
        result = analyzer.patchscope_analysis(
            source_prompt=data['source_prompt'],
            target_prompt=data['target_prompt'],
            source_token_idx=data['source_token_idx'],
            target_token_idx=data['target_token_idx'],
            source_layer_idx=data['source_layer_idx'],
            target_layer_idx=data['target_layer_idx'],
            n_tokens=data.get('n_tokens', 10)
        )
        
        return jsonify({"success": True, "data": result})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "model_loaded": analyzer.model is not None})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
    