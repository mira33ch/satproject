declare module 'geojson' {
  export type GeoJsonProperties = { [name: string]: any } | null;

  export interface Geometry {
    type: string;
    coordinates?: any;
    geometries?: Geometry[];
    bbox?: number[];
  }

  export interface Point extends Geometry {
    type: 'Point';
    coordinates: any;
  }

  export interface LineString extends Geometry {
    type: 'LineString';
    coordinates: any;
  }

  export interface Polygon extends Geometry {
    type: 'Polygon';
    coordinates: any;
  }

  export interface MultiPoint extends Geometry {
    type: 'MultiPoint';
    coordinates: any;
  }

  export interface MultiLineString extends Geometry {
    type: 'MultiLineString';
    coordinates: any;
  }

  export interface MultiPolygon extends Geometry {
    type: 'MultiPolygon';
    coordinates: any;
  }

  export interface GeometryCollection extends Geometry {
    type: 'GeometryCollection';
    geometries: Geometry[];
  }

  export interface Feature {
    type: 'Feature';
    geometry: Geometry | null;
    properties: GeoJsonProperties;
    id?: string | number;
    bbox?: number[];
  }

  export interface FeatureCollection {
    type: 'FeatureCollection';
    features: Feature[];
    bbox?: number[];
  }

  export type GeoJSON = Geometry | Feature | FeatureCollection;
}

