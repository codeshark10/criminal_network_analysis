import os
import re
import json
import uuid
import random
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter


# ==========================================
# STEP 0: GENERATE SINGLE-CASE COHERENT DOSSIER IF MISSING
# ==========================================
def generate_single_case_dossier_if_missing(filename="FBI_SINGLE_CASE_DOSSIER_100P.txt", total_entries=300):
    """
    Generates a coherent, single-case FBI dossier (100+ pages of text)
    where all records reference the SAME core network of entities chronologically.
    """
    if os.path.exists(filename):
        print(f"Found existing case dossier: {filename}")
        return

    print(f"Generating coherent single-case FBI dossier: {filename}...")

    CASE_ID = "268A-CH-90412"
    OPERATION_NAME = "OPERATION BLACK HORIZON"
    CLASSIFICATION = "TOP SECRET // ORCON // LAW ENFORCEMENT SENSITIVE"
    FIELD_OFFICE = "CHICAGO DIVISION (SQUAD C-14)"

    SUSPECTS = [
        {"name": "Elena Rostova", "alias": "The Tsaritsa", "role": "Syndicate Head", "phone": "+1-312-555-0188"},
        {"name": "Victor Vance", "alias": "The Tailor", "role": "Logistics Broker", "phone": "+1-312-555-0199"},
        {"name": "Marcus Thorne", "alias": "Enforcer", "role": "Field Operations", "phone": "+1-202-555-0143"},
        {"name": "Sarah Lin", "alias": "Accountant", "role": "Financial Handler", "phone": "+1-619-555-0122"},
        {"name": "Tariq Mansoor", "alias": "Ghost", "role": "Transport Lead", "phone": "+1-973-555-0167"},
        {"name": "Carlos Mendez", "alias": "El Toro", "role": "Supplier Liaison", "phone": "+1-619-555-0199"}
    ]

    ENTITIES_ORGS = [
        "Apex Freight Logistics (1428 Elmwood Ave, Chicago IL)",
        "Meridian Holdings LLC (Shell Entity #8840)",
        "Pacific Import Export Co. (San Diego, CA)",
        "Horizon Global Transfer (Account HGT-9011)"
    ]

    LOCATIONS = [
        "1428 Elmwood Avenue, Chicago, IL (Apex Freight HQ)",
        "Pier 4, Gary Port Facility, Gary, IN",
        "304 Pier Road, Gary, IN (Lakeside Bistro)",
        "412 Oak Street, Paterson, NJ (Safehouse Alpha)",
        "88 Industrial Parkway, Newark, NJ (Warehouse Depot)"
    ]

    ACCOUNTS = [
        "First National Bank Acc #8839-10294-US",
        "Bank of America Acc #5540-1920-3341",
        "Crypto Wallet 0x71C...3A9D (Darknet Link)"
    ]

    VEHICLES = [
        "Black 2021 Ford Explorer (IL Plate: 7XYZ-89)",
        "Silver Audi Q7 (VIN: WA1VAAFE4CD019283)",
        "White Freightliner Semi-Truck (Lic: TRK-9901)"
    ]

    AGENTS = ["SA David Ruiz (ID: 8842)", "SA Sarah Jenkins (ID: 4102)", "SA Michael Chang (ID: 9910)"]

    start_date = datetime(2025, 8, 1, 6, 0, 0)

    with open(filename, "w", encoding="utf-8") as f:
        # File Header
        f.write("=" * 80 + "\n")
        f.write("FEDERAL BUREAU OF INVESTIGATION - MASTER CASE FILE\n")
        f.write(f"CASE TITLE: {OPERATION_NAME}\n")
        f.write(f"FILE NUMBER: {CASE_ID}\n")
        f.write(f"CLASSIFICATION: {CLASSIFICATION}\n")
        f.write(f"OFFICE OF ORIGIN: {FIELD_OFFICE}\n")
        f.write("=" * 80 + "\n\n")

        for i in range(1, total_entries + 1):
            start_date += timedelta(hours=random.randint(1, 12), minutes=random.randint(0, 59))
            timestamp_str = start_date.strftime("%Y-%m-%d %H:%M:%S EST")

            s1, s2 = random.sample(SUSPECTS, 2)
            loc = random.choice(LOCATIONS)
            org = random.choice(ENTITIES_ORGS)
            acct = random.choice(ACCOUNTS)
            veh = random.choice(VEHICLES)
            agent = random.choice(AGENTS)

            record_type = random.choice([
                "FD-302 SURVEILLANCE",
                "WIRETAP INTERCEPT",
                "FINANCIAL AUDIT LOG",
                "CDR CELLULAR TOWER LOG"
            ])

            f.write(f"### SECTION {i}: {record_type}\n")
            f.write(f"FILE REF: {CASE_ID}\n")
            f.write(f"DATE/TIME: {timestamp_str}\n")
            f.write(f"REPORTING AGENT: {agent}\n")
            f.write(f"PRIMARY SUBJECTS: {s1['name']} ({s1['alias']}), {s2['name']} ({s2['alias']})\n")

            if record_type == "FD-302 SURVEILLANCE":
                f.write("NARRATIVE:\n")
                f.write(f"On {timestamp_str}, surveillance team observed {s1['name']} operating {veh}. ")
                f.write(f"Subject traveled directly to {loc} where a clandestine meeting occurred with {s2['name']}. ")
                f.write(f"Subjects were observed discussing operations related to {org}. ")
                f.write(f"Subject {s2['name']} was seen carrying a sealed package into the facility.\n")

            elif record_type == "WIRETAP INTERCEPT":
                f.write(f"TARGET LINE: {s1['phone']} ({s1['name']}) -> {s2['phone']} ({s2['name']})\n")
                f.write("TRANSCRIPT:\n")
                f.write(f"  [{timestamp_str}] {s1['name']}: 'Did you authorize the release for {org}?'\n")
                f.write(f"  [{timestamp_str}] {s2['name']}: 'It is pending at {loc}. We need ${random.randint(50, 500)},000 sent to {acct}.'\n")
                f.write(f"  [{timestamp_str}] {s1['name']}: 'Make sure {s2['alias']} handles the transport in the {veh}.'\n")

            elif record_type == "FINANCIAL AUDIT LOG":
                f.write("TRANSACTION RECORD:\n")
                f.write(f"  Originator: {s1['name']} / {org}\n")
                f.write(f"  Destination Account: {acct}\n")
                f.write(f"  Amount: ${random.randint(25, 950)},000.00 USD\n")
                f.write(f"  Notes: Suspicious activity flag triggered. Linked to phone {s1['phone']} active at {loc}.\n")

            elif record_type == "CDR CELLULAR TOWER LOG":
                f.write("CELLULAR INTERCEPT DATA:\n")
                f.write(f"  Device A: {s1['name']} ({s1['phone']}) | Device B: {s2['name']} ({s2['phone']})\n")
                f.write(f"  Cell Tower Sector: T-902 ({loc})\n")
                f.write(f"  Event: Call duration {random.randint(15, 450)} seconds. Ping coordinates confirm both subjects in proximity.\n")

            f.write("-" * 80 + "\n\n")

    print(f"File '{filename}' generated successfully ({total_entries} records).")


