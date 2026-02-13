export interface TraitementPhenomenaResponse {
  phenomena: Record<string, string>;
}

export interface TraitementCatalogResponse {
  version?: string;
  phenomena?: unknown[];
  catalog?: unknown;
  [key: string]: any;
}

export interface TraitementFileRef {
  path: string;
  meta: Record<string, any>;
}

export type TraitementStepState = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'SKIPPED';

export interface TraitementPipelineContext {
  run_id: string;
  trace_id?: string;
  pipeline_version?: string;
  catalog?: unknown;

  aoi: any;
  date1: string;
  date2: string;
  date_1?: string | null;
  date_2?: string | null;
  datetime_1?: string | null;
  datetime_2?: string | null;
  metadata_status?: 'ok' | 'missing';
  metadata_reason?: string | null;

  sensor: string;
  phenomenon: string;
  indicators: string[];
  region: string;

  sensor_hint?: string | null;
  provider_hint?: string | null;

  created_at?: string;
  started_at?: string;
  ended_at?: string;

  durations: Record<string, number>;
  step_status: Record<string, TraitementStepState>;

  raw_files: TraitementFileRef[];
  processed_files: TraitementFileRef[];
  products: TraitementFileRef[];

  metrics: Record<string, any>;
  warnings: string[];
  errors: string[];

  status: 'CREATED' | 'RUNNING' | 'DONE' | 'FAILED';
}

export interface TraitementRunRequest {
  aoi_geojson: any;
  date1: string;
  date2: string;
  phenomenon: string;

  indicators?: string[];
  sensor_hint?: string;
  provider_hint?: string;
  region?: string;
}
