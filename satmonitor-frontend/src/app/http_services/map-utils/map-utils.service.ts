import { Injectable } from '@angular/core';
import { getDistance, getArea } from 'ol/sphere';
import { LineString, Polygon, Point } from 'ol/geom';
import { unByKey } from 'ol/Observable';
import type { EventsKey } from 'ol/events';
import OlMap from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import { Circle, Fill, Stroke, Style, Text } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import type Geometry from 'ol/geom/Geometry';

export interface MeasurementResult {
  type: 'distance' | 'area';
  value: number;
  unit: string;
  formattedValue: string;
}

export interface DrawingOptions {
  type: 'Point' | 'LineString' | 'Polygon' | 'Circle';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

/**
 * Map utilities service for measurements and drawing tools
 */
@Injectable({
  providedIn: 'root'
})
export class MapUtilsService {
  private drawInteraction?: Draw;
  private measurementSource?: VectorSource;
  private measurementLayer?: VectorLayer<VectorSource>;
  private drawingListeners: EventsKey[] = [];
  private readonly geoJsonFormat = new GeoJSON();

  /**
   * Initialize measurement tools on map
   */
  initializeMeasurementTools(map: OlMap): VectorLayer<VectorSource> {
    this.measurementSource = new VectorSource();
    this.measurementLayer = new VectorLayer({
      source: this.measurementSource,
      style: (feature: any) => this.getMeasurementStyle(feature as Feature),
    });
    this.measurementLayer.setZIndex(100);
    map.addLayer(this.measurementLayer);

    return this.measurementLayer;
  }

  /**
   * Start drawing interaction
   */
  startDrawing(
    map: OlMap,
    options: DrawingOptions,
    onFinish: (feature: Feature) => void
  ): void {
    this.stopDrawing(map);

    const source = this.measurementSource || new VectorSource();
    this.drawInteraction = new Draw({
      source,
      type: options.type,
      style: this.getDrawingStyle(options),
    });

    this.drawingListeners = [
      this.drawInteraction.on('drawend', (evt: DrawEvent) => {
        onFinish(evt.feature);
      }),
    ];

    map.addInteraction(this.drawInteraction);
  }

  /**
   * Stop drawing interaction
   */
  stopDrawing(map?: OlMap): void {
    if (this.drawInteraction && map) {
      map.removeInteraction(this.drawInteraction);
    }
    this.drawingListeners.forEach((key) => unByKey(key));
    this.drawingListeners = [];
    this.drawInteraction = undefined;
  }

  /**
   * Clear all measurements and drawings
   */
  clear(): void {
    this.measurementSource?.clear();
  }

  /**
   * Calculate measurement from a drawn feature
   */
  calculateMeasurement(feature: Feature): MeasurementResult | null {
    const geometry = feature.getGeometry();
    if (!geometry) return null;

    if (geometry instanceof LineString) {
      return this.calculateDistance(geometry);
    } else if (geometry instanceof Polygon) {
      return this.calculateArea(geometry);
    }

    return null;
  }

  /**
   * Calculate distance in meters and km
   */
  private calculateDistance(line: LineString): MeasurementResult {
    const coords = line.getCoordinates();
    let distance = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const dx = coords[i + 1][0] - coords[i][0];
      const dy = coords[i + 1][1] - coords[i][1];
      distance += Math.sqrt(dx * dx + dy * dy);
    }

    // Convert from meters to km if distance > 1000m
    const inKm = distance / 1000;
    const unit = inKm > 1 ? 'km' : 'm';
    const value = inKm > 1 ? inKm : distance;

    return {
      type: 'distance',
      value,
      unit,
      formattedValue: `${value.toFixed(2)} ${unit}`,
    };
  }

