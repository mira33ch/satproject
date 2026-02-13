import { Component,Input  } from '@angular/core';
interface ZoneStatRow {
  zone: string;
  surf: number;
  nbrAvg: number;
  nbrMax: number;
  conf: number;
}

@Component({
  selector: 'app-analysis-stats-table',
  templateUrl: './analysis-stats-table.component.html',
  styleUrls: ['./analysis-stats-table.component.css']
})
export class AnalysisStatsTableComponent {
    @Input() rows: ZoneStatRow[] = [];

}
