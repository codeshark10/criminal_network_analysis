import json
import re

def repair_extracted_triplets(file_path: str = "extracted_triplets.json"):
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # Clean unescaped control characters
    content = re.sub(r'[\x00-\x1F\x7F-\x9F]', ' ', content)

    # Match each chunk JSON block individually
    chunk_pattern = re.compile(r'\{\s*"chunk_id":.*?"triplets":\s*\[.*?\]\s*\}', re.DOTALL)
    raw_chunks = chunk_pattern.findall(content)

    valid_chunks = []
    skipped_count = 0

    for raw in raw_chunks:
        try:
            valid_chunks.append(json.loads(raw))
        except json.JSONDecodeError:
            # Secondary fix for unescaped interior quotes
            try:
                # Sanitize evidence string fields
                sanitized = re.sub(
                    r'("evidence"\s*:\s*").*?("\s*[,\}])',
                    lambda m: m.group(0).replace('\n', ' '),
                    raw
                )
                valid_chunks.append(json.loads(sanitized))
            except Exception:
                skipped_count += 1

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(valid_chunks, f, indent=2)

    print(f"✓ Successfully recovered {len(valid_chunks)} valid chunks.")
    if skipped_count:
        print(f"⚠️ Skipped {skipped_count} corrupted chunk objects.")

if __name__ == "__main__":
    repair_extracted_triplets()