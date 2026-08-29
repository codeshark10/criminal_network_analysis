import os
import json
import torch
from typing import List, Dict, Any

try:
    import fastcoref.modeling

    if not hasattr(fastcoref.modeling.FCorefModel, "all_tied_weights_keys"):
        fastcoref.modeling.FCorefModel.all_tied_weights_keys = {}
    from fastcoref import FCoref

    HAS_FASTCOREF = True
except Exception:
    HAS_FASTCOREF = False


class CorefChunkProcessor:
    def __init__(self, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        if HAS_FASTCOREF:
            try:
                self.model = FCoref(device=self.device)
            except Exception:
                self.model = None
        else:
            self.model = None

    def resolve_text(self, text: str) -> str:
        if not text or not text.strip() or not self.model: return text
        try:
            return self.model.predict(texts=[text])[0].get_resolved_text()
        except Exception:
            return text


def run_step2(input_path: str) -> str:
    print(f"\n[STEP 2] Starting Coreference Resolution...")
    with open(input_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    processor = CorefChunkProcessor()
    processed_chunks = []

    for idx, chunk in enumerate(chunks, 1):
        original_text = chunk.get("text", "")
        updated_chunk = dict(chunk)
        updated_chunk["original_text"] = original_text
        updated_chunk["text"] = processor.resolve_text(original_text)
        updated_chunk["coref_resolved"] = bool(processor.model)
        processed_chunks.append(updated_chunk)

    base_dir = os.path.dirname(input_path)
    base_name = os.path.basename(input_path).replace("_step1_chunks.json", "")
    output_path = os.path.join(base_dir, f"{base_name}_step2_coref.json")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(processed_chunks, f, indent=2)

    print(f"  ✓ Processed {len(processed_chunks)} chunks -> {output_path}")
    return output_path