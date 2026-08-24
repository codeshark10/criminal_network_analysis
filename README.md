# NEXUS — AI-Powered Criminal Network Analysis

A polished frontend prototype for Smart India Hackathon Problem Statement **SIH26189** — AI-Powered Criminal Network Analysis System, Ministry of Home Affairs / NCRB Women Safety Division.

NEXUS turns fragmented simulated intelligence into an interactive knowledge graph, evidence-backed investigation leads, and clear workflows for investigator review. It is deliberately a **frontend-only demonstration**: all cases, entities, evidence, relationships, and indicators are synthetic.

## Run locally

```bash
npm install
npm run dev
```

Open the address shown by Vite (normally `http://localhost:5173`). For a production validation build:

```bash
npm run build
```

## Included workflows

- **Known suspect investigation:** Select Marcus Thorne (or another person), run the staged analysis sequence, expand the connected graph, and open prioritized candidate profiles.
- **Unknown suspect investigation:** Select a case, simulate extraction/resolution/graph analysis, and inspect AI-assisted investigation candidates.
- **Network analysis workspace:** Filter entity and relationship types, select/dim connected nodes, drag nodes, zoom, reset, and inspect an entity panel.
- **Evidence intelligence:** Search/filter records, open synthetic source details, and review extracted entities and relationships.
- **Timeline, alerts, analytics, data sources, settings, and responsive navigation** are all functional with local mock data.

## Architecture

```text
React UI
  └─ Pages and reusable components
       └─ Services (src/services/intelligenceService.ts)
            └─ Centralized synthetic graph and case data (src/data/mockData.ts)
                 └─ Neo4j-compatible concepts: nodes, relationships, properties
```

The UI does not access mock data directly for asynchronous analysis flows. The service layer is deliberately structured so future implementations can replace synthetic returns with secured API calls or Neo4j adapters without rewriting page components.

## Key folders

- `src/types` — Shared TypeScript entities, relationships, evidence, alerts, cases and candidate types.
- `src/data` — Centralized synthetic data for 30 people, organizations, locations, devices, vehicles, accounts, transactions, events, evidence and meaningful relationships.
- `src/services` — Future API/Neo4j replacement seam and deterministic analysis simulation.
- `src/components` — Application shell, reusable UI elements and interactive SVG graph.
- `src/pages` — Overview, investigation modes, graph workspace, intelligence pages and operations pages.

## Ethical presentation

Scores represent **Investigation Priority**, not criminality or guilt. The interface clearly describes all outputs as AI-assisted leads requiring investigator verification, and maintains a synthetic-data label throughout the demonstration.
