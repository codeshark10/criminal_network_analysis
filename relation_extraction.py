import os
import json
import asyncio
import time
from typing import List, Dict
from pydantic import BaseModel, Field
import instructor
from openai import AsyncOpenAI


# --- 1. PYDANTIC SCHEMAS ---

class Entity(BaseModel):
    name: str = Field(description="Normalized primary name of the entity")
    type: str = Field(description="Entity type: PERSON, ALIAS, ORGANIZATION, LOCATION, PHONE, VEHICLE, BANK_ACCOUNT, CRYPTO_WALLET")
    aliases: List[str] = Field(default_factory=list, description="Any aliases or monikers directly mentioned")


class Triplet(BaseModel):
    subject: str = Field(description="Exact subject entity name")
    predicate: str = Field(description="Concise UPPERCASE relationship verb (e.g. HAS_ALIAS, COMMUNICATED_WITH, OPERATES)")
    object: str = Field(description="Exact object entity name")
    evidence: str = Field(description="Short direct quote supporting the relation")


class ChunkExtractionResult(BaseModel):
    entities: List[Entity] = Field(description="Entities identified in the chunk")
    triplets: List[Triplet] = Field(description="Relations extracted from the chunk")


# --- 2. ASYNC EXTRACTOR ---

class AsyncM5QwenExtractor:
    def __init__(
        self,
        model_name: str = "qwen2.5",
        ollama_base_url: str = "http://localhost:11434/v1",
        max_concurrent: int = 3,
        checkpoint_interval: int = 5
    ):
        self.model_name = model_name
        self.max_concurrent = max_concurrent
        self.checkpoint_interval = checkpoint_interval
        self.semaphore = asyncio.Semaphore(max_concurrent)

        self.client = instructor.from_openai(
            AsyncOpenAI(base_url=ollama_base_url, api_key="ollama"),
            mode=instructor.Mode.JSON
        )
        self._completed_count = 0
        self._lock = asyncio.Lock()

    async def extract_from_chunk(self, text: str) -> ChunkExtractionResult:
        system_prompt = (
            "Extract entities and explicit relationships from the criminal case file chunk.\n"
            "Rules:\n"
            "1. Extract primary entities and aliases.\n"
            "2. Predicates must be concise UPPERCASE verbs (e.g. HAS_ALIAS, OPERATES, TRANSFERRED_FUNDS).\n"
            "3. Provide short evidence quotes for each triplet."
        )

        async with self.semaphore:
            try:
                response = await self.client.chat.completions.create(
                    model=self.model_name,
                    response_model=ChunkExtractionResult,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f'Text:\n"""{text}"""'}
                    ],
                    temperature=0.0
                )
                return response
            except Exception as e:
                print(f"\n[Extraction Error]: {e}", flush=True)
                return ChunkExtractionResult(entities=[], triplets=[])

    async def _process_chunk_worker(
        self,
        idx: int,
        total_chunks: int,
        chunk: dict,
        results_dict: Dict[str, dict],
        output_path: str,
        start_time: float
    ):
        chunk_id = chunk.get("chunk_id", f"chunk_{idx}")
        text = chunk.get("text", "")

        if not text.strip():
            extraction = ChunkExtractionResult(entities=[], triplets=[])
        else:
            extraction = await self.extract_from_chunk(text)

        chunk_data = {
            "chunk_id": chunk_id,
            "case_id": chunk.get("case_id", "UNKNOWN"),
            "section_type": chunk.get("section_type", "GENERAL"),
            "entities": [e.model_dump() for e in extraction.entities],
            "triplets": [t.model_dump() for t in extraction.triplets]
        }

        async with self._lock:
            results_dict[chunk_id] = chunk_data
            self._completed_count += 1

            elapsed = time.time() - start_time
            avg_per_chunk = elapsed / self._completed_count
            remaining_sec = avg_per_chunk * (total_chunks - self._completed_count)

            # Print instant status update for every chunk
            print(
                f"✓ Chunk [{self._completed_count}/{total_chunks}] completed | "
                f"{(self._completed_count / total_chunks) * 100:.1f}% | "
                f"Est. Remaining: {remaining_sec / 60:.1f} mins",
                flush=True
            )

            if self._completed_count % self.checkpoint_interval == 0 or self._completed_count == total_chunks:
                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(list(results_dict.values()), f, indent=2)

    async def process_file(
        self,
        input_path: str = "coref_resolved_chunks.json",
        output_path: str = "extracted_triplets.json"
    ):
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input file '{input_path}' not found.")

        with open(input_path, "r", encoding="utf-8") as f:
            all_chunks = json.load(f)

        processed_map: Dict[str, dict] = {}
        if os.path.exists(output_path):
            try:
                with open(output_path, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
                    for item in existing_data:
                        processed_map[item["chunk_id"]] = item
                print(f"Resuming checkpoint: {len(processed_map)} chunks already processed.", flush=True)
            except Exception:
                processed_map = {}

        unprocessed_chunks = [
            (idx, chunk) for idx, chunk in enumerate(all_chunks, 1)
            if chunk.get("chunk_id", f"chunk_{idx}") not in processed_map
        ]

        total_chunks = len(all_chunks)
        remaining_count = len(unprocessed_chunks)

        if remaining_count == 0:
            print("All chunks already processed.", flush=True)
            return

        print(f"Processing {remaining_count} remaining chunks out of {total_chunks} total...", flush=True)

        self._completed_count = len(processed_map)
        start_time = time.time()

        tasks = [
            self._process_chunk_worker(
                idx, total_chunks, chunk, processed_map, output_path, start_time
            )
            for idx, chunk in unprocessed_chunks
        ]

        await asyncio.gather(*tasks)

        ordered_results = [
            processed_map[chunk.get("chunk_id", f"chunk_{idx}")]
            for idx, chunk in enumerate(all_chunks, 1)
            if chunk.get("chunk_id", f"chunk_{idx}") in processed_map
        ]

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(ordered_results, f, indent=2)

        total_time = (time.time() - start_time) / 60
        print(f"\nProcessing complete in {total_time:.2f} minutes.", flush=True)


async def main():
    extractor = AsyncM5QwenExtractor(
        model_name="qwen2.5",
        max_concurrent=3,
        checkpoint_interval=5
    )
    await extractor.process_file(
        input_path="coref_resolved_chunks.json",
        output_path="extracted_triplets.json"
    )

if __name__ == "__main__":
    asyncio.run(main())