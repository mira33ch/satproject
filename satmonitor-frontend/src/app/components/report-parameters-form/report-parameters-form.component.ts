import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ReportGeneratePayload } from '../../pages/dashboard-reports/dashboard-reports.component';

@Component({
  selector: 'app-report-parameters-form',
  templateUrl: './report-parameters-form.component.html',
  styleUrls: ['./report-parameters-form.component.css']
})
export class ReportParametersFormComponent {
  @Input() zones: Array<{ value: string; label: string }> = [];
  @Input() phenomena: Array<{ value: string; label: string }> = [];

  @Output() cancel = new EventEmitter<void>();
  @Output() generate = new EventEmitter<ReportGeneratePayload>();

  form = this.fb.group({
    reportType: ['SYNTHESE_MENSUELLE', Validators.required],

    includeCartography: [false],
    includeStats: [false],
    includeRawData: [false],
    includeRecommendations: [false],

    exportFormat: ['PDF', Validators.required],
    resolution: ['MEDIUM', Validators.required],

    periodStart: ['', Validators.required],
    periodEnd: ['', Validators.required],

    zoneId: ['', Validators.required],
    phenomenonId: ['ALL', Validators.required],
  });

  constructor(private fb: FormBuilder) {}

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.generate.emit(this.form.getRawValue() as ReportGeneratePayload);
  }
}
