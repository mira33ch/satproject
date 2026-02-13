import { Component } from '@angular/core';

type IndicatorId = 'incendies' | 'inondations' | 'secheresses';

interface SeriesPoint { x: string; y: number; }

interface ZoneStatRow {
  zone: string;
  surf: number;
  nbrAvg: number;
  nbrMax: number;
  conf: number;
}

interface AnalysisModel {
  id: IndicatorId;
  title: string;        // "Evolution NBR"
  label: string;        // "Incendies"
  icon: string; 
  value:string;  
    colorClassBorder:string;  
        // assets/icons/...
  series: SeriesPoint[];
  rows: ZoneStatRow[];
  params: {
    autoDetection: boolean;
    seasonalTrends: boolean;
    customThresholdAlerts: boolean;
    nbrCritical: number;
    nbr: number;
    surfaceMin: number;
  };
}

@Component({
  selector: 'app-dashboard-analyses',
  templateUrl: './dashboard-analyses.component.html',
  styleUrls: ['./dashboard-analyses.component.css']

})
export class DashboardAnalysesComponent {
  selectedId: IndicatorId = 'incendies';

  analyses: AnalysisModel[] = [
    {
      id: 'incendies',
      title: 'Evolution NBR',
      label: 'Incendies',
      icon: 'assets/icons/fire.svg',
      value: '12',
    colorClassBorder: 'border-orange-400',
      series: [
        { x: 'Jan', y: 82 }, { x: 'Fév', y: 90 }, { x: 'Mar', y: 65 }, { x: 'Avr', y: 83 },
        { x: 'Mai', y: 67 }, { x: 'Juin', y: 74 }, { x: 'Juil', y: 45 }, { x: 'Août', y: 28 },
        { x: 'Sept', y: 15 }, { x: 'Oct', y: 26 }, { x: 'Nov', y: 22 }, { x: 'Déc', y: 8 }
      ],
      rows: [
        { zone: 'Z_001', surf: 12345, nbrAvg: 0.34, nbrMax: 0.72, conf: 92 },
        { zone: 'Z_002', surf: 67890, nbrAvg: 1.20, nbrMax: 0.95, conf: 88 },
        { zone: 'Z_003', surf: 54321, nbrAvg: 0.50, nbrMax: 0.60, conf: 76 },
        { zone: 'Z_004', surf: 98765, nbrAvg: 2.76, nbrMax: 1.10, conf: 80 },
        { zone: 'Z_005', surf: 13579, nbrAvg: 1.45, nbrMax: 0.85, conf: 95 }
      ],
      params: {
        autoDetection: true,
        seasonalTrends: false,
        customThresholdAlerts: true,
        nbrCritical: -0.3,
        nbr: -0.1,
        surfaceMin: 10
      }
    },
    {
      id: 'inondations',
      title: 'Evolution Index',
      label: 'Inondations',
      icon: 'assets/icons/flood.svg',
       value: '05',
    colorClassBorder: 'border-sky-400',
      series: [
        { x: 'Jan', y: 30 }, { x: 'Fév', y: 32 }, { x: 'Mar', y: 28 }, { x: 'Avr', y: 35 },
        { x: 'Mai', y: 40 }, { x: 'Juin', y: 55 }, { x: 'Juil', y: 62 }, { x: 'Août', y: 70 },
        { x: 'Sept', y: 68 }, { x: 'Oct', y: 50 }, { x: 'Nov', y: 38 }, { x: 'Déc', y: 33 }
      ],
      rows: [
        { zone: 'Z_011', surf: 22345, nbrAvg: 0.44, nbrMax: 0.82, conf: 90 },
        { zone: 'Z_012', surf: 17890, nbrAvg: 0.95, nbrMax: 1.15, conf: 84 }
      ],
      params: {
        autoDetection: true,
        seasonalTrends: true,
        customThresholdAlerts: false,
        nbrCritical: 0.8,
        nbr: 0.5,
        surfaceMin: 20
      }
    },
    {
      id: 'secheresses',
      title: 'Evolution Index',
      label: 'Sécheresses',
      icon: 'assets/icons/drought.svg',
      value: '08 Régions',
    colorClassBorder: 'border-amber-700',
      series: [
        { x: 'Jan', y: 60 }, { x: 'Fév', y: 58 }, { x: 'Mar', y: 55 }, { x: 'Avr', y: 52 },
        { x: 'Mai', y: 48 }, { x: 'Juin', y: 44 }, { x: 'Juil', y: 40 }, { x: 'Août', y: 38 },
        { x: 'Sept', y: 35 }, { x: 'Oct', y: 33 }, { x: 'Nov', y: 30 }, { x: 'Déc', y: 28 }
      ],
      rows: [
        { zone: 'Z_021', surf: 92345, nbrAvg: 1.10, nbrMax: 1.60, conf: 78 }
      ],
      params: {
        autoDetection: false,
        seasonalTrends: true,
        customThresholdAlerts: true,
        nbrCritical: 1.5,
        nbr: 1.0,
        surfaceMin: 15
      }
    }
  ];

  get current(): AnalysisModel {
    return this.analyses.find(a => a.id === this.selectedId) ?? this.analyses[0];
  }

  back(): void {
    history.back();
  }

  select(id: IndicatorId): void {
    this.selectedId = id;
  }
}
