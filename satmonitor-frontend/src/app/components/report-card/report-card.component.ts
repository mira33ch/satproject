import { Component, EventEmitter, HostListener, Input, Output, ElementRef } from '@angular/core';
import { ExportFormat, ReportActionEvent, ReportDeleteEvent, ReportItem } from '../../pages/dashboard-reports/dashboard-reports.component';

@Component({
  selector: 'app-report-card',
  templateUrl: './report-card.component.html',
  styleUrls: ['./report-card.component.css']
})
export class ReportCardComponent {
  @Input() report!: ReportItem;
  @Output() action = new EventEmitter<ReportActionEvent | ReportDeleteEvent>();

  menuOpen = false;

  constructor(private el: ElementRef) {}

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  onDownload(format: ExportFormat) {
    this.action.emit({ report: this.report, action: 'download', format });
    this.menuOpen = false;
  }

  onDelete() {
    this.action.emit({ report: this.report, action: 'delete' });
    this.menuOpen = false;
  }

  // click outside => close
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    if (!this.menuOpen) return;
    const clickedInside = this.el.nativeElement.contains(ev.target);
    if (!clickedInside) this.menuOpen = false;
  }
}
