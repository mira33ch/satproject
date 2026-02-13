import { Injectable } from '@angular/core';

export type IndicatorCategory = 'general' | 'custom';

export interface IndicatorDto {
  id: string;
  title: string;
  value: number;
  metaLeftLabel?: string;
  metaLeftValue?: string;
  metaRightLabel?: string;
  metaRightValue?: string;
  icon: string;        // ex: 'assets/icons/fire.svg'
  iconBgClass: string; // ex: 'bg-orange-50'
  category: IndicatorCategory;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class IndicatorService {
  private readonly all: IndicatorDto[] = [
    {
      id: '1',
      title: 'Incendies actifs',
      value: 12,
      metaLeftLabel: 'Var',
      metaLeftValue: '3',
      metaRightLabel: 'Niv',
      metaRightValue: 'Élevé',
      icon: 'assets/icons/fire.svg',
      iconBgClass: 'bg-orange-50',
      category: 'general'
    },
    {
      id: '2',
      title: 'Inondations',
      value: 5,
      metaLeftLabel: 'Zone',
      metaLeftValue: '1',
      icon: 'assets/icons/flood.svg',
      iconBgClass: 'bg-sky-50',
      category: 'general'
    },
    {
      id: '3',
      title: 'Sécheresses',
      value: 8,
      metaLeftLabel: 'Régions',
      metaLeftValue: '8',
      metaRightLabel: 'Niv',
      metaRightValue: 'Critique',
      icon: 'assets/icons/drought.svg',
      iconBgClass: 'bg-amber-50',
      category: 'general'
    },
    {
      id: '4',
      title: 'Alertes récentes (24H)',
      value: 15,
      icon: 'assets/icons/alert.svg',
      iconBgClass: 'bg-red-50',
      category: 'general'
    },

    // exemples “custom”
    {
      id: '5',
      title: 'Alpes maritimes',
      value: 1,
      icon: 'assets/icons/pin.svg',
      iconBgClass: 'bg-emerald-50',
      category: 'custom'
    },
    {
      id: '6',
      title: 'Occitanie',
      value: 3,
      metaRightLabel: 'Niv',
      metaRightValue: 'Critique',
      icon: 'assets/icons/pin.svg',
      iconBgClass: 'bg-emerald-50',
      category: 'custom'
    }
  ];

  list(params: {
    category: IndicatorCategory;
    page: number;
    pageSize: number;
    q?: string;
  }): PagedResult<IndicatorDto> {
    const q = (params.q || '').trim().toLowerCase();

    const filtered = this.all
      .filter(x => x.category === params.category)
      .filter(x => !q || x.title.toLowerCase().includes(q));

    const total = filtered.length;
    const start = (params.page - 1) * params.pageSize;
    const items = filtered.slice(start, start + params.pageSize);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }
}
