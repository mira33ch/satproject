import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import type { UserRole } from '../../pages/dashboard-users/dashboard-users.component';

type CtrlKey = 'lastName' | 'firstName' | 'role';

@Component({
  selector: 'app-add-user-popup',
  templateUrl: './add-user-popup.component.html',
  styleUrls: ['./add-user-popup.component.css']
})
export class AddUserPopupComponent {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<{ lastName: string; firstName: string; role: UserRole }>();

  roles = [
    { value: 'ADMIN' as UserRole, label: 'USERS.ROLES.ADMIN' },
    { value: 'DEV' as UserRole, label: 'USERS.ROLES.DEV' },
    { value: 'DESIGNER' as UserRole, label: 'USERS.ROLES.DESIGNER' },
    { value: 'PM' as UserRole, label: 'USERS.ROLES.PM' },
    { value: 'ANALYST' as UserRole, label: 'USERS.ROLES.ANALYST' },
    { value: 'HR' as UserRole, label: 'USERS.ROLES.HR' }
  ];

  form = this.fb.nonNullable.group({
    lastName: ['', Validators.required],
    firstName: ['', Validators.required],
    role: ['' as UserRole | '', Validators.required]
  });

  constructor(private fb: FormBuilder) {}

  isInvalid(key: CtrlKey): boolean {
    const c = this.form.controls[key];
    return c.invalid && (c.touched || c.dirty);
  }

  // compatible sm-input: string | Event | {value:...}
  setCtrlValue(key: 'lastName' | 'firstName', evOrValue: unknown) {
    const v = this.extractValue(evOrValue);
    this.form.controls[key].setValue(v);
    this.form.controls[key].markAsDirty();
  }

  onRoleChange(ev: Event) {
    const v = (ev.target as HTMLSelectElement).value as UserRole;
    this.form.controls.role.setValue(v);
    this.form.controls.role.markAsDirty();
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { lastName, firstName, role } = this.form.getRawValue();
    this.created.emit({ lastName, firstName, role: role as UserRole });
  }

  private extractValue(evOrValue: unknown): string {
    if (typeof evOrValue === 'string') return evOrValue;
    if (evOrValue instanceof Event) {
      return (evOrValue.target as HTMLInputElement)?.value ?? '';
    }
    if (evOrValue && typeof evOrValue === 'object' && 'value' in (evOrValue as any)) {
      return String((evOrValue as any).value ?? '');
    }
    return '';
  }
}