  /**
   * Calculate area in m² and km²
   */
  private calculateArea(polygon: Polygon): MeasurementResult {
    const area = getArea(polygon);

    // Convert to km² if area > 1,000,000 m²
    const inKmSq = area / 1_000_000;
    const unit = inKmSq > 1 ? 'km²' : 'm²';
    const value = inKmSq > 1 ? inKmSq : area;

    return {
      type: 'area',
      value,
      unit,
      formattedValue: `${value.toFixed(2)} ${unit}`,
    };
  }

  featureToGeoJsonGeometry(feature: Feature): any | null {
    const geometry = feature.getGeometry() as Geometry | null;
    if (!geometry) return null;
    return this.geoJsonFormat.writeGeometryObject(geometry, {
      featureProjection: 'EPSG:3857',
      dataProjection: 'EPSG:4326',
    });
  }

  /**
   * Get style for drawing
   */
  private getDrawingStyle(options: DrawingOptions): Style {
    const fillColor = options.fillColor ? this.hexToRgba(options.fillColor, 0.3) : 'rgba(255, 0, 0, 0.3)';
    const strokeColor = options.strokeColor || '#FF0000';
    const strokeWidth = options.strokeWidth || 2;

    return new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
      image: new Circle({
        radius: 5,
        fill: new Fill({ color: strokeColor }),
        stroke: new Stroke({ color: 'white', width: 1 }),
      }),
    });
  }

  /**
   * Get style for measurement display
   */
  private getMeasurementStyle(feature: Feature): Style {
    const geometry = feature.getGeometry();
    const measurement = this.calculateMeasurement(feature);

    const textStyle = measurement
      ? new Text({
          text: measurement.formattedValue,
          offsetY: -15,
          font: 'bold 12px Arial',
          fill: new Fill({ color: '#000' }),
          stroke: new Stroke({ color: '#fff', width: 3 }),
          backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 0.8)' }),
          padding: [2, 4, 2, 4],
        })
      : undefined;

    if (geometry instanceof LineString) {
      return new Style({
        stroke: new Stroke({ color: '#FF6B6B', width: 3 }),
        text: textStyle,
      });
    } else if (geometry instanceof Polygon) {
      return new Style({
        fill: new Fill({ color: 'rgba(255, 107, 107, 0.2)' }),
        stroke: new Stroke({ color: '#FF6B6B', width: 2 }),
        text: textStyle,
      });
    }

    return new Style();
  }

  /**
   * Convert hex color to rgba
   */
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Export features as GeoJSON
   */
  exportAsGeoJson(): string {
    const features = this.measurementSource?.getFeatures() || [];
    const geoJsonFeatures = features.map((feature) => {
      const geometry = feature.getGeometry();
      const measurement = this.calculateMeasurement(feature);

      return {
        type: 'Feature',
        geometry: geometry
          ? this.geoJsonFormat.writeGeometryObject(geometry as Geometry, {
              featureProjection: 'EPSG:3857',
              dataProjection: 'EPSG:4326',
            })
          : null,
        properties: {
          measurement: measurement
            ? {
                type: measurement.type,
                value: measurement.value,
                unit: measurement.unit,
              }
            : null,
        },
      };
    });

    return JSON.stringify({
      type: 'FeatureCollection',
      features: geoJsonFeatures,
    });
  }

  /**
   * Export map as PNG
   */
  async exportMapAsPng(map: OlMap, filename: string = 'map.png'): Promise<void> {
    map.once('rendercomplete', () => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = filename;
        link.click();
      }
    });
    map.renderSync();
  }

  /**
   * Export map as TIFF (high quality)
   */
  async exportMapAsTiff(map: OlMap, filename: string = 'map.tiff'): Promise<void> {
    map.once('rendercomplete', () => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        // Note: Browser native TIFF export is limited. This converts PNG to TIFF simulation
        // In production, use a library like GeoTIFF.js or server-side conversion
        const link = document.createElement('a');
        // Using PNG as fallback with .tiff extension for now
        link.href = canvas.toDataURL('image/png');
        link.download = filename;
        link.click();
      }
    });
    map.renderSync();
  }
}
