import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import * as intlTelInput from 'intl-tel-input';
export interface InputErrorsMap {
  required?: string;
  min?: string;
  max?: string;
  minlength?: string;
  maxlength?: string;
  cannotContainSpace?: string;
  whitespace?: string;
  email?: string;

}

@Component({
  selector: 'sm-input',
  templateUrl: './sm-input.component.html',
  styleUrls: ['./sm-input.component.css']
})
export class SmInputComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('input') inputElement!: ElementRef<HTMLInputElement>;

  /** ReactiveForms (optionnel) */
  @Input() formGroup?: FormGroup;
  @Input() controlName?: string;

  /** affichage d'erreurs au submit */
  @Input() submitted = false;

  /** id/name */
  @Input() id = '';
  @Input() name = '';

  /** events */
  @Output() onchange = new EventEmitter<any>();
  @Output() rightIconClick = new EventEmitter<void>();

  /** icons */
  @Input() icon = 'icons/search.png';
  @Input() hasIcon = false;

  @Input() rightIcon = false;
  @Input() rightIconSrc = 'icons/search.png';

  @Input() iconAlt = 'icon';
  @Input() rightIconAlt = 'icon';

  /** rules */
  @Input() required = false;
  @Input() min: number | undefined = undefined;
  @Input() max: number | undefined = undefined;
  @Input() step: number | undefined = undefined;
  @Input() maxLength: number | undefined = undefined;

  /** ui */
  @Input() withClearBtn = false;
  @Input() readonly = false;

  /** placeholder i18n */
  @Input() placeholder = 'Recherche';
  @Input() placeholderKey?: string;
  @Input() placeholderParams?: Record<string, any>;

  /** value (mode hybride) */
  @Input() value: any;

  /** erreurs personnalisées (texte) */
  @Input() errorsMessage?: InputErrorsMap;

  /** erreurs personnalisées (clés i18n) */
  @Input() errorsMessageKey?: Partial<Record<keyof InputErrorsMap, string>>;

  /** erreur personnalisée */
  @Input() personalError?: string;
  @Input() personalErrorKey?: string;
  @Input() personalErrorParams?: Record<string, any>;

  @Input() type: 'text' | 'number' | 'password' | 'email' | 'tel' = 'text';

  /** compteur */
  @Input() showCounter = false;

 /** Nouvelles propriétés pour intl-tel-input */
  @Input() intlTelInput = false; 
  @Input() initialCountry = 'tn';

  currentName = '';
  currentId = '';
  inputFormControl!: FormControl;

  /** placeholders/errors résolus */
  resolvedPlaceholder = '';
  resolvedPersonalError = '';

  // Variable pour stocker l'instance de intlTelInput
  private iti: any; 


  private valueSub?: Subscription;

  constructor(private translate: TranslateService) { }

  ngOnInit(): void {
    this.currentName = this.name?.trim()?.length ? `${this.name}-${this.uid()}` : `sm-input-${this.uid()}`;
    this.currentId = this.id?.trim()?.length ? `${this.id}-${this.uid()}` : `sm-input-${this.uid()}`;

    this.bindControl();          // IMPORTANT
    this.resolveStaticTexts();
  }

   ngAfterViewInit() {
    // AJOUT: Initialisation de intl-tel-input si activé et type=tel
    if (this.intlTelInput && this.type === 'tel') {
      this.initIntlTelInput();
    }
  }


  ngOnChanges(changes: SimpleChanges): void {
    // si on change de control, on rebind
    if (changes['formGroup'] || changes['controlName']) {
      this.bindControl();
    }

    // Si le parent pousse une value (mode hybride), on sync SANS écraser le parent si value undefined
    if (changes['value'] && this.inputFormControl && this.value !== undefined) {
      this.inputFormControl.setValue(this.value, { emitEvent: false });

       // AJOUT: Synchroniser intl-tel-input si activé
      if (this.intlTelInput && this.iti) {
        this.iti.setNumber(this.value);
      }

    }

    if (
      changes['placeholder'] ||
      changes['placeholderKey'] ||
      changes['placeholderParams'] ||
      changes['personalError'] ||
      changes['personalErrorKey'] ||
      changes['personalErrorParams']
    ) {
      this.resolveStaticTexts();
    }
  }

  ngOnDestroy(): void {
    this.valueSub?.unsubscribe();

      // AJOUT: Nettoyage de l'instance intl-tel-input pour éviter les fuites mémoire
    if (this.iti) {
      this.iti.destroy();
    }

  }

  private resolveStaticTexts(): void {
    this.resolvedPlaceholder = this.placeholderKey
      ? this.translate.instant(this.placeholderKey, this.placeholderParams)
      : (this.placeholder || '');

    this.resolvedPersonalError = this.personalErrorKey
      ? this.translate.instant(this.personalErrorKey, this.personalErrorParams)
      : (this.personalError || '');
  }

  private bindControl(): void {
    this.valueSub?.unsubscribe();

    this.inputFormControl = this.getBoundControl();

    // Si pas de formGroup, on applique validators dynamiques
    if (!this.formGroup) {
      this.setValidators();
    }

    // IMPORTANT : ne pas écraser la valeur du parent à la création
    // Si tu veux initialiser une valeur externe, fais-le seulement si value est définie
    if (this.value !== undefined) {
      this.inputFormControl.setValue(this.value, { emitEvent: false });
    }

    this.valueSub = this.inputFormControl.valueChanges.subscribe((newValue: any) => {
      this.onModelChange(newValue);
    });
  }

  private getBoundControl(): FormControl {
    if (this.formGroup && this.controlName) {
      const ctrl = this.formGroup.get(this.controlName);
      if (ctrl instanceof FormControl) return ctrl;
    }
    return new FormControl('', []);
  }

  private setValidators(): void {
    const validators = [];

    if (this.required) validators.push(Validators.required);
    if (this.min !== undefined) validators.push(Validators.min(this.min));
    if (this.max !== undefined) validators.push(Validators.max(this.max));
    if (this.maxLength !== undefined) validators.push(Validators.maxLength(this.maxLength));

    this.inputFormControl.setValidators(validators);
    this.inputFormControl.updateValueAndValidity({ emitEvent: false });
  }


