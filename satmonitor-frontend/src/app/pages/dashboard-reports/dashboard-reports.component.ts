import { Component } from '@angular/core';

export type ExportFormat = 'PDF' | 'EXCEL' | 'GEOTIFF' | 'RAW';
export type ReportType = 'SYNTHESE_MENSUELLE' | 'SYNTHESE_HEBDO';

export interface ReportGeneratePayload {
  reportType: ReportType;
  includeCartography: boolean;
  includeStats: boolean;
  includeRawData: boolean;
  includeRecommendations: boolean;

  exportFormat: ExportFormat;
  resolution: 'LOW' | 'MEDIUM' | 'HIGH';

  periodStart: string; // yyyy-mm-dd
  periodEnd: string;   // yyyy-mm-dd
  zoneId: string;
  phenomenonId: string; // 'ALL' possible
}

export interface ReportItem {
  id: string;
  name: string;      // ex: Rapport_001.pdf
  createdAt: string; // ISO date
}

export interface ReportActionEvent {
  report: ReportItem;
  action: 'download';
  format: ExportFormat;
}
export interface ReportDeleteEvent {
  report: ReportItem;
  action: 'delete';
}

@Component({
  selector: 'app-dashboard-reports',
  templateUrl: './dashboard-reports.component.html',
  styleUrls: ['./dashboard-reports.component.css']
})
export class DashboardReportsComponent {
  // selects
  zones = [
    { value: 'Z1', label: 'Zone 1' },
    { value: 'Z2', label: 'Zone 2' },
  ];

  phenomena = [
    { value: 'ALL', label: 'Tous' },
    { value: 'FIRE', label: 'Incendie' },
    { value: 'FLOOD', label: 'Inondation' },
    { value: 'DROUGHT', label: 'Sécheresse' },
  ];

  // list
  search = '';
  reports: ReportItem[] = [
    { id: 'R1', name: 'Rapport_001.pdf', createdAt: new Date().toISOString() },
    { id: 'R2', name: 'Rapport_002.pdf', createdAt: new Date().toISOString() },
    { id: 'R3', name: 'Rapport_003.pdf', createdAt: new Date().toISOString() },
  ];

  get filteredReports(): ReportItem[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.reports;
    return this.reports.filter(r => r.name.toLowerCase().includes(term));
  }

  back() {
    history.back();
  }

  onCancel() {
    // optionnel : reset global / navigation
  }

  onGenerate(payload: ReportGeneratePayload) {
    // TODO: appel backend -> POST /reports/generate (payload)
    // backend renvoie { id, name, createdAt } => tu pushes dans reports

    const newItem: ReportItem = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      name: `Rapport_${String(this.reports.length + 1).padStart(3, '0')}.pdf`,
      createdAt: new Date().toISOString()
    };
    this.reports = [newItem, ...this.reports];
  }

  onSearch(v: string) {
    this.search = v;
  }

  onReportAction(ev: ReportActionEvent | ReportDeleteEvent) {
    if (ev.action === 'delete') {
      // TODO: DELETE /reports/{id}
      this.reports = this.reports.filter(r => r.id !== ev.report.id);
      return;
    }

    // download
    // TODO: GET /reports/{id}/download?format=PDF|EXCEL|GEOTIFF|RAW
    console.log('download', ev.report.id, ev.format);
  }
}
