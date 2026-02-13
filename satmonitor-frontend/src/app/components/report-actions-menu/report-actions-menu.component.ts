import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ExportFormat, ReportItem } from '../../pages/dashboard-reports/dashboard-reports.component';

@Component({
  selector: 'app-report-actions-menu',
  templateUrl: './report-actions-menu.component.html',
  styleUrls: ['./report-actions-menu.component.css']
})
export class ReportActionsMenuComponent {
  @Input() report!: ReportItem;

  @Output() close = new EventEmitter<void>();
  @Output() download = new EventEmitter<ExportFormat>();
  @Output() delete = new EventEmitter<void>();
}
