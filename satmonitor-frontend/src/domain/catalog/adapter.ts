export type Catalog = {
  version: string;
  phenomena: Phenomenon[];
};

export type Phenomenon = {
  id: string;
  label: string;
  enabled: boolean;
  dates: { t1: string | null; t2: string | null };
  date_1?: string | null;
  date_2?: string | null;
  datetime_1?: string | null;
  datetime_2?: string | null;
  metadata_status?: 'ok' | 'missing';
  metadata_reason?: string | null;
  source_layer_keys?: string[];
  products: Product[];
};

export type Product = {
  id: string;
  label: string;
  kind: 'index' | 'delta' | 'binary_mask' | 'vector';
  compare_capable: boolean;
  enabled: boolean;
  layers: Partial<Record<'t1' | 't2' | 'delta' | 'final', string>>;
  bbox_wgs84?: [number, number, number, number] | null;
  date_1?: string | null;
  date_2?: string | null;
  datetime_1?: string | null;
  datetime_2?: string | null;
  metadata_status?: 'ok' | 'missing';
  metadata_reason?: string | null;
  source_layer_keys?: string[];
  source_scene_ids_1?: string[];
  source_scene_ids_2?: string[];
  legend?: {
    type: 'continuous' | 'categorical';
    min?: number;
    max?: number;
    classes?: Array<{ value: string | number; label: string; color?: string }>;
  };
};

export type CatalogNormalizeResult = {
  catalog: Catalog;
  warnings: string[];
};

export type RenderMode = 'single' | 'compare';

export type RenderableLayer = {
  slot: 't1' | 't2' | 'delta' | 'final';
  layer: string;
};

const PRODUCT_KINDS = new Set(['index', 'delta', 'binary_mask', 'vector']);
const LAYER_SLOTS: Array<'t1' | 't2' | 'delta' | 'final'> = ['t1', 't2', 'delta', 'final'];

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : null;
}