# ==========================================
# STEP 1: CHUNKING & PREPROCESSING
# ==========================================
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

    def extract_metadata(self, raw_text: str) -> Dict[str, str]:
        case_match = re.search(r"(?:FILE NUMBER|FILE REFERENCE|FILE REF):\s*([A-Z0-9\-]+)", raw_text)
        title_match = re.search(r"CASE TITLE:\s*([^\n]+)", raw_text)
        class_match = re.search(r"CLASSIFICATION:\s*([^\n]+)", raw_text)
        office_match = re.search(r"(?:FIELD OFFICE|OFFICE OF ORIGIN):\s*([^\n]+)", raw_text)

        return {
            "case_id": case_match.group(1).strip() if case_match else "268A-CH-90412",
            "case_title": title_match.group(1).strip() if title_match else "OPERATION BLACK HORIZON",
            "classification": class_match.group(1).strip() if class_match else "TOP SECRET",
            "field_office": office_match.group(1).strip() if office_match else "CHICAGO DIVISION"
        }

    def process_file(self, file_path: str) -> List[Dict[str, Any]]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Cannot find target file at path: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            raw_text = f.read()

        global_meta = self.extract_metadata(raw_text)

        # Split by section markers or fallback to raw content
        sections = re.split(r"(### SECTION \d+:[^\n]+)", raw_text)

        chunks: List[TextChunk] = []
        chunk_counter = 0

        if len(sections) > 1:
            for i in range(1, len(sections), 2):
                sec_title = sections[i].replace("#", "").strip()
                sec_content = sections[i + 1] if (i + 1) < len(sections) else ""

                for split_text in self.text_splitter.split_text(sec_content):
                    chunks.append(TextChunk(
                        chunk_id=f"{global_meta['case_id']}_CHUNK_{chunk_counter:04d}",
                        case_id=global_meta["case_id"],
                        section_type=sec_title,
                        chunk_index=chunk_counter,
                        text=split_text.strip(),
                        metadata=global_meta
                    ))
                    chunk_counter += 1
        else:
            for split_text in self.text_splitter.split_text(raw_text):
                chunks.append(TextChunk(
                    chunk_id=f"{global_meta['case_id']}_CHUNK_{chunk_counter:04d}",
                    case_id=global_meta["case_id"],
                    section_type="GENERAL_LOG",
                    chunk_index=chunk_counter,
                    text=split_text.strip(),
                    metadata=global_meta
                ))
                chunk_counter += 1

        return [asdict(c) for c in chunks]


# ==========================================
# MAIN EXECUTION
# ==========================================
if __name__ == "__main__":
    target_file = "FBI_SINGLE_CASE_DOSSIER_100P.txt"

    # 1. Ensure coherent dataset exists
    generate_single_case_dossier_if_missing(target_file, total_entries=300)

    # 2. Run Preprocessor
    preprocessor = CaseFilePreprocessor(chunk_size=800, chunk_overlap=150)
    chunked_data = preprocessor.process_file(target_file)

    # 3. Save JSON output
    output_json = "preprocessed_chunks.json"
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(chunked_data, f, indent=2)

    print(f"\nSUCCESS: Generated {len(chunked_data)} chunks saved to '{output_json}'.")
    print("\n--- SAMPLE EXTRACTED CHUNK (Chunk #0) ---")
    print(json.dumps(chunked_data[0], indent=2))