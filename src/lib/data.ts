export interface Contradiction {
  rule: string;
  severity: string;
  key: string;
  rationale: string;
  a: any;
  b: any;
  contradiction_id?: string;
  title?: string;
  description?: string;
  suggested_action?: string;
  score?: number;
}

export interface LoadedData {
  contradictions: Contradiction[];
  contradictionsScored?: Contradiction[];
  statements?: any[];
}

async function safeFetch(path: string) {
  const res = await fetch(path);
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

export async function loadData(base = '/data'): Promise<LoadedData> {
  const [contradictions, contradictionsScored, statements] = await Promise.all([
    safeFetch(`${base}/contradictions.json`),
    safeFetch(`${base}/contradictions_scored.json`),
    safeFetch(`${base}/statements_debug.json`)
  ]);
  return {
    contradictions: contradictions || [],
    contradictionsScored: contradictionsScored || undefined,
    statements: statements || undefined
  };
}