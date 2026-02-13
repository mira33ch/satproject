import { Component } from '@angular/core';

type AlertLevel = 'CRITIQUE' | 'ELEVE' | 'MOYEN';
type AlertStatus = 'Traiter' | 'Suivi';

export interface AlertRow {
  id: string;
  phenomenon: string;
  icon: string;          // assets/icons/phenomenes/...
  iconBorderClass: string; // tailwind border color
  kpiLine1: string;      // ex: "NBR: -0,68"
  kpiLine2: string;      // ex: "Surf: 450 Ha"
  date: string;          // "12/12/2024"
  time: string;          // "14:32"
  location: string;      // "Alpes"
  level: AlertLevel;
  status: AlertStatus;
  selected?: boolean;
}

@Component({
  selector: 'app-dashboard-alerts',
  templateUrl: './dashboard-alerts.component.html',
  styleUrls: ['./dashboard-alerts.component.css']
})
export class DashboardAlertsComponent {
kpis = [
    { icon: 'assets/icons/alerts/total.svg', label: 'Total des alertes', value: '152', iconClass: 'text-red-500' },
    { icon: 'assets/icons/alerts/done.svg',  label: 'Traitées',         value: '89%', iconClass: 'text-green-600' },
    { icon: 'assets/icons/alerts/crit.svg',  label: 'Niveau Critique',  value: '72',  iconClass: 'text-gray-500' },
    { icon: 'assets/icons/alerts/high.svg',  label: 'Niveau Élevé',     value: '72',  iconClass: 'text-gray-500' },
    { icon: 'assets/icons/alerts/time.svg',  label: 'Temps moyen',      value: '2h15',iconClass: 'text-gray-500' }
  ];

  q = '';
  page = 1;
  pageSize = 7;

  rows: AlertRow[] = [
    {
      id: 'A-001',
      phenomenon: 'Incendie',
      icon: 'assets/icons/fire.svg',
      iconBorderClass: 'border-orange-400/60',
      kpiLine1: 'NBR: -0,68',
      kpiLine2: 'Surf: 450 Ha',
      date: '12/12/2024',
      time: '14:32',
      location: 'Alpes',
      level: 'CRITIQUE',
      status: 'Suivi'
    },
    {
      id: 'A-002',
      phenomenon: 'Inondation',
      icon: 'assets/icons/flood.svg',
      iconBorderClass: 'border-sky-400/60',
      kpiLine1: 'NDWI: +0,45',
      kpiLine2: 'Surf: 12 Km2',
      date: '02/09/2025',
      time: '10:02',
      location: 'Herault',
      level: 'ELEVE',
      status: 'Traiter'
    },
    {
      id: 'A-003',
      phenomenon: 'Sécheresse',
      icon: 'assets/icons/drought.svg',
      iconBorderClass: 'border-amber-700/40',
      kpiLine1: 'VCI: 0,25',
      kpiLine2: 'Durée: 3 mois',
      date: '25/11/2025',
      time: '23:50',
      location: 'Herault',
      level: 'ELEVE',
      status: 'Traiter'
    },
    {
      id: 'A-004',
      phenomenon: 'Inondation',
      icon: 'assets/icons/flood.svg',
      iconBorderClass: 'border-sky-400/60',
      kpiLine1: 'VCI: 0,70',
      kpiLine2: 'Durée: 2 semaines',
      date: '15/10/2025',
      time: '10:30',
      location: 'Aude',
      level: 'CRITIQUE',
      status: 'Suivi'
    },
    {
      id: 'A-005',
      phenomenon: 'Tempête',
      icon: 'assets/icons/storm.svg',
      iconBorderClass: 'border-stone-500/40',
      kpiLine1: 'VCI: 0,55',
      kpiLine2: 'Durée: 1 mois',
      date: '02/12/2025',
      time: '18:00',
      location: 'Gard',
      level: 'ELEVE',
      status: 'Traiter'
    },
    {
      id: 'A-006',
      phenomenon: 'Canicule',
      icon: 'assets/icons/heat.svg',
      iconBorderClass: 'border-amber-700/40',
      kpiLine1: 'VCI: 0,80',
      kpiLine2: 'Durée: 1 semaine',
      date: '08/08/2025',
      time: '14:15',
      location: 'Vaucluse',
      level: 'ELEVE',
      status: 'Traiter'
    },
    {
      id: 'A-007',
      phenomenon: 'Gel',
      icon: 'assets/icons/frost.svg',
      iconBorderClass: 'border-cyan-300/60',
      kpiLine1: 'VCI: 0,40',
      kpiLine2: 'Durée: 4 mois',
      date: '20/02/2026',
      time: '06:45',
      location: 'Alpes-Maritimes',
      level: 'CRITIQUE',
      status: 'Suivi'
    }
  ];
addAlert=false;
  get filtered(): AlertRow[] {
    const term = this.q.trim().toLowerCase();
    if (!term) return this.rows;
    return this.rows.filter(r =>
      [r.phenomenon, r.location, r.level, r.status, r.kpiLine1, r.kpiLine2]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }

  get pagesCount(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get paged(): AlertRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get allSelected(): boolean {
    return this.paged.length > 0 && this.paged.every(r => !!r.selected);
  }

  toggleAll(checked: boolean) {
    this.paged.forEach(r => r.selected = checked);
  }

  goPage(p: number) {
    if (p < 1 || p > this.pagesCount) return;
    this.page = p;
  }

  onSearchChange() {
    this.page = 1;
  }

  // actions toolbar (mock)
  actionFilter() { /* TODO */ }
  actionExport() { /* TODO */ }
  actionMail() { /* TODO */ }
  actionEdit() { /* TODO */ }

  // navigation
  back() {
    history.back();
  }

  levelBadgeClass(level: AlertLevel): string {
    if (level === 'CRITIQUE') return 'bg-red-100 text-red-600';
    if (level === 'ELEVE') return 'bg-orange-100 text-orange-600';
    return 'bg-gray-100 text-gray-600';
  }

  statusClass(status: AlertStatus): string {
    return status === 'Traiter' ? 'text-green-600' : 'text-orange-500';
  }

  toggleAllFromEvent(ev: Event) {
  const checked = (ev.target as HTMLInputElement).checked;
  this.toggleAll(checked);
}
setRowSelected(r: AlertRow, ev: Event) {
  r.selected = (ev.target as HTMLInputElement).checked;
}
actionAdd(){
this.addAlert=true;
}
onAlertCreated(payload: any) {
  // En attendant le backend : tu peux pousser dans la table
  console.log('NEW ALERT', payload);
  this.addAlert = false;
}

}
