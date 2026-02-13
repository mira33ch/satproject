import { Component, Input } from '@angular/core';
@Component({
  selector: 'app-analysis-parameters',
  templateUrl: './analysis-parameters.component.html',
  styleUrls: ['./analysis-parameters.component.css']
})
export class AnalysisParametersComponent {
  @Input() model!: any;
  parseNumber(v: string): number {
  // récupère le dernier nombre dans la string (ex: "NBR : -0,1")
  const cleaned = (v ?? '').replace(',', '.');
  const match = cleaned.match(/-?\d+(\.\d+)?$/);
  return match ? Number(match[0]) : 0;
}

}
