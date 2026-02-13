import { buildTraitementRunPayload } from './run-payload.builder';

describe('buildTraitementRunPayload', () => {
  const baseInput = {
    aoiGeojson: { type: 'Polygon', coordinates: [] },
    date1: '2025-01-01',
    date2: '2025-01-10',
    providerHint: 'AUTO',
    region: 'AFRICA',
  };

  it('normalizes indicators and keeps phenomenon generic', () => {
    const payload = buildTraitementRunPayload({
      ...baseInput,
      phenomenon: 'WildFire',
      indicators: [' Burn_Index ', 'burn_index', '  '],
      sensorHint: 'AUTO',
    });

    expect(payload.phenomenon).toBe('wildfire');
    expect(payload.indicators).toEqual(['burn_index']);
    expect(payload.sensor_hint).toBe('AUTO');
  });

  it('does not inject phenomenon-specific defaults', () => {
    const payload = buildTraitementRunPayload({
      ...baseInput,
      phenomenon: 'flood',
      indicators: ['mndwi'],
    });

    expect(payload.indicators).toEqual(['mndwi']);
    expect(payload.sensor_hint).toBeUndefined();
  });

  it('falls back to unknown when phenomenon is missing', () => {
    const payload = buildTraitementRunPayload({
      ...baseInput,
      phenomenon: '',
    });

    expect(payload.phenomenon).toBe('unknown');
  });

  it('omits empty optional fields', () => {
    const payload = buildTraitementRunPayload({
      ...baseInput,
      phenomenon: 'deforestation',
      sensorHint: ' ',
      indicators: [],
      providerHint: ' ',
      region: null,
    });

    expect(payload.sensor_hint).toBeUndefined();
    expect(payload.indicators).toBeUndefined();
    expect(payload.provider_hint).toBeUndefined();
    expect(payload.region).toBeUndefined();
  });
});