// AJOUT: Méthode pour initialiser intl-tel-input
  private initIntlTelInput(): void {
    const input = this.inputElement.nativeElement;
    
    // Configuration de intl-tel-input
    this.iti = intlTelInput(input, {
      initialCountry: this.initialCountry,
      preferredCountries: ['tn', 'fr', 'ma', 'dz', 'us'], // Pays préférés dans la liste
      separateDialCode: true, // Affiche le code pays séparément
      utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/19.2.19/js/utils.js' // IMPORTANT pour la validation et le formatage
    });

    // Écouter les changements pour mettre à jour la valeur du FormControl
    input.addEventListener('input', () => {
      this.onIntlTelInputChange();
    });

    // Écouter les changements de pays
    input.addEventListener('countrychange', () => {
      this.onIntlTelInputChange();
    });

    // Initialiser avec la valeur existante si disponible
    if (this.value) {
      this.iti.setNumber(this.value);
    }
  }

  // AJOUT: Gestion des changements dans intl-tel-input
  private onIntlTelInputChange(): void {
    if (!this.iti) return;

    // Récupérer le numéro au format international (ex: +33123456789)
    const number = this.iti.getNumber();
    this.value = number;
    
    // Mettre à jour le FormControl
    if (this.inputFormControl) {
      this.inputFormControl.setValue(number, { emitEvent: false });
    }
    
    // Émettre l'événement de changement
    this.onchange.emit(number);
    this.markAsTouched();
  }

 // AJOUT: Méthode publique pour vérifier si le numéro est valide
  isValidPhoneNumber(): boolean {
    return this.iti ? this.iti.isValidNumber() : false;
  }

  // AJOUT: Méthode pour obtenir le numéro formaté
  getPhoneNumber(): string {
    return this.iti ? this.iti.getNumber() : '';
  }

  get f() {
    return (this.formGroup && this.controlName && this.controlName.length > 0)
      ? this.formGroup.get(this.controlName)
      : undefined;
  }

  onRightIconClick(): void {
    this.rightIconClick.emit();
  }

  onFocus(): void {
    this.markAsTouched();
  }

  onBlur(): void {
    // Trim uniquement au blur (pas à chaque frappe)
    if (typeof this.inputFormControl.value === 'string') {
      const v = this.inputFormControl.value.trim();
      if (v !== this.inputFormControl.value) {
        this.inputFormControl.setValue(v, { emitEvent: false });
        this.value = v;
        this.onchange.emit(v);
      }
    }
    this.markAsTouched();
  }

  // private markAsTouched(): void {
  //   if (this.f && this.value != null && this.value.toString().length > 0) {
  //     this.f.markAsTouched();
  //   }
  // }

  private markAsTouched(): void {
    if (this.f) this.f.markAsTouched();
  }


  private onModelChange(newValue: any): void {
    this.value = newValue;


  // AJOUT: Synchroniser intl-tel-input avec la nouvelle valeur
    if (this.intlTelInput && this.iti && newValue) {
      this.iti.setNumber(newValue);
    }


    // maxLength au paste
    if (typeof this.value === 'string' && this.maxLength != null && this.value.length > this.maxLength) {
      this.value = this.value.slice(0, this.maxLength);
      this.inputFormControl.setValue(this.value, { emitEvent: false });
    }

    this.markAsTouched();
    this.onchange.emit(this.value);
  }

  clearInput(): void {
    
      // AJOUT: Réinitialiser intl-tel-input
    if (this.intlTelInput && this.iti) {
      this.iti.setNumber('');
    }

    this.value = '';
    this.inputFormControl.setValue(this.value);
    this.onchange.emit(this.value);
  }

  getInputType(value: any): string {
    return typeof value === 'number' ? 'number' : 'text';
  }

  getValueAsString(value: any): string {
    return value as string;
  }

  assetPath(path: string): string {
    return `assets/${path}`.replace('assets/assets/', 'assets/');
  }

  resolveError(key: keyof InputErrorsMap, fallback: string, params?: Record<string, any>): string {
    const transKey = this.errorsMessageKey?.[key];
    if (transKey) return this.translate.instant(transKey, params);

    const custom = this.errorsMessage?.[key];
    if (custom) return this.interpolate(custom, params);

    return this.interpolate(fallback, params);
  }

  private interpolate(msg: string, params?: Record<string, any>): string {
    if (!params) return msg;
    return Object.keys(params).reduce((acc, k) => {
      return acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k]));
    }, msg);
  }

  private uid(): string {
    return Math.random().toString(36).slice(2, 10);
  }
}
