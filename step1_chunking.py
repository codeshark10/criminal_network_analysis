import os
import re
import json
from dataclasses import dataclass, asdict
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter


@dataclass
class TextChunk:
    chunk_id: str
    case_id: str
    section_type: str
    chunk_index: int
    text: str
    metadata: Dict[str, Any]


class CaseFilePreprocessor:
    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 150):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def extract_metadata(self, raw_text: str, override_case_id: str) -> Dict[str, str]:
        title_match = re.search(r"CASE TITLE:\s*([^\n]+)", raw_text)
        class_match = re.search(r"CLASSIFICATION:\s*([^\n]+)", raw_text)
        office_match = re.search(r"(?:FIELD OFFICE|OFFICE OF ORIGIN):\s*([^\n]+)", raw_text)

        return {
            "case_id": override_case_id,
            "case_title": title_match.group(1).strip() if title_match else f"CASE {override_case_id}",
            "classification": class_match.group(1).strip() if class_match else "UNKNOWN",
            "field_office": office_match.group(1).strip() if office_match else "UNKNOWN"
        }

    def process_file(self, file_path: str, case_id: str) -> List[Dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8") as f:
            raw_text = f.read()

        global_meta = self.extract_metadata(raw_text, case_id)
        sections = re.split(r"(### SECTION \d+:[^\n]+)", raw_text)

        chunks: List[TextChunk] = []
        chunk_counter = 0

        if len(sections) > 1:
            for i in range(1, len(sections), 2):
                sec_title = sections[i].replace("#", "").strip()
                sec_content = sections[i + 1] if (i + 1) < len(sections) else ""
                for split_text in self.text_splitter.split_text(sec_content):
                    chunks.append(TextChunk(
                        chunk_id=f"{case_id}_CHUNK_{chunk_counter:04d}",
                        case_id=case_id, section_type=sec_title, chunk_index=chunk_counter,
                        text=split_text.strip(), metadata=global_meta
                    ))
                    chunk_counter += 1
        else:
            for split_text in self.text_splitter.split_text(raw_text):
                chunks.append(TextChunk(
                    chunk_id=f"{case_id}_CHUNK_{chunk_counter:04d}",
                    case_id=case_id, section_type="GENERAL_LOG", chunk_index=chunk_counter,
                    text=split_text.strip(), metadata=global_meta
                ))
                chunk_counter += 1

        return [asdict(c) for c in chunks]


def run_step1(case_id: str, file_path: str) -> str:
    print(f"\n[STEP 1] Starting Chunking for {os.path.basename(file_path)}...")
    preprocessor = CaseFilePreprocessor()
    chunked_data = preprocessor.process_file(file_path, case_id)

    base_name = os.path.splitext(os.path.basename(file_path))[0]
    output_path = os.path.join(os.path.dirname(file_path), f"{base_name}_step1_chunks.json")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(chunked_data, f, indent=2)

    print(f"  ✓ Saved {len(chunked_data)} chunks to {output_path}")
    return output_path