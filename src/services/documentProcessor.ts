// ============================================================
// NEXUS — Document Processing Engine
// Semantic chunking + weighted classification + alert generation
// Frontend-side processing for uploaded .txt case documents
// ============================================================

import type { ExtractedChunk, ChunkCategory, Alert } from '../types';

// ── Scoring tables ────────────────────────────────────────────

type KeywordRule = { pattern: RegExp | string; score: number };

const CATEGORY_RULES: Record<ChunkCategory, KeywordRule[]> = {
  FIR: [
    { pattern: /\bFIR\b/i, score: 4 },
    { pattern: /first information report/i, score: 4 },
    { pattern: /fir no\.?/i, score: 4 },
    { pattern: /complaint no\.?/i, score: 3 },
    { pattern: /police station/i, score: 3 },
    { pattern: /\baccused\b/i, score: 2 },
    { pattern: /\bIPC\b/, score: 2 },
    { pattern: /\bBNS\b/, score: 2 },
    { pattern: /section \d+/i, score: 2 },
    { pattern: /offence/i, score: 2 },
    { pattern: /complainant/i, score: 2 },
    { pattern: /\bincident\b/i, score: 1 },
    { pattern: /date of incident/i, score: 2 },
    { pattern: /\bcrime\b/i, score: 1 },
  ],
  CDR: [
    { pattern: /\bCDR\b/, score: 5 },
    { pattern: /call detail record/i, score: 5 },
    { pattern: /cell tower/i, score: 4 },
    { pattern: /\bIMEI\b/, score: 4 },
    { pattern: /call duration/i, score: 3 },
    { pattern: /outgoing call/i, score: 3 },
    { pattern: /incoming call/i, score: 3 },
    { pattern: /\bSIM\b/, score: 3 },
    { pattern: /\bcaller\b/i, score: 2 },
    { pattern: /\breceiver\b/i, score: 2 },
    { pattern: /call timestamp/i, score: 3 },
    { pattern: /sms metadata/i, score: 3 },
    { pattern: /tower location/i, score: 3 },
    { pattern: /called .{0,40} times/i, score: 3 },
    { pattern: /\d{10}\b/, score: 1 }, // 10-digit phone number pattern
    { pattern: /mobile number/i, score: 2 },
    { pattern: /phone number/i, score: 2 },
  ],
  FINANCIAL: [
    { pattern: /₹\s*[\d,]+/i, score: 5 },
    { pattern: /\bNEFT\b/, score: 4 },
    { pattern: /\bRTGS\b/, score: 4 },
    { pattern: /\bIMPS\b/, score: 4 },
    { pattern: /\bUPI\b/, score: 4 },
    { pattern: /bank account/i, score: 3 },
    { pattern: /account number/i, score: 3 },
    { pattern: /\bIFSC\b/, score: 3 },
    { pattern: /\btransaction\b/i, score: 3 },
    { pattern: /\btransfer\b/i, score: 2 },
    { pattern: /\bINR\b/, score: 3 },
    { pattern: /\bdeposit\b/i, score: 2 },
    { pattern: /\bwithdrawal\b/i, score: 2 },
    { pattern: /\bcredit\b/i, score: 1 },
    { pattern: /\bdebit\b/i, score: 1 },
    { pattern: /cryptocurrency/i, score: 3 },
    { pattern: /hawala/i, score: 4 },
    { pattern: /money laundering/i, score: 4 },
    { pattern: /\bwallet\b/i, score: 2 },
    { pattern: /\bpayment\b/i, score: 1 },
    { pattern: /\bamount\b/i, score: 1 },
  ],
  SURVEILLANCE: [
    { pattern: /\bCCTV\b/i, score: 5 },
    { pattern: /surveillance footage/i, score: 5 },
    { pattern: /\bGPS\b/i, score: 4 },
    { pattern: /facial recognition/i, score: 4 },
    { pattern: /\bwatchlist\b/i, score: 3 },
    { pattern: /location tracking/i, score: 3 },
    { pattern: /vehicle tracking/i, score: 3 },
    { pattern: /\bmonitoring\b/i, score: 3 },
    { pattern: /surveillance camera/i, score: 4 },
    { pattern: /\bobserved\b/i, score: 2 },
    { pattern: /\btracking\b/i, score: 2 },
    { pattern: /suspicious movement/i, score: 3 },
    { pattern: /\bsurveillance\b/i, score: 3 },
    { pattern: /\bmovement\b/i, score: 1 },
  ],
  INTELLIGENCE: [
    { pattern: /intelligence report/i, score: 5 },
    { pattern: /intelligence input/i, score: 5 },
    { pattern: /\binformant\b/i, score: 4 },
    { pattern: /threat assessment/i, score: 4 },
    { pattern: /risk assessment/i, score: 3 },
    { pattern: /confidential information/i, score: 4 },
    { pattern: /intelligence analysis/i, score: 4 },
    { pattern: /operational intelligence/i, score: 4 },
    { pattern: /intelligence source/i, score: 4 },
    { pattern: /covert operation/i, score: 4 },
    { pattern: /intelligence officer/i, score: 3 },
    { pattern: /network analysis/i, score: 2 },
    { pattern: /\boperation\b/i, score: 1 },
  ],
  CRIMINAL_HISTORY: [
    { pattern: /previous arrest/i, score: 5 },
    { pattern: /prior FIR/i, score: 5 },
    { pattern: /criminal record/i, score: 5 },
    { pattern: /repeat offender/i, score: 5 },
    { pattern: /\bconviction\b/i, score: 4 },
    { pattern: /\bchargesheet\b/i, score: 4 },
    { pattern: /criminal history/i, score: 5 },
    { pattern: /past involvement/i, score: 4 },
    { pattern: /previous case/i, score: 3 },
    { pattern: /previously arrested/i, score: 4 },
    { pattern: /previous investigation/i, score: 3 },
    { pattern: /\bbail\b/i, score: 2 },
    { pattern: /\bcourt case\b/i, score: 2 },
    { pattern: /previous offence/i, score: 4 },
  ],
  SOCIAL_INTELLIGENCE: [
    { pattern: /\bTelegram\b/i, score: 5 },
    { pattern: /\bWhatsApp\b/i, score: 5 },
    { pattern: /\bInstagram\b/i, score: 4 },
    { pattern: /\bFacebook\b/i, score: 4 },
    { pattern: /social media/i, score: 4 },
    { pattern: /online profile/i, score: 4 },
    { pattern: /\bfollowers\b/i, score: 3 },
    { pattern: /social network/i, score: 3 },
    { pattern: /digital association/i, score: 3 },
    { pattern: /online activity/i, score: 3 },
    { pattern: /dark web/i, score: 4 },
    { pattern: /encrypted channel/i, score: 3 },
    { pattern: /\bgroup\b/i, score: 1 },
    { pattern: /\bposts\b/i, score: 2 },
    { pattern: /\bmessages\b/i, score: 1 },
  ],
};

