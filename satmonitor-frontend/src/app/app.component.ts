import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'SATMONITOR';
  constructor(private translate: TranslateService) {
    // langues supportées
    this.translate.addLangs(['fr', 'en']);

    // langue par défaut (fallback)
    this.translate.setDefaultLang('fr');

    // choix initial : si le navigateur est en "en", on prend en, sinon fr
    const browserLang = this.translate.getBrowserLang();
    const lang = browserLang && ['fr', 'en'].includes(browserLang) ? browserLang : 'fr';

    this.translate.use(lang);
  }
}
