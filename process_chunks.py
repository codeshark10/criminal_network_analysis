import os
import json
import torch
from typing import List, Dict, Any

# --- HUGGINGFACE TRANSFORMERS COMPATIBILITY PATCH ---
try:
    import fastcoref.modeling
    # Inject missing attribute expected by transformers >= 4.40
    if not hasattr(fastcoref.modeling.FCorefModel, "all_tied_weights_keys"):
        fastcoref.modeling.FCorefModel.all_tied_weights_keys = {}
    from fastcoref import FCoref
    HAS_FASTCOREF = True
except Exception as e:
    HAS_FASTCOREF = False
    print(f"FastCoref import notice: {e}")


class CorefChunkProcessor:
    def __init__(self, device: str = None):
        """
        Initializes FastCoref model for pronoun and entity cluster resolution.
        Automatically defaults to CUDA GPU if available.
        """
        if device is None:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device

        if HAS_FASTCOREF:
            print(f"Loading FCoref model onto device: {self.device}...")
            try:
                self.model = FCoref(device=self.device)
            except Exception as e:
                print(f"Failed to initialize FCoref model: {e}")
                print("Falling back to passthrough mode.")
                self.model = None
        else:
            print("WARNING: 'fastcoref' package not found or incompatible. Running in passthrough fallback mode.")
            self.model = None

    def resolve_text(self, text: str) -> str:
        """
        Resolves ambiguous pronouns (he, she, the suspect) into explicit entity names.
        """
        if not text or not text.strip():
            return text

        if self.model:
            try:
                preds = self.model.predict(texts=[text])
                resolved_text = preds[0].get_resolved_text()
                return resolved_text
            except Exception as e:
                print(f"Coreference processing error on chunk segment: {e}")
                return text

        return text

    def process_json_chunks(
        self,
        input_path: str = "preprocessed_chunks.json",
        output_path: str = "coref_resolved_chunks.json"
    ) -> List[Dict[str, Any]]:
        """
        Loads preprocessed single-case chunks, resolves coreferences, preserves all metadata,
        and saves the enriched dataset to JSON.
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input chunk file '{input_path}' not found. Run Step 1 chunking first.")

        with open(input_path, "r", encoding="utf-8") as f:
            chunks = json.load(f)

        print(f"Loaded {len(chunks)} chunks from '{input_path}'. Starting coreference resolution...")

        processed_chunks = []
        for idx, chunk in enumerate(chunks, 1):
            original_text = chunk.get("text", "")
            resolved_text = self.resolve_text(original_text)

            # Preserve all chunk properties (case_id, case_title, metadata, section_type)
            updated_chunk = dict(chunk)
            updated_chunk["original_text"] = original_text
            updated_chunk["text"] = resolved_text
            updated_chunk["coref_resolved"] = bool(self.model)

            processed_chunks.append(updated_chunk)

            if idx % 25 == 0 or idx == len(chunks):
                print(f"Resolved coreferences for [{idx}/{len(chunks)}] chunks...")

        # Output resolved dataset
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(processed_chunks, f, indent=2)

        print(f"\nSUCCESS: Processed {len(processed_chunks)} chunks.")
        print(f"Saved coreference-resolved output to '{output_path}'.")
        return processed_chunks


if __name__ == "__main__":
    input_json = "preprocessed_chunks.json"
    output_json = "coref_resolved_chunks.json"

    processor = CorefChunkProcessor()
    processor.process_json_chunks(input_path=input_json, output_path=output_json)