// ── Classification ────────────────────────────────────────────

interface ClassifyResult {
  category: ChunkCategory;
  confidence: number;
  matchedKeywords: string[];
}

export function classifyChunk(text: string): ClassifyResult {
  const scores: Record<ChunkCategory, number> = {
    FIR: 0, CDR: 0, FINANCIAL: 0, SURVEILLANCE: 0,
    INTELLIGENCE: 0, CRIMINAL_HISTORY: 0, SOCIAL_INTELLIGENCE: 0,
  };
  const allMatched: Record<ChunkCategory, string[]> = {
    FIR: [], CDR: [], FINANCIAL: [], SURVEILLANCE: [],
    INTELLIGENCE: [], CRIMINAL_HISTORY: [], SOCIAL_INTELLIGENCE: [],
  };

  for (const [cat, rules] of Object.entries(CATEGORY_RULES) as [ChunkCategory, KeywordRule[]][]) {
    for (const { pattern, score } of rules) {
      const matched = typeof pattern === 'string'
        ? text.includes(pattern)
        : pattern.test(text);
      if (matched) {
        scores[cat] += score;
        const kw = typeof pattern === 'string' ? pattern : pattern.source.replace(/\\b|\\s\*/g, '').replace(/[/\\^$*+?.()|[\]{}]/g, '');
        allMatched[cat].push(kw);
      }
    }
  }

  let bestCat: ChunkCategory = 'INTELLIGENCE';
  let bestScore = 0;
  for (const [cat, score] of Object.entries(scores) as [ChunkCategory, number][]) {
    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
    }
  }

  // If no signal, stay as INTELLIGENCE (catch-all)
  const maxPossibleScore = 30; // rough upper bound
  const rawConfidence = bestScore > 0
    ? Math.min(Math.round((bestScore / maxPossibleScore) * 100), 97)
    : 40; // unclassified fallback
  const confidence = Math.max(rawConfidence, 40);

  return {
    category: bestCat,
    confidence,
    matchedKeywords: [...new Set(allMatched[bestCat])].slice(0, 8),
  };
}

