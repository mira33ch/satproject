
import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent {
  title = 'Dashboard';

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.updateTitle());
    this.updateTitle();
  }

  private updateTitle(): void {
    const url = this.router.url;
    if (url.includes('/dashboard/indicators')) this.title = 'Liste des indicateurs';
    else if (url.includes('/dashboard/map')) this.title = 'Carte';
    else this.title = 'Dashboard';
  }
}
