import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { DashboardLayoutComponent } from './pages/dashboard-layout/dashboard-layout.component';
import { DashboardIndicatorsComponent } from './pages/dashboard-indicators/dashboard-indicators.component';
import { DashboardMapComponent } from './pages/dashboard-map/dashboard-map.component';
import { DashboardAnalysesComponent } from './pages/dashboard-analyses/dashboard-analyses.component';
import { DashboardAlertsComponent } from './pages/dashboard-alerts/dashboard-alerts.component';
import { ResetPasswordPageComponent } from './pages/reset-password-page/reset-password-page.component';
import { ConfirmEmailPageComponentComponent } from './pages/confirm-email-page-component/confirm-email-page-component.component';
import { DashboardReportsComponent } from './pages/dashboard-reports/dashboard-reports.component';
import { DashboardUsersComponent } from './pages/dashboard-users/dashboard-users.component';
import { DashboardProfileComponent } from './pages/dashboard-profile/dashboard-profile.component';



const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'reset-password', component: ResetPasswordPageComponent },
  { path: 'confirm-email', component: ConfirmEmailPageComponentComponent },
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    children: [
      { path: '', component: HomePageComponent },
      { path: 'home', component: HomePageComponent },
      { path: 'indicators', component: DashboardIndicatorsComponent },
      { path: 'map', component: DashboardMapComponent },
      { path: 'analyses', component: DashboardAnalysesComponent },
      { path: 'alerts', component: DashboardAlertsComponent },
      { path: 'reports', component: DashboardReportsComponent },
      { path: 'users', component: DashboardUsersComponent },
      { path: 'profile', component: DashboardProfileComponent },



    ]
  },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
