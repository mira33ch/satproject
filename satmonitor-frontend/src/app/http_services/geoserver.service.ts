import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface WmsCapabilities {
  layers: WmsLayer[];
  wmsUrl: string;
}

export interface WmsLayer {
  name: string;
  title: string;
  abstract?: string;
  extent?: [number, number, number, number]; // minx, miny, maxx, maxy
  styles: WmsStyle[];
}

export interface WmsStyle {
  name: string;
  title: string;
}

export interface FeatureInfoResult {
  type: string;
  features: Array<{
    type: string;
    id?: string;
    geometry?: any;
    properties?: Record<string, any>;
  }>;
}

/**
 * Service to interact with GeoServer WMS capabilities and feature info
 */
@Injectable({
  providedIn: 'root'
})
export class GeoServerService {
  private capabilitiesCache = new Map<string, Promise<WmsCapabilities>>();

  constructor(private http: HttpClient) {}

  /**
   * Get WMS capabilities document
   */
  async getCapabilities(wmsUrl: string): Promise<WmsCapabilities> {
    const cached = this.capabilitiesCache.get(wmsUrl);
    if (cached) return cached;

    const promise = this.fetchCapabilities(wmsUrl);
    this.capabilitiesCache.set(wmsUrl, promise);
    return promise;
  }

  private async fetchCapabilities(wmsUrl: string): Promise<WmsCapabilities> {
    const params = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: '1.1.0',
      REQUEST: 'GetCapabilities',
    });

    try {
      const url = `${wmsUrl}?${params.toString()}`;
      const response = await firstValueFrom(this.http.get(url, { responseType: 'text' }));
      
      // Parse XML string to Document
      const parser = new DOMParser();
      const doc = parser.parseFromString(response, 'application/xml');

      const layers = this.parseLayersFromCapabilities(doc);
      return { layers, wmsUrl };
    } catch (error) {
      console.error('Failed to fetch WMS capabilities', error);
      return { layers: [], wmsUrl };
    }
  }

  /**
   * Parse layers from WMS capabilities document
   */
  private parseLayersFromCapabilities(doc: Document): WmsLayer[] {
    const layers: WmsLayer[] = [];
    const layerElements = doc.querySelectorAll('Layer');

    layerElements.forEach((el) => {
      const name = el.querySelector('Name')?.textContent;
      const title = el.querySelector('Title')?.textContent;
      const abstract = el.querySelector('Abstract')?.textContent;

      if (name && title) {
        const extent = this.parseLayerExtent(el);
        const styles = this.parseStyles(el);

        layers.push({
          name,
          title,
          abstract: abstract || undefined,
          extent: extent || undefined,
          styles,
        });
      }
    });

    return layers;
  }

  /**
   * Parse layer extent from capabilities
   */
  private parseLayerExtent(layerEl: Element): [number, number, number, number] | null {
    const llBbox = layerEl.querySelector('LatLonBoundingBox');
    if (llBbox) {
      const minx = parseFloat(llBbox.getAttribute('minx') || '0');
      const miny = parseFloat(llBbox.getAttribute('miny') || '0');
      const maxx = parseFloat(llBbox.getAttribute('maxx') || '0');
      const maxy = parseFloat(llBbox.getAttribute('maxy') || '0');
      return [minx, miny, maxx, maxy];
    }
    return null;
  }

  /**
   * Parse styles from capabilities
   */
  private parseStyles(layerEl: Element): WmsStyle[] {
    const styles: WmsStyle[] = [];
    const styleElements = layerEl.querySelectorAll(':scope > Style');

    styleElements.forEach((el) => {
      const name = el.querySelector('Name')?.textContent;
      const title = el.querySelector('Title')?.textContent;

      if (name) {
        styles.push({
          name,
          title: title || name,
        });
      }
    });

    return styles;
  }

  /**
   * Clear capabilities cache
   */
  clearCache(): void {
    this.capabilitiesCache.clear();
  }
}
