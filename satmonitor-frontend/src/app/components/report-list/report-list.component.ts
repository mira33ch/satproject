import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReportActionEvent, ReportDeleteEvent, ReportItem } from '../../pages/dashboard-reports/dashboard-reports.component';

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.css']
})
export class ReportListComponent {
  @Input() reports: ReportItem[] = [];
  @Input() search = '';

  @Output() searchChange = new EventEmitter<string>();
  @Output() action = new EventEmitter<ReportActionEvent | ReportDeleteEvent>();

  emitSearch(ev: Event) {
    const v = (ev.target as HTMLInputElement).value ?? '';
    this.searchChange.emit(v);
  }
}
