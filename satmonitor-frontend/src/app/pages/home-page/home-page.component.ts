
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/http_services/auth/auth.service';
import { IndicatorCategory, IndicatorDto, IndicatorService } from 'src/app/http_services/indicator/indicator.service';


@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {
tab: IndicatorCategory = 'general';
  items: IndicatorDto[] = [];

  constructor(private indicators: IndicatorService, private router: Router , private authService: AuthService) {}

  ngOnInit(): void {
    this.load();
  }

  setTab(tab: IndicatorCategory): void {
    this.tab = tab;
    this.load();
  }

  load(): void {
    this.items = this.indicators.list({ category: this.tab, page: 1, pageSize: 5 }).items;
  }

  goAll(): void {
    this.router.navigate(['/dashboard/indicators']);
  }

  goMap(): void {
    this.router.navigate(['/dashboard/map']);
  }

 testApi() {
  console.log('Testing endpoint: /login-service/test');
  
  this.authService.testApi().subscribe({
    next: (res: any) => {
      console.log('✅ Test réussi:', res);
      alert(`Test API réussi: ${res}`);
    },
    error: (err) => {
      console.error('❌ Test échoué:', err);
      
      if (err.status === 401) {
        //alert('Non autorisé ! Le token a peut-être expiré.');
        
        // Optionnel : tente un refresh automatique
        this.authService.refreshToken().subscribe({
          next: () => {
            alert('Token rafraîchi, réessayez le test.');
            this.testApi(); // Réessaye
          },
          error: (refreshErr) => {
            alert('Session expirée, veuillez vous reconnecter.');
            this.router.navigate(['/login']);
          }
        });
        
      } else if (err.status === 403) {
        alert('Accès refusé ! Vous n\'avez pas les permissions nécessaires.');
      } else if (err.status === 404) {
        alert('Endpoint non trouvé. Vérifiez que le service est démarré.');
      } else {
        alert(`Erreur ${err.status}: ${err.message || 'Erreur inconnue'}`);
      }
    }
  });
}
 


}
