import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SatelliteSource {
  id: string;
  name: string;
  description: string;
  resolution: string; // e.g., "10m", "30m"
  temporalFrequency: string; // e.g., "5 days", "16 days"
  bands: string[];
  availability: string; // e.g., "2015-present"
}

export interface SearchFilter {
  startDate: Date;
  endDate: Date;
  dataSource: string;
  cloudCover?: number; // 0-100
  areaOfInterest?: {
    type: 'bbox' | 'polygon';
    coordinates: number[][] | number[][][];
  };
}

export interface SatelliteProduct {
  id: string;
  name: string;
  source: string;
  date: Date;
  cloudCover: number;
  thumbnail?: string;
  geometry?: any;
  metadata?: Record<string, any>;
}

/**
 * Service for satellite data discovery and management
 */
@Injectable({
  providedIn: 'root'
})
export class SatelliteDataService {
  // Available satellite data sources
  readonly satelliteSources: SatelliteSource[] = [
    {
      id: 'sentinel-2',
      name: 'Sentinel-2 (ESA)',
      description: 'Images multispectrale haute résolution (10-60m)',
      resolution: '10m-60m',
      temporalFrequency: '5 jours',
      bands: ['B2 (Bleu)', 'B3 (Vert)', 'B4 (Rouge)', 'B5-B11 (Infra-rouge)', 'B8 (NIR)', 'B12 (SWIR)'],
      availability: '2015-present'
    },
    {
      id: 'sentinel-1',
      name: 'Sentinel-1 (ESA)',
      description: 'Radar SAR pour la détection tous les temps',
      resolution: '10m-40m',
      temporalFrequency: '6 jours',
      bands: ['VV (Polarisation verticale-verticale)', 'VH (Polarisation croisée)'],
      availability: '2014-present'
    },
    {
      id: 'landsat-8',
      name: 'Landsat-8 (USGS)',
      description: 'Images multispectrale à moyen terme',
      resolution: '30m',
      temporalFrequency: '16 jours',
      bands: ['B1-B7 (Multispectral)', 'B8 (Panchromatique)', 'B10-B11 (Thermique)'],
      availability: '2013-present'
    },
    {
      id: 'landsat-9',
      name: 'Landsat-9 (USGS)',
      description: 'Successeur du Landsat-8 avec améliorations',
      resolution: '30m',
      temporalFrequency: '16 jours',
      bands: ['B1-B7 (Multispectral)', 'B8 (Panchromatique)', 'B10-B11 (Thermique)'],
      availability: '2021-present'
    },
    {
      id: 'copernicus-dem',
      name: 'Copernicus DEM',
      description: 'Modèle numérique d\'élévation (30m)',
      resolution: '30m',
      temporalFrequency: 'Statique',
      bands: ['Élévation'],
      availability: '2021'
    }
  ];

  private searchFilters$ = new BehaviorSubject<SearchFilter>({
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    endDate: new Date(),
    dataSource: 'sentinel-2',
    cloudCover: 30
  });

  private searchResults$ = new BehaviorSubject<SatelliteProduct[]>([]);
  private isSearching$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  /**
   * Get current search filters
   */
  getSearchFilters(): Observable<SearchFilter> {
    return this.searchFilters$.asObservable();
  }

  /**
   * Update search filters
   */
  updateSearchFilters(filters: Partial<SearchFilter>): void {
    const current = this.searchFilters$.value;
    this.searchFilters$.next({ ...current, ...filters });
  }

  /**
   * Get search results
   */
  getSearchResults(): Observable<SatelliteProduct[]> {
    return this.searchResults$.asObservable();
  }

  /**
   * Get search loading state
   */
  getSearchLoading(): Observable<boolean> {
    return this.isSearching$.asObservable();
  }

  /**
   * Search for satellite imagery
   */
  async searchImagery(filters: SearchFilter): Promise<SatelliteProduct[]> {
    this.isSearching$.next(true);
    try {
      // Simulated search results - in production, this would query actual APIs
      const results = this.generateMockResults(filters);
      this.searchResults$.next(results);
      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche de données satellite:', error);
      this.searchResults$.next([]);
      return [];
    } finally {
      this.isSearching$.next(false);
    }
  }

  /**
   * Get satellite source by ID
   */
  getSourceById(id: string): SatelliteSource | undefined {
    return this.satelliteSources.find(s => s.id === id);
  }

  /**
   * Generate mock search results for demonstration
   */
  private generateMockResults(filters: SearchFilter): SatelliteProduct[] {
    const results: SatelliteProduct[] = [];
    const source = this.getSourceById(filters.dataSource);
    if (!source) return results;

    // Generate 10 mock products
    for (let i = 0; i < 10; i++) {
      const date = new Date(filters.startDate);
      date.setDate(date.getDate() + Math.random() * 365);

      results.push({
        id: `${filters.dataSource}-${i}`,
        name: `${source.name} - ${date.toISOString().split('T')[0]}`,
        source: filters.dataSource,
        date,
        cloudCover: Math.floor(Math.random() * filters.cloudCover!),
        metadata: {
          tileId: `${Math.floor(Math.random() * 100)}`,
          processingLevel: 'L2A',
          processedDate: new Date().toISOString()
        }
      });
    }

    return results.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Export search results as JSON or GeoJSON
   */
  exportResultsAsJson(results: SatelliteProduct[], format: 'json' | 'geojson' = 'json'): string {
    if (format === 'geojson') {
      return this.exportAsGeoJson(results);
    }
    return JSON.stringify(results, null, 2);
  }

  /**
   * Export results as GeoJSON FeatureCollection
   */
  private exportAsGeoJson(results: SatelliteProduct[]): string {
    const features = results.map(product => ({
      type: 'Feature',
      id: product.id,
      geometry: product.geometry || {
        type: 'Point',
        coordinates: [0, 0] // Placeholder
      },
      properties: {
        name: product.name,
        source: product.source,
        date: product.date,
        cloudCover: product.cloudCover,
        metadata: product.metadata
      }
    }));

    return JSON.stringify({
      type: 'FeatureCollection',
      features
    }, null, 2);
  }

  /**
   * Download product metadata in specified format
   */
  downloadProductMetadata(product: SatelliteProduct, format: 'json' | 'geojson' = 'json'): void {
    let data: string;
    let mimeType: string;
    let filename: string;

    if (format === 'geojson') {
      const feature = {
        type: 'Feature',
        id: product.id,
        geometry: product.geometry || { type: 'Point', coordinates: [0, 0] },
        properties: {
          name: product.name,
          source: product.source,
          date: product.date,
          cloudCover: product.cloudCover,
          metadata: product.metadata
        }
      };
      data = JSON.stringify(feature, null, 2);
      mimeType = 'application/geo+json';
      filename = `${product.id}.geojson`;
    } else {
      data = JSON.stringify(product, null, 2);
      mimeType = 'application/json';
      filename = `${product.id}-metadata.json`;
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
