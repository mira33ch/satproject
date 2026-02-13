import { Component, Input } from '@angular/core';

export interface SeriesPoint { x: string; y: number; }

@Component({
  selector: 'app-analysis-area-chart',
  templateUrl: './analysis-area-chart.component.html',
  styleUrls: ['./analysis-area-chart.component.css']
})
export class AnalysisAreaChartComponent {
  @Input() series: SeriesPoint[] = [];

  readonly w = 1000;
  readonly h = 420;

  // ✅ évite collision d'id si plusieurs charts sur la page
  readonly gradId = `areaGrad-${Math.random().toString(36).slice(2, 9)}`;

  private get safeSeries(): SeriesPoint[] {
    return Array.isArray(this.series) ? this.series : [];
  }

  private get maxY(): number {
    const ys = this.safeSeries.map(p => Number(p.y)).filter(v => Number.isFinite(v));
    return Math.max(...ys, 1);
  }

  /** Renvoie une liste de points "x y" (pas "x,y") pour être safe dans un path */
  get points(): string {
    const s = this.safeSeries;
    if (s.length === 0) return '';

    const maxY = this.maxY;

    // ✅ cas 1 seul point => on le centre horizontalement
    if (s.length === 1) {
      const x = this.w / 2;
      const y = this.h - (Number(s[0].y) / maxY) * this.h;
      return `${x} ${isFinite(y) ? y : this.h}`;
    }

    // ✅ cas normal
    return s.map((p, i) => {
      const t = i / (s.length - 1); // s.length >= 2 ici
      const x = t * this.w;

      const yy = Number(p.y);
      const ratio = Number.isFinite(yy) ? (yy / maxY) : 0;
      const y = this.h - ratio * this.h;

      return `${x} ${isFinite(y) ? y : this.h}`;
    }).join(' ');
  }

  get areaPath(): string {
    const pts = this.points;
    if (!pts) return '';

    // "M x y L x y L x y ..."
    // on transforme la chaîne de points en segments L
    const segs = pts.split(' ').reduce((acc, v, idx) => {
      // pts = "x y x y x y ..."
      // on regroupe par paires
      if (idx % 2 === 0) acc.push([v]); else acc[acc.length - 1].push(v);
      return acc;
    }, [] as string[][]).map(pair => `${pair[0]} ${pair[1]}`);

    const first = segs[0];
    const rest = segs.slice(1).map(p => `L ${p}`).join(' ');

    return `M ${first} ${rest} L ${this.w} ${this.h} L 0 ${this.h} Z`;
  }
}
