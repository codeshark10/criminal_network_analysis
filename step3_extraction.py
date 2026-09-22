import os
import json
import asyncio
import time
import re
from typing import List, Dict, Optional
from pydantic import BaseModel, Field, field_validator
import instructor
from openai import AsyncOpenAI

# -------------------------------------------------------------------
# LAW ENFORCEMENT BLACKLIST FILTER (Safety Net)
# -------------------------------------------------------------------

LAW_ENFORCEMENT_KEYWORDS = [
    r"\binspector\b", r"\bpsi\b", r"\bpi\b", r"\bdetective\b", r"\bofficer\b",
    r"\bconstable\b", r"\bpolice\b", r"\bcop\b", r"\bsub-inspector\b", r"\bcbi\b",
    r"\bed\b", r"\bprosecutor\b", r"\bjudge\b", r"\bcourt\b", r"\binvestigator\b",
    r"\bforensic\b", r"\bhead constable\b", r"\bsp\b", r"\bdcp\b", r"\bacp\b"
]


def is_law_enforcement(text: str) -> bool:
    """Returns True if the text refers to law enforcement or court officials."""
    if not text:
        return False
    text_lower = text.lower()
    for pattern in LAW_ENFORCEMENT_KEYWORDS:
        if re.search(pattern, text_lower):
            return True
    return False


# -------------------------------------------------------------------
# PYDANTIC MODELS (Hardened against LLM null/empty outputs)
# -------------------------------------------------------------------

class Entity(BaseModel):
    name: str = Field(description="Normalized primary name of the entity")
    type: str = Field(
        description="Entity type: PERSON, ALIAS, ORGANIZATION, LOCATION, EVENT, PHONE, VEHICLE, BANK_ACCOUNT, CRYPTO_WALLET")
    aliases: List[str] = Field(default_factory=list, description="Any aliases or monikers directly mentioned")

    @field_validator("name", "type", mode="before")
    @classmethod
    def coerce_none_to_str(cls, v):
        return "" if v is None else str(v)


class Triplet(BaseModel):
    subject: str = Field(description="Exact subject entity name")
    predicate: str = Field(description="Concise UPPERCASE relationship verb")
    object: str = Field(description="Exact object entity name")
    evidence: str = Field(description="Short direct quote supporting the relation")

    @field_validator("subject", "predicate", "object", "evidence", mode="before")
    @classmethod
    def coerce_none_to_str(cls, v):
        return "" if v is None else str(v)


class ChunkExtractionResult(BaseModel):
    entities: List[Entity] = Field(default_factory=list, description="Entities identified in the chunk")
    triplets: List[Triplet] = Field(default_factory=list, description="Relations extracted from the chunk")


# -------------------------------------------------------------------
# EXTRACTION WORKER
# -------------------------------------------------------------------

