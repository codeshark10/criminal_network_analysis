import os
import json
import re
from collections import defaultdict, Counter
import networkx as nx
from typing import Dict, List, Any


def get_dominant_type(type_counter: Counter) -> str:
    """Returns the most frequent specific type, skipping generic UNKNOWN/ALIAS where possible."""
    if not type_counter:
        return "UNKNOWN"
    most_common = type_counter.most_common()
    for type_name, _ in most_common:
        if type_name not in ["UNKNOWN", "ALIAS"]:
            return type_name
    return most_common[0][0]


def resolve_entities_and_triplets(
    input_path: str = "extracted_triplets.json",
    output_path: str = "resolved_graph.json"
):
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file '{input_path}' not found. Ensure Step 3 completed successfully.")

    # Robust JSON loading with control character fallback
    with open(input_path, "r", encoding="utf-8", errors="replace") as f:
        try:
            chunk_results = json.load(f, strict=False)
        except json.JSONDecodeError:
            f.seek(0)
            raw_content = f.read()
            sanitized_content = re.sub(r"[\x00-\x1F]+", " ", raw_content)
            chunk_results = json.loads(sanitized_content, strict=False)

    print(f"Loaded {len(chunk_results)} chunk extractions. Resolving entity graph...")

    raw_entities: Dict[str, Counter] = defaultdict(Counter)  # lower_name -> Counter(types)
    canonical_names: Dict[str, str] = {}  # lower_name -> original display string
    alias_edges: List[tuple] = []  # candidate (sub_lower, obj_lower) edges

    # Role score tracking counters
    suspect_score = Counter()
    victim_score = Counter()
    witness_score = Counter()
    investigator_score = Counter()

    suspect_predicates = {
        "SUSPECTED_IN", "SUSPECTED_OF", "OPERATED", "TRANSFERRED_FUNDS",
        "FLED_TO", "COMMITTED", "LEADER_OF", "MEMBER_OF", "DIRECTED",
        "OWNED", "LAUNDERED", "PURCHASED", "SMUGGLED", "EXTORTED"
    }
    victim_predicates = {"VICTIM_OF", "EXTORTED_BY", "TARGETED_BY", "ROBBED_BY", "KILLED_BY", "ATTACKED_BY"}
    witness_predicates = {"WITNESSED", "REPORTED", "TESTIFIED_ABOUT", "OBSERVED", "INFORMED"}
    investigator_predicates = {
        "INVESTIGATED", "ASSIGNED_TO", "ARRESTED", "INTERROGATED",
        "SEIZED_EVIDENCE", "FILED_REPORT", "INTERVIEWED", "LEAD_INVESTIGATOR",
        "CONDUCTED_SURVEILLANCE", "ISSUED_WARRANT", "HANDLED", "OPENED_CASE"
    }

    all_triplets = []

    # ---------------------------------------------------------------------
    # STEP 1: PARSE ALL CHUNKS AND STORE RAW ENTITIES / ALIAS CANDIDATES
    # ---------------------------------------------------------------------
    for chunk in chunk_results:
        chunk_id = chunk.get("chunk_id", "")

        # Process entities defined in chunk
        for ent in chunk.get("entities", []):
            name = ent.get("name", "").strip()
            ent_type = ent.get("type", "UNKNOWN").upper().strip()
            if not name:
                continue

            name_lower = name.lower()
            raw_entities[name_lower][ent_type] += 1

            # Keep cleanest / longest canonical display capitalization
            if name_lower not in canonical_names or len(name) > len(canonical_names[name_lower]):
                canonical_names[name_lower] = name

            # Process explicit alias fields in entity definitions
            for alias in ent.get("aliases", []):
                alias_clean = alias.strip()
                if alias_clean:
                    alias_lower = alias_clean.lower()
                    raw_entities[alias_lower]["ALIAS"] += 1
                    if alias_lower not in canonical_names:
                        canonical_names[alias_lower] = alias_clean

                    # Record candidate alias edge
                    alias_edges.append((name_lower, alias_lower))

        # Process triplets
        for trip in chunk.get("triplets", []):
            sub = trip.get("subject", "").strip()
            obj = trip.get("object", "").strip()
            pred = trip.get("predicate", "").upper().strip()
            evidence = trip.get("evidence", "")

            if not sub or not obj:
                continue

            sub_lower, obj_lower = sub.lower(), obj.lower()

            if sub_lower not in canonical_names:
                canonical_names[sub_lower] = sub
            if obj_lower not in canonical_names:
                canonical_names[obj_lower] = obj

            # Alias triplets vs general relation triplets
            if pred in ["HAS_ALIAS", "KNOWN_AS", "AKA", "CODE_NAME"]:
                alias_edges.append((sub_lower, obj_lower))
            else:
                all_triplets.append({
                    "subject": sub_lower,
                    "predicate": pred,
                    "object": obj_lower,
                    "evidence": evidence,
                    "chunk_id": chunk_id
                })

            # Tally role scores
            if pred in suspect_predicates:
                suspect_score[sub_lower] += 1
            elif pred in victim_predicates:
                victim_score[sub_lower] += 1
            elif pred in witness_predicates:
                witness_score[sub_lower] += 1
            elif pred in investigator_predicates:
                investigator_score[sub_lower] += 1

    # ---------------------------------------------------------------------
    # STEP 2: BUILD TYPE-GUARDED GRAPH & COMPONENT RESOLUTION
    # ---------------------------------------------------------------------
    entity_dominant_types: Dict[str, str] = {}
    for name_lower, type_counts in raw_entities.items():
        entity_dominant_types[name_lower] = get_dominant_type(type_counts)

    alias_graph = nx.Graph()
    for name_lower in canonical_names:
        alias_graph.add_node(name_lower)

    # Type Category Mapping for strict separation
    TYPE_CATEGORIES = {
        "PERSON": "PERSON",
        "ALIAS": "PERSON",
        "INVESTIGATOR": "PERSON",
        "OFFICER": "PERSON",
        "AGENT": "PERSON",
        "ORGANIZATION": "ORGANIZATION",
        "LOCATION": "LOCATION",
        "PHONE": "PHONE",
        "VEHICLE": "VEHICLE",
        "BANK_ACCOUNT": "FINANCIAL",
        "CRYPTO_WALLET": "FINANCIAL",
        "UNKNOWN": "UNKNOWN"
    }

    # Guarded Edge Linking: Only connect if entity categories are compatible
    for sub_lower, obj_lower in alias_edges:
        type_sub = entity_dominant_types.get(sub_lower, "UNKNOWN")
        type_obj = entity_dominant_types.get(obj_lower, "UNKNOWN")

        cat_sub = TYPE_CATEGORIES.get(type_sub, "UNKNOWN")
        cat_obj = TYPE_CATEGORIES.get(type_obj, "UNKNOWN")

        # Non-person categories can ONLY merge with their exact matching category
        if cat_sub in ["LOCATION", "PHONE", "VEHICLE", "FINANCIAL", "ORGANIZATION"] or \
           cat_obj in ["LOCATION", "PHONE", "VEHICLE", "FINANCIAL", "ORGANIZATION"]:
            if cat_sub == cat_obj:
                alias_graph.add_edge(sub_lower, obj_lower)
        else:
            # Person / Alias / Unknown can merge
            if cat_sub in ["PERSON", "UNKNOWN"] and cat_obj in ["PERSON", "UNKNOWN"]:
                alias_graph.add_edge(sub_lower, obj_lower)

    # ---------------------------------------------------------------------
    # STEP 3: EXTRACT CONNECTED COMPONENTS & BUILD MASTER PROFILES
    # ---------------------------------------------------------------------
    alias_components = list(nx.connected_components(alias_graph))
    node_to_master: Dict[str, str] = {}
    master_profiles: Dict[str, Dict[str, Any]] = {}

    for component in alias_components:
        comp_list = list(component)

        # Determine dominant Entity Type for the cluster
        type_counter = Counter()
        for item in comp_list:
            type_counter.update(raw_entities[item])

        master_type = get_dominant_type(type_counter)

        # Pick canonical display name
        canonical_master_key = max(comp_list, key=lambda x: (len(canonical_names.get(x, x)), x))
        master_display_name = canonical_names.get(canonical_master_key, canonical_master_key)

        aliases = [
            canonical_names.get(item, item)
            for item in comp_list
            if canonical_names.get(item, item).lower() != master_display_name.lower()
        ]

        # Determine aggregate Master Role
        total_suspect = sum(suspect_score[item] for item in comp_list)
        total_victim = sum(victim_score[item] for item in comp_list)
        total_witness = sum(witness_score[item] for item in comp_list)
        total_investigator = sum(investigator_score[item] for item in comp_list)

        # Title regex match for law enforcement (e.g. Det. Miller, Agent Smith, Officer Davis)
        has_investigator_title = any(
            re.search(r'\b(det|detective|officer|agent|inspector|sergeant|deputy|investigator)\b', canonical_names.get(item, "").lower())
            for item in comp_list
        )

        if total_investigator > 0 or has_investigator_title or master_type in ["INVESTIGATOR", "OFFICER", "AGENT"]:
            role = "INVESTIGATOR"
        elif total_suspect > 0 and total_suspect >= max(total_victim, total_witness):
            role = "SUSPECT"
        elif total_victim > 0 and total_victim >= total_witness:
            role = "VICTIM"
        elif total_witness > 0:
            role = "WITNESS"
        else:
            role = master_type

        # Map all variants in component to master display name
        for item in comp_list:
            node_to_master[item] = master_display_name

        master_profiles[master_display_name] = {
            "canonical_name": master_display_name,
            "entity_type": master_type,
            "master_role": role,
            "aliases": list(set(aliases)),
            "mention_count": sum(sum(raw_entities[item].values()) for item in comp_list)
        }

    # ---------------------------------------------------------------------
    # STEP 4: REWRITE TRIPLETS TO CANONICAL NAMES & DEDUPLICATE
    # ---------------------------------------------------------------------
    resolved_triplets = []
    seen_triplets = set()

    for trip in all_triplets:
        sub_raw = trip["subject"]
        obj_raw = trip["object"]

        master_sub = node_to_master.get(sub_raw, canonical_names.get(sub_raw, sub_raw))
        master_obj = node_to_master.get(obj_raw, canonical_names.get(obj_raw, obj_raw))

        # Remove self-loops created by entity resolution
        if master_sub.lower() == master_obj.lower():
            continue

        triplet_key = f"{master_sub.lower()}|{trip['predicate']}|{master_obj.lower()}"
        if triplet_key not in seen_triplets:
            seen_triplets.add(triplet_key)
            resolved_triplets.append({
                "subject": master_sub,
                "predicate": trip["predicate"],
                "object": master_obj,
                "evidence": trip["evidence"],
                "chunk_id": trip["chunk_id"]
            })

    # ---------------------------------------------------------------------
    # STEP 5: SAVE FINAL DATASET
    # ---------------------------------------------------------------------
    final_output = {
        "summary": {
            "total_raw_chunks": len(chunk_results),
            "total_canonical_entities": len(master_profiles),
            "total_resolved_triplets": len(resolved_triplets)
        },
        "entities": list(master_profiles.values()),
        "triplets": resolved_triplets
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_output, f, indent=2)

    print("\n--- STEP 4 ENTITY RESOLUTION COMPLETE ---")
    print(f"Total Chunks Processed   : {len(chunk_results)}")
    print(f"Canonical Entities Built : {len(master_profiles)}")
    print(f"Unique Triplets Resolved : {len(resolved_triplets)}")
    print(f"Output saved to          : '{output_path}'")


if __name__ == "__main__":
    resolve_entities_and_triplets(
        input_path="extracted_triplets.json",
        output_path="resolved_graph.json"
    )