// ── Semantic Chunking ─────────────────────────────────────────

const MAX_CHUNK_CHARS = 1500;
const MIN_CHUNK_CHARS = 80;

/** Split text preserving paragraph / sentence-group boundaries */
function splitIntoSemanticSegments(text: string): string[] {
  // Normalise line endings
  const normalised = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split on double (or more) newlines = paragraph boundaries
  const paragraphs = normalised
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length >= MIN_CHUNK_CHARS);

  const segments: string[] = [];

  for (const para of paragraphs) {
    if (para.length <= MAX_CHUNK_CHARS) {
      segments.push(para);
    } else {
      // Paragraph is too long — split on sentence boundaries
      const sentences = para
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      let current = '';
      for (const sentence of sentences) {
        if ((current + ' ' + sentence).trim().length > MAX_CHUNK_CHARS) {
          if (current.trim().length >= MIN_CHUNK_CHARS) {
            segments.push(current.trim());
          }
          current = sentence;
        } else {
          current = current ? current + ' ' + sentence : sentence;
        }
      }
      if (current.trim().length >= MIN_CHUNK_CHARS) {
        segments.push(current.trim());
      }
    }
  }

  return segments;
}

/** Generate a stable short ID from index + content hash */
function makeChunkId(caseId: string, documentId: string, index: number): string {
  return `${caseId}-${documentId}-chunk-${String(index).padStart(3, '0')}`;
}

export interface ProcessingResult {
  chunks: ExtractedChunk[];
  alerts: Alert[];
  documentCount: number;
  chunkCounts: {
    total: number;
    fir: number;
    cdr: number;
    financial: number;
    surveillance: number;
    intelligence: number;
    criminalHistory: number;
    socialIntelligence: number;
  };
}