class AsyncM5GemmaExtractor:
    def __init__(self, model_name: str = "gemma2:9b", max_concurrent: int = 1):
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
            "You are a Lead Forensic Graph Architect specializing in CRIMINAL NETWORK TOPOLOGY.\n"
            "Your objective is to map criminal conspiracies, cartels, masterminds, assets, and victims.\n\n"

            "======================================================================\n"
            "CRITICAL EXCLUSION DIRECTIVE (DO NOT EXTRACT LAW ENFORCEMENT)\n"
            "======================================================================\n"
            "1. NEVER extract Police Officers, Inspectors, Detectives, PSIs, Constables, "
            "Police Stations, Courts, Judges, or Prosecutors as entities.\n"
            "2. IGNORE all legal actions taken by police (e.g., 'Inspector Shinde arrested Raju', "
            "'Spot Panchnama done by PSI Kulkarni'). DO NOT create triplets for police actions.\n"
            "3. Focus EXCLUSIVELY on the actors who committed the crime, their handlers, their associates, "
            "their victims, and their financial/physical assets.\n\n"

            "======================================================================\n"
            "RULE 1: TARGET ENTITY TYPES\n"
            "======================================================================\n"
            "Extract ONLY the following entity categories:\n"
            "- SUSPECTS / MASTERMINDS / ASSOCIATES (Type: PERSON)\n"
            "- VICTIMS / COMPLAINANTS (Type: PERSON)\n"
            "- ORGANIZATIONS / FRONT COMPANIES (Type: ORGANIZATION)\n"
            "- CRIME SCENES / HIDEOUTS (Type: LOCATION)\n"
            "- HEISTS / RAIDS / MEETINGS / OPERATIONS (Type: EVENT)\n"
            "- VEHICLES / PHONES / ACCOUNTS / WALLETS (Type: VEHICLE, PHONE, BANK_ACCOUNT, CRYPTO_WALLET)\n\n"

            "CRITICAL ENTITY RULES:\n"
            "- ATOMIC EXTRACTION: NEVER create compound entities like 'Raju and Anil'. Extract 'Raju Sharma' and 'Anil Kulkarni' as two separate entities.\n"
            "- PROPER NAME NORMALIZATION: Always use the longest, most formal name as the primary `name`. Group nicknames/monikers into `aliases`.\n\n"

            "======================================================================\n"
            "RULE 2: DIRECTIONAL RELATIONSHIP MATRIX (TRIPLETS)\n"
            "======================================================================\n"
            "Extract relationships strictly between criminal actors, victims, and assets using these UPPERCASE predicates:\n\n"

            "A. MASTERMIND COMMAND & CONTROL (Mastermind -> Associate/Event):\n"
            "   - 'ORCHESTRATED' | 'DIRECTED' | 'ORDERED' | 'HANDLED' | 'FINANCED'\n"
            "   (Example: Subject='Bhai', Predicate='DIRECTED', Object='Rajesh Sharma')\n\n"

            "B. CRIMINAL EXECUTION & CO-CONSPIRACY (Suspect -> Event/Associate/Item):\n"
            "   - 'PARTICIPATED_IN' | 'EXECUTED' | 'ASSOCIATED_WITH' | 'COMMUNICATED_WITH' | 'OPERATED_VEHICLE' | 'POSSESSED_ITEM'\n"
            "   (Example: Subject='Rajesh Sharma', Predicate='OPERATED_VEHICLE', Object='Tata Harrier')\n\n"

            "C. VICTIMIZATION (Suspect -> Victim OR Victim -> Event):\n"
            "   - Suspect to Victim: 'ASSAULTED' | 'TARGETED' | 'DEFRAUDED' | 'EXTORTED'\n"
            "   - Victim to Event/Crime: 'VICTIM_OF'\n"
            "   (Example: Subject='Rajesh Sharma', Predicate='DEFRAUDED', Object='Priya Nair')\n\n"

            "D. FINANCIAL & ASSET FLOWS (Entity -> Bank/Account/Crypto):\n"
            "   - 'TRANSFERRED_FUNDS_TO' | 'DEPOSITED_INTO' | 'LAUNDERED_VIA'\n\n"

            "======================================================================\n"
            "FEW-SHOT TRAINING EXEMPLAR\n"
            "======================================================================\n"
            "RAW TEXT: 'Inspector R. Shinde intercepted a Tata Harrier driven by suspect Rajesh \"Raju\" Sharma. Raju confessed he acted on orders from Dubai handler Bhai and robbed teller Priya Nair. Spot Panchnama conducted by PSI Kulkarni.'\n"
            "EXPECTED ENTITIES:\n"
            "- Name: 'Rajesh Sharma' | Type: 'PERSON' | Aliases: ['Raju', 'Raju Sharma']\n"
            "- Name: 'Bhai' | Type: 'PERSON' | Aliases: []\n"
            "- Name: 'Priya Nair' | Type: 'PERSON' | Aliases: []\n"
            "- Name: 'Tata Harrier' | Type: 'VEHICLE' | Aliases: []\n"
            "(Notice: Inspector Shinde and PSI Kulkarni are COMPLETELY OMITTED).\n\n"
            "EXPECTED TRIPLETS:\n"
            "- Subject: 'Bhai' | Predicate: 'DIRECTED' | Object: 'Rajesh Sharma'\n"
            "- Subject: 'Rajesh Sharma' | Predicate: 'OPERATED_VEHICLE' | Object: 'Tata Harrier'\n"
            "- Subject: 'Rajesh Sharma' | Predicate: 'DEFRAUDED' | Object: 'Priya Nair'\n"
            "======================================================================\n\n"

            "Extract entities and triplets following this exact hierarchy. Return empty lists if no criminal entities exist. "
            "NEVER include police, inspectors, or courts in the output."
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
                    max_retries=1,
                    extra_body={
                        "options": {
                            "num_ctx": 2048,
                            "num_predict": 1024
                        }
                    }
                )
            except Exception as e:
                print(f"\n[Extraction Warning]: Handled chunk failure gracefully: {e}", flush=True)
                return ChunkExtractionResult(entities=[], triplets=[])

    async def process_chunk_worker(self, idx: int, total: int, chunk: dict, results: dict, output_path: str,
                                   start_time: float):
        chunk_id = chunk.get("chunk_id", f"chunk_{idx}")
        text = chunk.get("text", "")
        extraction = await self.extract_from_chunk(text) if text.strip() else ChunkExtractionResult(entities=[],
                                                                                                    triplets=[])

        # -------------------------------------------------------------------
        # LAYER 2: HARDENED PYTHON FILTERING (Purges Law Enforcement)
        # -------------------------------------------------------------------

        # 1. Filter Entities
        valid_entities = [
            e.model_dump() for e in extraction.entities
            if e.name.strip() and not is_law_enforcement(e.name)
        ]

        # 2. Filter Triplets (Ensures neither Subject nor Object is Law Enforcement)
        valid_triplets = [
            t.model_dump() for t in extraction.triplets
            if t.subject.strip() and t.object.strip()
               and not is_law_enforcement(t.subject)
               and not is_law_enforcement(t.object)
        ]

        chunk_data = {
            "chunk_id": chunk_id,
            "case_id": chunk.get("case_id", "UNKNOWN"),
            "section_type": chunk.get("section_type", "GENERAL"),
            "entities": valid_entities,
            "triplets": valid_triplets
        }

        async with self._lock:
            results[chunk_id] = chunk_data
            self._completed_count += 1
            if self._completed_count % 5 == 0 or self._completed_count == total:
                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(list(results.values()), f, indent=2)
                print(f"  -> Extracted [{self._completed_count}/{total}] chunks...", flush=True)


# -------------------------------------------------------------------
# PIPELINE ENTRY POINT
# -------------------------------------------------------------------

async def run_step3(input_path: str) -> str:
    print(f"\n[STEP 3] Starting LLM Extraction via Gemma 2 (9B) [Law Enforcement Filter Active]...")
    base_dir = os.path.dirname(input_path)
    base_name = os.path.basename(input_path).replace("_step2_coref.json", "")
    output_path = os.path.join(base_dir, f"{base_name}_step3_triplets.json")

    with open(input_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    extractor = AsyncM5GemmaExtractor()
    results_map = {}

    start_time = time.time()
    tasks = [
        extractor.process_chunk_worker(idx, len(chunks), c, results_map, output_path, start_time)
        for idx, c in enumerate(chunks, 1)
    ]
    await asyncio.gather(*tasks)

    # Re-order and final save
    ordered_results = [results_map[c.get("chunk_id")] for c in chunks if c.get("chunk_id") in results_map]
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(ordered_results, f, indent=2)

    print(f"  ✓ Extraction complete -> {output_path}")
    return output_path