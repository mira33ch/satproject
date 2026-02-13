import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { IndicatorCategory, IndicatorDto, IndicatorService } from 'src/app/http_services/indicator/indicator.service';

@Component({
  selector: 'app-dashboard-indicators',
  templateUrl: './dashboard-indicators.component.html'
})
export class DashboardIndicatorsComponent implements OnInit {
  tab: IndicatorCategory = 'general';

  // ✅ remplace ngModel
  qCtrl = new FormControl<string>('', { nonNullable: true });

  page = 1;
  pageSize = 9;

  total = 0;
  items: IndicatorDto[] = [];

  // ✅ pagination stable (pas de [].constructor)
  pages: number[] = [];

  constructor(private indicators: IndicatorService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  back(): void {
    this.router.navigate(['/dashboard']);
  }

  setTab(tab: IndicatorCategory): void {
    this.tab = tab;
    this.page = 1;
    this.load();
  }

  search(): void {
    this.page = 1;
    this.load();
  }

  load(): void {
    const q = (this.qCtrl.value || '').trim();

    const res = this.indicators.list({
      category: this.tab,
      page: this.page,
      pageSize: this.pageSize,
      q
    });

    this.items = res.items;
    this.total = res.total;

    this.pages = Array.from({ length: this.pagesCount }, (_, i) => i + 1);
  }

  get pagesCount(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  goPage(p: number): void {
    const max = this.pagesCount;
    const next = Math.min(Math.max(1, p), max);
    if (next === this.page) return;
    this.page = next;
    this.load();
  }
}
