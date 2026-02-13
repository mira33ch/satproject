import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { TraitementCatalogResponse, TraitementPhenomenaResponse, TraitementPipelineContext, TraitementRunRequest } from './traitement-api.models';

@Injectable({ providedIn: 'root' })
export class TraitementApiService {
  private readonly baseUrl = '/traitement';

  constructor(private http: HttpClient) {}

  async listPhenomena(): Promise<Record<string, string>> {
    const res = await firstValueFrom(this.http.get<TraitementPhenomenaResponse>(`${this.baseUrl}/phenomena`));
    return res?.phenomena ?? {};
  }

  async getCatalogRaw(): Promise<TraitementCatalogResponse | null> {
    try {
      return await firstValueFrom(this.http.get<TraitementCatalogResponse>(`${this.baseUrl}/catalog`));
    } catch {
      return null;
    }
  }

  async run(req: TraitementRunRequest): Promise<TraitementPipelineContext> {
    return await firstValueFrom(this.http.post<TraitementPipelineContext>(`${this.baseUrl}/run`, req));
  }
}
