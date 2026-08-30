import os
import json
import asyncio
import time
from typing import List, Dict
from pydantic import BaseModel, Field
import instructor
from openai import AsyncOpenAI


# Added EVENT to entity types
class Entity(BaseModel):
    name: str = Field(description="Normalized primary name of the entity")
    type: str = Field(
        description="Entity type: PERSON, ALIAS, ORGANIZATION, LOCATION, EVENT, PHONE, VEHICLE, BANK_ACCOUNT, CRYPTO_WALLET")
    aliases: List[str] = Field(default_factory=list, description="Any aliases or monikers directly mentioned")


class Triplet(BaseModel):
    subject: str = Field(description="Exact subject entity name")
    predicate: str = Field(description="Concise UPPERCASE relationship verb (e.g. INVOLVED_IN, COMMUNICATED_WITH)")
    object: str = Field(description="Exact object entity name")
    evidence: str = Field(description="Short direct quote supporting the relation")


class ChunkExtractionResult(BaseModel):
    entities: List[Entity] = Field(description="Entities identified in the chunk")
    triplets: List[Triplet] = Field(description="Relations extracted from the chunk")


class AsyncM5GemmaExtractor:
    def __init__(self, model_name: str = "gemma3:12b", max_concurrent: int = 3):
        self.model_name = model_name
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.client = instructor.from_openai(
            AsyncOpenAI(base_url="http://localhost:11434/v1", api_key="ollama"),
            mode=instructor.Mode.JSON
        )
        self._completed_count = 0
        self._lock = asyncio.Lock()

    async def extract_from_chunk(self, text: str) -> ChunkExtractionResult:
        system_prompt = (
            "You are a Senior Intelligence Analyst specializing in criminal network topology. "
            "Your objective is to read raw, noisy case files and extract a perfectly clean, atomic, deduplicated intelligence graph across any crime domain.\n\n"

            "CRITICAL DIRECTIVES FOR ENTITIES:\n"
            "1. ATOMIC EXTRACTION (NO COMPOUND NODES): NEVER extract grouped entities. "
            "If the text says 'Leon Vance and his brother Marcus', extract 'Leon Vance' and 'Marcus Vance' as TWO separate PERSON entities. NEVER create 'Leon and Marcus'.\n"
            "2. THE 'PROPER NAME' RULE: Group all variations of a single person into ONE entity using their longest, most formal name as the primary `name`. "
            "Put nicknames and street monikers into the `aliases` array.\n"
            "3. EVENT NODES: Treat operations, crimes, meetings, and raids as 'EVENT' entities.\n\n"

            "CRITICAL DIRECTIVES FOR RELATIONSHIPS:\n"
            "4. ALIAS NORMALIZATION: When creating triplets, you MUST link actions to the primary `name`, NEVER the alias. "
            "If 'Viper' shoots someone, make 'Leon Vance' the subject.\n"
            "5. UNIVERSAL PREDICATE HIERARCHY: You must distinguish masterminds from associates and victims using these exact predicates:\n"
            "   - COMMAND/APEX: 'ORCHESTRATED', 'DIRECTED', 'ORDERED' (For the mastermind/leader).\n"
            "   - EXECUTION/ASSOCIATE: 'PARTICIPATED_IN', 'EXECUTED', 'ASSISTED' (For the followers/subordinates).\n"
            "   - VICTIMS: 'VICTIM_OF', 'TARGETED_BY', 'ASSAULTED_BY', 'EXTORTED_BY'.\n"
            "   - LOGISTICS & COMM: 'COMMUNICATED_WITH', 'TRANSFERRED_ASSET_TO', 'LOCATED_AT', 'ASSOCIATED_WITH'.\n"
            "   - LAW ENFORCEMENT: 'INVESTIGATED', 'ARRESTED', 'CHARGED'.\n\n"

            "--- EXAMPLE TRAINING CASE ---\n"
            "RAW TEXT: 'On Oct 5, apex target Leon Vance, known as \"Viper\", and his brother Marcus Vance robbed the Pacific Bank. Viper orchestrated the heist, while Marcus assaulted teller Sarah Jenkins. Detective Smith arrested the brothers later.'\n"
            "EXPECTED ENTITIES:\n"
            "- Name: 'Leon Vance' | Type: 'PERSON' | Aliases: ['Viper', 'Vance']\n"
            "- Name: 'Marcus Vance' | Type: 'PERSON' | Aliases: ['Marcus']\n"
            "- Name: 'Pacific Bank Heist' | Type: 'EVENT' | Aliases: []\n"
            "EXPECTED TRIPLETS:\n"
            "- Subject: 'Leon Vance' | Predicate: 'ORCHESTRATED' | Object: 'Pacific Bank Heist' | Evidence: 'Viper orchestrated the heist'\n"
            "- Subject: 'Marcus Vance' | Predicate: 'PARTICIPATED_IN' | Object: 'Pacific Bank Heist' | Evidence: 'Marcus Vance robbed the Pacific Bank'\n"
            "- Subject: 'Sarah Jenkins' | Predicate: 'VICTIM_OF' | Object: 'Marcus Vance' | Evidence: 'Marcus assaulted teller Sarah Jenkins'\n"
            "- Subject: 'Detective Smith' | Predicate: 'ARRESTED' | Object: 'Leon Vance' (NOT 'the brothers') | Evidence: 'Detective Smith arrested the brothers later'\n"
            "- Subject: 'Detective Smith' | Predicate: 'ARRESTED' | Object: 'Marcus Vance' | Evidence: 'Detective Smith arrested the brothers later'\n"
            "-----------------------------\n\n"

            "Extract entities and relationships following this exact logic. Provide exact short quotes for `evidence`."
        )

        async with self.semaphore:
            try:
                return await self.client.chat.completions.create(
                    model=self.model_name,
                    response_model=ChunkExtractionResult,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f'Text:\n"""{text}"""'}
                    ],
                    temperature=0.0,
                    extra_body={
                        "options": {
                            "num_ctx": 2048,
                            "num_predict": 1024
                        }
                    }
                )
            except Exception as e:
                print(f"\n[Extraction Error]: {e}", flush=True)
                return ChunkExtractionResult(entities=[], triplets=[])

    async def process_chunk_worker(self, idx: int, total: int, chunk: dict, results: dict, output_path: str,
                                   start_time: float):
        chunk_id = chunk.get("chunk_id", f"chunk_{idx}")
        text = chunk.get("text", "")
        extraction = await self.extract_from_chunk(text) if text.strip() else ChunkExtractionResult(entities=[],
                                                                                                    triplets=[])

        chunk_data = {
            "chunk_id": chunk_id, "case_id": chunk.get("case_id", "UNKNOWN"),
            "section_type": chunk.get("section_type", "GENERAL"),
            "entities": [e.model_dump() for e in extraction.entities],
            "triplets": [t.model_dump() for t in extraction.triplets]
        }

        async with self._lock:
            results[chunk_id] = chunk_data
            self._completed_count += 1
            if self._completed_count % 5 == 0 or self._completed_count == total:
                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(list(results.values()), f, indent=2)
                print(f"  -> Extracted [{self._completed_count}/{total}] chunks...", flush=True)


async def run_step3(input_path: str) -> str:
    print(f"\n[STEP 3] Starting LLM Extraction via Gemma 3 (12B)...")
    base_dir = os.path.dirname(input_path)
    base_name = os.path.basename(input_path).replace("_step2_coref.json", "")
    output_path = os.path.join(base_dir, f"{base_name}_step3_triplets.json")

    with open(input_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    extractor = AsyncM5GemmaExtractor()
    results_map = {}

    start_time = time.time()
    tasks = [extractor.process_chunk_worker(idx, len(chunks), c, results_map, output_path, start_time) for idx, c in
             enumerate(chunks, 1)]
    await asyncio.gather(*tasks)

    # Re-order and final save
    ordered_results = [results_map[c.get("chunk_id")] for c in chunks if c.get("chunk_id") in results_map]
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(ordered_results, f, indent=2)

    print(f"  ✓ Extraction complete -> {output_path}")
    return output_path