function asString(value: unknown): string | null {
  const out = typeof value === 'string' ? value.trim() : '';
  return out || null;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  return fallback;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function asBboxWgs84(value: unknown): [number, number, number, number] | null {
  if (!Array.isArray(value) || value.length !== 4) return null;
  const nums = value.map((x) => asNumber(x));
  if (nums.some((x) => x === undefined)) return null;
  const [minx, miny, maxx, maxy] = nums as number[];
  if (![minx, miny, maxx, maxy].every(Number.isFinite)) return null;
  if (minx >= maxx || miny >= maxy) return null;
  return [minx, miny, maxx, maxy];
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const v = asString(item);
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function asIsoDate(value: unknown): string | null {
  const s = asString(value);
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function normalizeLegend(raw: unknown): Product['legend'] | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;

  const type = asString(obj['type']);
  if (type !== 'continuous' && type !== 'categorical') return undefined;

  const legend: NonNullable<Product['legend']> = { type };
  const min = asNumber(obj['min']);
  const max = asNumber(obj['max']);
  if (min !== undefined) legend.min = min;
  if (max !== undefined) legend.max = max;

  if (Array.isArray(obj['classes'])) {
    const classes = obj['classes']
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, any> => !!item)
      .map((item) => {
        const value = item['value'];
        const label = asString(item['label']) ?? String(value ?? '');
        const color = asString(item['color']) ?? undefined;
        return {
          value: typeof value === 'number' || typeof value === 'string' ? value : label,
          label,
          color,
        };
      })
      .filter((item) => item.label !== '');
    if (classes.length) legend.classes = classes;
  }

  return legend;
}

function normalizeLayers(raw: unknown): Partial<Record<'t1' | 't2' | 'delta' | 'final', string>> {
  const obj = asRecord(raw);
  if (!obj) return {};

  const layers: Partial<Record<'t1' | 't2' | 'delta' | 'final', string>> = {};
  for (const slot of LAYER_SLOTS) {
    const val = asString(obj[slot]);
    if (val) layers[slot] = val;
  }
  return layers;
}

function hasRenderableLayers(product: Product): boolean {
  return LAYER_SLOTS.some((slot) => !!product.layers[slot]);
}

function normalizeProduct(raw: unknown, path: string, warnings: string[]): Product | null {
  const obj = asRecord(raw);
  if (!obj) {
    warnings.push(`${path}: invalid product (not an object)`);
    return null;
  }

  const id = asString(obj['id']);
  if (!id) {
    warnings.push(`${path}: missing product.id`);
    return null;
  }

  const label = asString(obj['label']) ?? id;
  const kindRaw = asString(obj['kind']) ?? 'index';
  const kind = PRODUCT_KINDS.has(kindRaw) ? (kindRaw as Product['kind']) : 'index';
  const productDate1 = asIsoDate(obj['date_1'] ?? obj['date1']);
  const productDate2 = asIsoDate(obj['date_2'] ?? obj['date2']);
  const bboxWgs84 = asBboxWgs84(obj['bbox_wgs84'] ?? obj['bounds_wgs84'] ?? obj['bboxWgs84'] ?? obj['boundsWgs84']);
  const productStatusRaw = asString(obj['metadata_status']);
  const productStatus = productStatusRaw === 'ok' ? 'ok' : productDate1 && productDate2 ? 'ok' : 'missing';
  if (!PRODUCT_KINDS.has(kindRaw)) {
    warnings.push(`${path}: unsupported product.kind "${kindRaw}", defaulting to "index"`);
  }

  const product: Product = {
    id,
    label,
    kind,
    compare_capable: asBoolean(obj['compare_capable'], false),
    enabled: asBoolean(obj['enabled'], true),
    layers: normalizeLayers(obj['layers']),
    bbox_wgs84: bboxWgs84,
    date_1: productDate1,
    date_2: productDate2,
    datetime_1: asString(obj['datetime_1'] ?? obj['datetime1']),
    datetime_2: asString(obj['datetime_2'] ?? obj['datetime2']),
    metadata_status: productStatus,
    metadata_reason: asString(obj['metadata_reason']),
    source_layer_keys: asStringList(obj['source_layer_keys']),
    source_scene_ids_1: asStringList(obj['source_scene_ids_1']),
    source_scene_ids_2: asStringList(obj['source_scene_ids_2']),
    legend: normalizeLegend(obj['legend']),
  };

  if (!hasRenderableLayers(product)) {
    warnings.push(`${path}: product "${id}" has no renderable layers`);
    return null;
  }

  return product;
}

function normalizePhenomenon(raw: unknown, idx: number, warnings: string[]): Phenomenon | null {
  const path = `phenomena[${idx}]`;
  const obj = asRecord(raw);
  if (!obj) {
    warnings.push(`${path}: invalid phenomenon (not an object)`);
    return null;
  }

  const id = asString(obj['id']);
  if (!id) {
    warnings.push(`${path}: missing phenomenon.id`);
    return null;
  }

  const label = asString(obj['label']) ?? id;
  const datesObj = asRecord(obj['dates']);
  const t1 = asIsoDate(datesObj?.['t1'] ?? obj['date_1'] ?? obj['date1']);
  const t2 = asIsoDate(datesObj?.['t2'] ?? obj['date_2'] ?? obj['date2']);
  const statusRaw = asString(obj['metadata_status']);
  const status = statusRaw === 'ok' ? 'ok' : t1 && t2 ? 'ok' : 'missing';

  const rawProducts = Array.isArray(obj['products']) ? obj['products'] : [];
  const products = rawProducts
    .map((p, productIdx) => normalizeProduct(p, `${path}.products[${productIdx}]`, warnings))
    .filter((p): p is Product => !!p);

  return {
    id,
    label,
    enabled: asBoolean(obj['enabled'], true),
    dates: { t1, t2 },
    date_1: t1,
    date_2: t2,
    datetime_1: asString(obj['datetime_1'] ?? obj['datetime1']),
    datetime_2: asString(obj['datetime_2'] ?? obj['datetime2']),
    metadata_status: status,
    metadata_reason: asString(obj['metadata_reason']),
    source_layer_keys: asStringList(obj['source_layer_keys']),
    products,
  };
}

function normalizeFromPhenomenaMap(raw: unknown, warnings: string[]): Catalog | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const phenomenaObj = asRecord(obj['phenomena']);
  if (!phenomenaObj) return null;

  const phenomena: Phenomenon[] = Object.entries(phenomenaObj).map(([id, label]) => ({
    id,
    label: asString(label) ?? id,
    enabled: true,
    dates: { t1: null, t2: null },
    date_1: null,
    date_2: null,
    datetime_1: null,
    datetime_2: null,
    metadata_status: 'missing',
    metadata_reason: 'catalog lacks temporal metadata',
    source_layer_keys: [],
    products: [],
  }));

  if (!phenomena.length) return null;
  warnings.push('catalog normalization fallback: phenomena list has no products metadata');
  return { version: asString(obj['version']) ?? '1.0', phenomena };
}

