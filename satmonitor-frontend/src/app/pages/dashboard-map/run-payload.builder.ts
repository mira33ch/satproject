import type { TraitementRunRequest } from './traitement-api.models';

export interface BuildRunPayloadInput {
  aoiGeojson: any;
  date1: string;
  date2: string;
  phenomenon: string;
  indicators?: string[] | null;
  sensorHint?: string | null;
  providerHint?: string | null;
  region?: string | null;
}

function normalizePhenomenon(raw: string): string {
  return (raw || '').trim().toLowerCase();
}

function normalizeIndicators(raw: string[] | null | undefined): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const indicator of raw) {
    const normalized = String(indicator || '').trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function normalizeOptional(raw: string | null | undefined): string | undefined {
  const value = String(raw || '').trim();
  return value || undefined;
}

export function buildTraitementRunPayload(input: BuildRunPayloadInput): TraitementRunRequest {
  const phenomenon = normalizePhenomenon(input.phenomenon) || 'unknown';
  const normalizedIndicators = normalizeIndicators(input.indicators);

  const payload: TraitementRunRequest = {
    aoi_geojson: input.aoiGeojson,
    date1: input.date1,
    date2: input.date2,
    phenomenon,
    provider_hint: normalizeOptional(input.providerHint),
    region: normalizeOptional(input.region),
  };

  const normalizedSensorHint = normalizeOptional(input.sensorHint);

  if (normalizedSensorHint) {
    payload.sensor_hint = normalizedSensorHint;
  }

  if (normalizedIndicators.length) {
    payload.indicators = normalizedIndicators;
  }

  return payload;
}
