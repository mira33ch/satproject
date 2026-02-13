import { Component, EventEmitter, Output } from '@angular/core';

export type AlertLevel = 'CRITIQUE' | 'ELEVE' | 'MOYEN';

export interface AddAlertPayload {
  phenomenon: string;
  date: string;       // yyyy-mm-dd
  location: string;
  level: AlertLevel | '';
}

type FieldKey = keyof AddAlertPayload;

@Component({
  selector: 'app-add-alert-popup',
  templateUrl: './add-alert-popup.component.html',
  styleUrls: ['./add-alert-popup.component.css']
})
export class AddAlertPopupComponent {
  @Output() close = new EventEmitter<void>();
  @Output() submitAlert = new EventEmitter<AddAlertPayload>();

  phenomena = [
    { value: 'INCENDIE', label: 'Incendies' },
    { value: 'INONDATION', label: 'Inondations' },
    { value: 'SECHERESSE', label: 'Sécheresses' },
    { value: 'TEMPETE', label: 'Tempêtes' },
    { value: 'CANICULE', label: 'Canicules' },
    { value: 'GEL', label: 'Gel' },
  ];

  levels: { value: AlertLevel; label: string }[] = [
    { value: 'CRITIQUE', label: 'Critique' },
    { value: 'ELEVE', label: 'Élevé' },
    { value: 'MOYEN', label: 'Moyen' },
  ];

  form: AddAlertPayload = {
    phenomenon: '',
    date: '',
    location: '',
    level: '',
  };

  errors: Partial<Record<FieldKey, string>> = {};

  cancel(): void {
    this.close.emit();
  }

  // ---- inputs helpers (no ngModel) ----
  onInput(key: Exclude<FieldKey, 'level' | 'phenomenon'>, ev: Event) {
    const v = (ev.target as HTMLInputElement).value;
    this.setValue(key, v as any);
  }

  onSelectChange(key: 'phenomenon' | 'level', ev: Event) {
    const v = (ev.target as HTMLSelectElement).value;
    this.setValue(key, v as any);
  }

  onSmInput(
    key: Exclude<FieldKey, 'level' | 'phenomenon'>,
    evOrValue: unknown
  ) {
    let v = '';

    if (typeof evOrValue === 'string') {
      v = evOrValue;
    } else if (evOrValue instanceof Event) {
      v = (evOrValue.target as HTMLInputElement)?.value ?? '';
    } else if (evOrValue && typeof evOrValue === 'object' && 'value' in (evOrValue as any)) {
      v = String((evOrValue as any).value ?? '');
    }

    this.setValue(key, v as any);
  }

  setValue<K extends FieldKey>(key: K, value: AddAlertPayload[K]) {
    this.form[key] = value;
    if (this.errors[key]) delete this.errors[key];
  }

  submit(): void {
    if (!this.validate()) return;
    this.submitAlert.emit({ ...this.form });
    this.close.emit();
  }

  private validate(): boolean {
    const e: Partial<Record<FieldKey, string>> = {};

    if (!this.form.phenomenon) e.phenomenon = 'Champ obligatoire';
    if (!this.form.date) e.date = 'Champ obligatoire';
    if (!this.form.location.trim()) e.location = 'Champ obligatoire';
    if (!this.form.level) e.level = 'Champ obligatoire';

    this.errors = e;
    return Object.keys(e).length === 0;
  }
}