/** Process an array of .txt File objects for a case */
export async function processDocuments(
  caseId: string,
  files: File[]
): Promise<ProcessingResult> {
  const allChunks: ExtractedChunk[] = [];

  for (const file of files) {
    const text = await file.text();
    const documentId = `${caseId}-doc-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const segments = splitIntoSemanticSegments(text);

    segments.forEach((seg, idx) => {
      const { category, confidence, matchedKeywords } = classifyChunk(seg);
      allChunks.push({
        id: makeChunkId(caseId, documentId, idx),
        caseId,
        documentId,
        index: idx,
        text: seg,
        category,
        confidence,
        entities: matchedKeywords, // reuse entities field for matched keywords display
        createdAt: new Date().toISOString(),
      });
    });
  }

  const alerts = generateAlerts(caseId, allChunks, files.map((f) => f.name));

  const counts = {
    total: allChunks.length,
    fir: allChunks.filter((c) => c.category === 'FIR').length,
    cdr: allChunks.filter((c) => c.category === 'CDR').length,
    financial: allChunks.filter((c) => c.category === 'FINANCIAL').length,
    surveillance: allChunks.filter((c) => c.category === 'SURVEILLANCE').length,
    intelligence: allChunks.filter((c) => c.category === 'INTELLIGENCE').length,
    criminalHistory: allChunks.filter((c) => c.category === 'CRIMINAL_HISTORY').length,
    socialIntelligence: allChunks.filter((c) => c.category === 'SOCIAL_INTELLIGENCE').length,
  };

  return {
    chunks: allChunks,
    alerts,
    documentCount: files.length,
    chunkCounts: counts,
  };
}

// ── Alert Generation ──────────────────────────────────────────

/** Extract the largest ₹ amount found in text */
function extractLargestAmount(text: string): number {
  const matches = [...text.matchAll(/₹\s*([\d,]+)/g)];
  if (matches.length === 0) return 0;
  return Math.max(
    ...matches.map((m) => parseInt(m[1].replace(/,/g, ''), 10) || 0)
  );
}

/** Count likely call references (e.g. "called X times", "17 calls") */
function extractCallCount(text: string): number {
  const match = text.match(/(\d+)\s*(?:calls?|times)/i);
  return match ? parseInt(match[1], 10) : 0;
}

/** Extract name-like tokens from text (simple heuristic: Title Case words) */
function extractNameHints(text: string): string[] {
  const candidates = text.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) ?? [];
  return [...new Set(candidates)].slice(0, 3);
}

export function generateAlerts(
  caseId: string,
  chunks: ExtractedChunk[],
  fileNames: string[]
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();
  const source = fileNames.join(', ');

  // ── Rule 1: Large financial transactions ─────────────────────
  let maxAmount = 0;
  let financialChunkId = '';
  for (const chunk of chunks) {
    if (chunk.category === 'FINANCIAL') {
      const amt = extractLargestAmount(chunk.text);
      if (amt > maxAmount) {
        maxAmount = amt;
        financialChunkId = chunk.id;
      }
    }
  }
  // Threshold: ₹1 lakh (100,000)
  if (maxAmount >= 100000) {
    const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(maxAmount);
    alerts.push({
      id: `${caseId}-alert-financial-tx`,
      title: 'Large Financial Transaction Detected',
      description: `A high-value financial transaction of ${fmt} was identified in the uploaded case documents. This may indicate money laundering or hawala activity.\n\nSource: ${source}`,
      severity: 'HIGH',
      status: 'ACTIVE',
      caseId,
      personIds: [],
      evidenceIds: [financialChunkId],
      detectedAt: now,
      category: 'FINANCIAL',
    });
  }

  // ── Rule 2: Frequent communication (CDR) ─────────────────────
  let maxCalls = 0;
  let cdrChunkId = '';
  for (const chunk of chunks) {
    if (chunk.category === 'CDR') {
      const calls = extractCallCount(chunk.text);
      if (calls > maxCalls) {
        maxCalls = calls;
        cdrChunkId = chunk.id;
      }
    }
  }
  if (maxCalls >= 10) {
    alerts.push({
      id: `${caseId}-alert-freq-comm`,
      title: 'Frequent Communication Pattern Detected',
      description: `${maxCalls} communications were identified between parties in the CDR data. High-frequency contact between individuals may indicate coordination or operational activity.\n\nSource: ${source}`,
      severity: 'HIGH',
      status: 'ACTIVE',
      caseId,
      personIds: [],
      evidenceIds: [cdrChunkId],
      detectedAt: now,
      category: 'CDR',
    });
  } else if (chunks.some((c) => c.category === 'CDR') && maxCalls > 0) {
    alerts.push({
      id: `${caseId}-alert-comm-pattern`,
      title: 'Communication Activity Identified',
      description: `Call records have been identified in the uploaded documents. Communication patterns between identified parties warrant further analysis.\n\nSource: ${source}`,
      severity: 'MEDIUM',
      status: 'ACTIVE',
      caseId,
      personIds: [],
      evidenceIds: [(cdrChunkId || chunks.find((c) => c.category === 'CDR')?.id) ?? ''],
      detectedAt: now,
      category: 'CDR',
    });
  }

  // ── Rule 3: Criminal history ──────────────────────────────────
  const crimChunks = chunks.filter((c) => c.category === 'CRIMINAL_HISTORY');
  if (crimChunks.length > 0) {
    const names = extractNameHints(crimChunks.map((c) => c.text).join(' '));
    alerts.push({
      id: `${caseId}-alert-crim-history`,
      title: 'Prior Criminal History Identified',
      description: `The uploaded documents contain references to prior criminal cases, arrests, or convictions${names.length > 0 ? ` associated with: ${names.join(', ')}` : ''}. This subject may be a repeat offender.\n\nSource: ${source}`,
      severity: 'HIGH',
      status: 'ACTIVE',
      caseId,
      personIds: [],
      evidenceIds: crimChunks.map((c) => c.id),
      detectedAt: now,
      category: 'CRIMINAL_HISTORY',
    });
  }

  // ── Rule 4: Suspicious surveillance ──────────────────────────
  const survChunks = chunks.filter((c) => c.category === 'SURVEILLANCE');
  if (survChunks.length >= 2) {
    alerts.push({
      id: `${caseId}-alert-surveillance`,
      title: 'Repeated Surveillance Activity',
      description: `${survChunks.length} surveillance records were found in the uploaded documents. Repeated sightings or CCTV/GPS tracking data may indicate targeted movement.\n\nSource: ${source}`,
      severity: 'MEDIUM',
      status: 'ACTIVE',
      caseId,
      personIds: [],
      evidenceIds: survChunks.map((c) => c.id),
      detectedAt: now,
      category: 'SURVEILLANCE',
    });
  }

  // ── Rule 5: Social network threat ────────────────────────────
  const socialChunks = chunks.filter((c) => c.category === 'SOCIAL_INTELLIGENCE');
  if (socialChunks.length > 0 && crimChunks.length > 0) {
    alerts.push({
      id: `${caseId}-alert-social-criminal`,
      title: 'Social Network Linked to Criminal Activity',
      description: `The documents contain both social media/network activity and criminal history records. An online presence linked to criminal behaviour warrants immediate investigation.\n\nSource: ${source}`,
      severity: 'HIGH',
      status: 'ACTIVE',
      caseId,
      personIds: [],
      evidenceIds: [...socialChunks.map((c) => c.id), ...crimChunks.map((c) => c.id)].slice(0, 4),
      detectedAt: now,
      category: 'SOCIAL_INTELLIGENCE',
    });
  }

  // ── Rule 6: Cross-category correlation — CDR + FINANCIAL ─────
  const hasCdr = chunks.some((c) => c.category === 'CDR');
  const hasFinancial = chunks.some((c) => c.category === 'FINANCIAL');
  if (hasCdr && hasFinancial) {
    alerts.push({
      id: `${caseId}-alert-cdr-financial`,
      title: 'Communication & Financial Activity Correlated',
      description: `The uploaded documents contain both call detail records (CDR) and financial transaction data. Communication between parties coinciding with financial activity is a strong indicator of coordinated criminal activity.\n\nSource: ${source}`,
      severity: 'HIGH',
      status: 'ACTIVE',
      caseId,
      personIds: [],
      evidenceIds: [
        chunks.find((c) => c.category === 'CDR')?.id ?? '',
        chunks.find((c) => c.category === 'FINANCIAL')?.id ?? '',
      ].filter(Boolean),
      detectedAt: now,
      category: 'FINANCIAL',
    });
  }

  // ── Rule 7: Multiple FIRs ─────────────────────────────────────
  const firChunks = chunks.filter((c) => c.category === 'FIR');
  if (firChunks.length >= 3) {
    alerts.push({
      id: `${caseId}-alert-multi-fir`,
      title: 'Multiple FIR References Detected',
      description: `${firChunks.length} First Information Report references were found in the documents. Multiple FIRs may indicate a serial offender or a wide-reaching criminal operation.\n\nSource: ${source}`,
      severity: 'HIGH',
      status: 'ACTIVE',
      caseId,
      personIds: [],
      evidenceIds: firChunks.slice(0, 4).map((c) => c.id),
      detectedAt: now,
      category: 'FIR',
    });
  }

  return alerts;
}

// ── Persistence ───────────────────────────────────────────────

const CHUNKS_PREFIX = 'nexus_chunks_';
const ALERTS_PREFIX = 'nexus_alerts_';
const DOCS_PREFIX = 'nexus_docs_';

export interface StoredDocument {
  id: string;
  caseId: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  size: number;
  status: 'PROCESSED';
  chunkCount: number;
}

export function saveChunks(caseId: string, chunks: ExtractedChunk[]): void {
  try {
    localStorage.setItem(CHUNKS_PREFIX + caseId, JSON.stringify(chunks));
  } catch {
    console.warn('[NEXUS] Could not persist chunks to localStorage');
  }
}

export function loadChunks(caseId: string): ExtractedChunk[] {
  try {
    const raw = localStorage.getItem(CHUNKS_PREFIX + caseId);
    return raw ? (JSON.parse(raw) as ExtractedChunk[]) : [];
  } catch {
    return [];
  }
}

export function saveAlerts(caseId: string, alerts: Alert[]): void {
  try {
    localStorage.setItem(ALERTS_PREFIX + caseId, JSON.stringify(alerts));
  } catch {
    console.warn('[NEXUS] Could not persist alerts to localStorage');
  }
}

export function loadAlerts(caseId: string): Alert[] {
  try {
    const raw = localStorage.getItem(ALERTS_PREFIX + caseId);
    return raw ? (JSON.parse(raw) as Alert[]) : [];
  } catch {
    return [];
  }
}

export function saveDocuments(caseId: string, docs: StoredDocument[]): void {
  try {
    localStorage.setItem(DOCS_PREFIX + caseId, JSON.stringify(docs));
  } catch {
    console.warn('[NEXUS] Could not persist documents to localStorage');
  }
}

export function loadDocuments(caseId: string): StoredDocument[] {
  try {
    const raw = localStorage.getItem(DOCS_PREFIX + caseId);
    return raw ? (JSON.parse(raw) as StoredDocument[]) : [];
  } catch {
    return [];
  }
}

export function clearCaseData(caseId: string): void {
  localStorage.removeItem(CHUNKS_PREFIX + caseId);
  localStorage.removeItem(ALERTS_PREFIX + caseId);
  localStorage.removeItem(DOCS_PREFIX + caseId);
}

/** Compute chunk category counts from an array of chunks */
export function computeChunkCounts(chunks: ExtractedChunk[]) {
  return {
    total: chunks.length,
    fir: chunks.filter((c) => c.category === 'FIR').length,
    cdr: chunks.filter((c) => c.category === 'CDR').length,
    financial: chunks.filter((c) => c.category === 'FINANCIAL').length,
    surveillance: chunks.filter((c) => c.category === 'SURVEILLANCE').length,
    intelligence: chunks.filter((c) => c.category === 'INTELLIGENCE').length,
    criminalHistory: chunks.filter((c) => c.category === 'CRIMINAL_HISTORY').length,
    socialIntelligence: chunks.filter((c) => c.category === 'SOCIAL_INTELLIGENCE').length,
  };
}