function findCatalogRoot(raw: unknown): Record<string, any> | null {
  const direct = asRecord(raw);
  if (!direct) return null;

  const candidates: Array<Record<string, any>> = [direct];
  const c1 = asRecord(direct['catalog']);
  if (c1) candidates.push(c1);
  const m = asRecord(direct['metrics']);
  if (m) {
    const mc = asRecord(m['catalog']);
    if (mc) candidates.push(mc);
    const pp = asRecord(m['publish_pack']);
    const ppc = asRecord(pp?.['catalog']);
    if (ppc) candidates.push(ppc);
  }

  for (const candidate of candidates) {
    if (Array.isArray(candidate['phenomena'])) return candidate;
  }

  return null;
}

export function normalizeCatalogPayload(raw: unknown): CatalogNormalizeResult {
  const warnings: string[] = [];
  const root = findCatalogRoot(raw);

  if (!root) {
    const fallback = normalizeFromPhenomenaMap(raw, warnings);
    if (fallback) return { catalog: fallback, warnings };
    return { catalog: { version: '1.0', phenomena: [] }, warnings: ['catalog normalization failed: no usable catalog root'] };
  }

  const rawPhenomena = Array.isArray(root['phenomena']) ? root['phenomena'] : [];
  const phenomena = rawPhenomena
    .map((p, idx) => normalizePhenomenon(p, idx, warnings))
    .filter((p): p is Phenomenon => !!p);

  return {
    catalog: {
      version: asString(root['version']) ?? '1.0',
      phenomena,
    },
    warnings,
  };
}

export function getPhenomena(catalog: Catalog): Phenomenon[] {
  const list = Array.isArray(catalog?.phenomena) ? catalog.phenomena : [];
  return list.filter((p) => p.enabled);
}

export function getProducts(catalog: Catalog, phenomenonId: string): Product[] {
  const phenomenon = getPhenomena(catalog).find((p) => p.id === phenomenonId);
  return (phenomenon?.products ?? []).filter((p) => p.enabled);
}

export function getCompareProducts(catalog: Catalog, phenomenonId: string): Product[] {
  return getProducts(catalog, phenomenonId).filter((product) => {
    if (!product.compare_capable) return false;
    const t1 = asString(product.layers.t1);
    const t2 = asString(product.layers.t2);
    return !!t1 && !!t2;
  });
}

export function resolveRenderableLayers(product: Product, mode: RenderMode): RenderableLayer[] {
  if (mode === 'compare') {
    const t1 = asString(product.layers.t1);
    const t2 = asString(product.layers.t2);
    if (!t1 || !t2) return [];
    return [
      { slot: 't1', layer: t1 },
      { slot: 't2', layer: t2 },
    ];
  }

  const out: RenderableLayer[] = [];
  for (const slot of LAYER_SLOTS) {
    const layer = asString(product.layers[slot]);
    if (!layer) continue;
    out.push({ slot, layer });
  }
  return out;
}
