import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-topbar',
  templateUrl: './dashboard-topbar.component.html',
  styleUrls: ['./dashboard-topbar.component.css']
})
export class DashboardTopbarComponent {
 @Input() title = 'Dashboard';
  userName = 'Lamine FALL';
constructor(private router: Router) {}
  goToProfile(): void {
  this.router.navigate(['/dashboard/profile']);
}

}
