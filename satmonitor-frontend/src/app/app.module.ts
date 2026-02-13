import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { FormsModule } from '@angular/forms';

import { NavbarComponent } from './components/navbar/navbar.component';

import { HomePageComponent } from './pages/home-page/home-page.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { LoginPopupComponent } from './components/auth/login-popup/login-popup.component';
import { RegisterPopupComponent } from './components/auth/register-popup/register-popup.component';

import { SharedModule } from './shared/shared.module';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { DashboardLayoutComponent } from './pages/dashboard-layout/dashboard-layout.component';
import { DashboardIndicatorsComponent } from './pages/dashboard-indicators/dashboard-indicators.component';
import { DashboardMapComponent } from './pages/dashboard-map/dashboard-map.component';
import { DashboardSidebarComponent } from './components/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardTopbarComponent } from './components/dashboard-topbar/dashboard-topbar.component';
import { SatMapComponent } from './components/sat-map/sat-map.component';
import { IndicatorCardComponent } from './components/indicator-card/indicator-card.component';
import { MapToolbarComponent } from './components/map-toolbar/map-toolbar.component';
import { DashboardAnalysesComponent } from './pages/dashboard-analyses/dashboard-analyses.component';
import { AnalysisAreaChartComponent } from './components/analysis-area-chart/analysis-area-chart.component';
import { AnalysisStatsTableComponent } from './components/analysis-stats-table/analysis-stats-table.component';
import { AnalysisParametersComponent } from './components/analysis-parameters/analysis-parameters.component';
import { DashboardAlertsComponent } from './pages/dashboard-alerts/dashboard-alerts.component';
import { AddAlertPopupComponent } from './components/add-alert-popup/add-alert-popup.component';
import { ForgotPasswordPopupComponent } from './components/auth/forgot-password-popup/forgot-password-popup.component';
import { ResetPasswordPageComponent } from './pages/reset-password-page/reset-password-page.component';
import { ResetPasswordPopupComponent } from './components/auth/reset-password-popup/reset-password-popup.component';
import { ConfirmEmailPageComponentComponent } from './pages/confirm-email-page-component/confirm-email-page-component.component';
import { ConfirmEmailCardComponent } from './components/auth/confirm-email-card/confirm-email-card.component';
import { DashboardReportsComponent } from './pages/dashboard-reports/dashboard-reports.component';
import { ReportParametersFormComponent } from './components/report-parameters-form/report-parameters-form.component';
import { ReportListComponent } from './components/report-list/report-list.component';
import { ReportCardComponent } from './components/report-card/report-card.component';
import { ReportActionsMenuComponent } from './components/report-actions-menu/report-actions-menu.component';
import { DashboardUsersComponent } from './pages/dashboard-users/dashboard-users.component';
import { AddUserPopupComponent } from './components/add-user-popup/add-user-popup.component';
import { DashboardProfileComponent } from './pages/dashboard-profile/dashboard-profile.component';

export class AssetsTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`./assets/i18n/${lang}.json`);
  }
}

export function translateLoaderFactory(http: HttpClient) {
  return new AssetsTranslateLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomePageComponent,
    LandingPageComponent,
    LoginPopupComponent,
    RegisterPopupComponent,
    DashboardLayoutComponent,
    DashboardIndicatorsComponent,
    DashboardMapComponent,
    DashboardSidebarComponent,
    DashboardTopbarComponent,
    SatMapComponent,
    IndicatorCardComponent,
    MapToolbarComponent,
    DashboardAnalysesComponent,
    AnalysisAreaChartComponent,
    AnalysisStatsTableComponent,
    AnalysisParametersComponent,
    DashboardAlertsComponent,
    AddAlertPopupComponent,
    ForgotPasswordPopupComponent,
    ResetPasswordPageComponent,
    ResetPasswordPopupComponent,
    ConfirmEmailPageComponentComponent,
    ConfirmEmailCardComponent,
    DashboardReportsComponent,
    ReportParametersFormComponent,
    ReportListComponent,
    ReportCardComponent,
    ReportActionsMenuComponent,
    DashboardUsersComponent,
    AddUserPopupComponent,
    DashboardProfileComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,     // ✅ OBLIGATOIRE
    SharedModule,

    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: translateLoaderFactory,
        deps: [HttpClient],
      },
      // optionnel : si tu veux éviter d’échapper certains caractères
      // useDefaultLang: true
    }),
  ],
  providers: [
    {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
