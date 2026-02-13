import {
  getCompareProducts,
  normalizeCatalogPayload,
  resolveRenderableLayers,
} from './adapter';

describe('catalog adapter', () => {
  it('normalizes a valid payload', () => {
    const input = {
      version: '1.0',
      phenomena: [
        {
          id: 'flood',
          label: 'Flood',
          enabled: true,
          dates: { t1: '2024-09-10', t2: '2024-10-18' },
          products: [
            {
              id: 'mndwi',
              label: 'MNDWI',
              kind: 'index',
              compare_capable: true,
              enabled: true,
              layers: {
                t1: 'workspace:flood_mndwi_t1',
                t2: 'workspace:flood_mndwi_t2',
                delta: 'workspace:flood_delta_mndwi',
              },
            },
          ],
        },
      ],
    };

    const out = normalizeCatalogPayload(input);
    expect(out.catalog.version).toBe('1.0');
    expect(out.catalog.phenomena.length).toBe(1);
    expect(out.catalog.phenomena[0].products.length).toBe(1);
    expect(out.catalog.phenomena[0].products[0].layers.delta).toBe('workspace:flood_delta_mndwi');
  });

  it('filters invalid product entries', () => {
    const input = {
      version: '1.0',
      phenomena: [
        {
          id: 'deforestation',
          label: 'Deforestation',
          enabled: true,
          dates: { t1: '2024-01-01', t2: '2024-02-01' },
          products: [
            {
              id: 'ndvi',
              label: 'NDVI',
              kind: 'index',
              compare_capable: true,
              enabled: true,
              layers: { t1: 'workspace:ndvi_t1', t2: 'workspace:ndvi_t2' },
            },
            {
              id: 'broken',
              label: 'Broken',
              kind: 'index',
              compare_capable: false,
              enabled: true,
              layers: {},
            },
            {
              label: 'Missing id',
              kind: 'index',
              compare_capable: false,
              enabled: true,
              layers: { t1: 'workspace:x' },
            },
          ],
        },
      ],
    };

    const out = normalizeCatalogPayload(input);
    expect(out.catalog.phenomena[0].products.map((p) => p.id)).toEqual(['ndvi']);
    expect(out.warnings.length).toBeGreaterThan(0);
  });

  it('getCompareProducts returns only compare-capable products with t1+t2', () => {
    const normalized = normalizeCatalogPayload({
      version: '1.0',
      phenomena: [
        {
          id: 'wildfire',
          label: 'Wildfire',
          enabled: true,
          dates: { t1: '2024-07-01', t2: '2024-08-01' },
          products: [
            {
              id: 'burn_index',
              label: 'Burn Index',
              kind: 'index',
              compare_capable: true,
              enabled: true,
              layers: { t1: 'ws:burn_t1', t2: 'ws:burn_t2' },
            },
            {
              id: 'smoke_mask',
              label: 'Smoke Mask',
              kind: 'binary_mask',
              compare_capable: true,
              enabled: true,
              layers: { final: 'ws:smoke_final' },
            },
            {
              id: 'vector_damage',
              label: 'Vector',
              kind: 'vector',
              compare_capable: false,
              enabled: true,
              layers: { final: 'ws:vector' },
            },
          ],
        },
      ],
    });

    const compare = getCompareProducts(normalized.catalog, 'wildfire');
    expect(compare.map((p) => p.id)).toEqual(['burn_index']);
  });

  it('resolveRenderableLayers works for single and compare modes', () => {
    const normalized = normalizeCatalogPayload({
      version: '1.0',
      phenomena: [
        {
          id: 'flood',
          label: 'Flood',
          enabled: true,
          dates: { t1: '2024-09-01', t2: '2024-10-01' },
          products: [
            {
              id: 'mndwi',
              label: 'MNDWI',
              kind: 'index',
              compare_capable: true,
              enabled: true,
              layers: {
                t1: 'ws:mndwi_t1',
                t2: 'ws:mndwi_t2',
                delta: 'ws:delta_mndwi',
                final: 'ws:mndwi_final',
              },
            },
          ],
        },
      ],
    });

    const product = normalized.catalog.phenomena[0].products[0];
    const single = resolveRenderableLayers(product, 'single');
    expect(single.map((l) => l.slot)).toEqual(['t1', 't2', 'delta', 'final']);

    const compare = resolveRenderableLayers(product, 'compare');
    expect(compare.map((l) => l.slot)).toEqual(['t1', 't2']);
  });
});
