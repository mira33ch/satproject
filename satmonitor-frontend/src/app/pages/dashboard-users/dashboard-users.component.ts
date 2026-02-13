import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export type UserRole = 'ADMIN' | 'DEV' | 'DESIGNER' | 'PM' | 'ANALYST' | 'HR';

export interface UserRow {
  id: string;
  lastName: string;
  firstName: string;
  role: UserRole;
  roleLabel: string; // clé translate ex: 'USERS.ROLES.ADMIN'
  enabled: boolean;
  avatarUrl?: string;
}

@Component({
  selector: 'app-dashboard-users',
  templateUrl: './dashboard-users.component.html',
  styleUrls: ['./dashboard-users.component.css']
})
export class DashboardUsersComponent {
  // KPIs (mock)
  kpis = [
    { icon: 'assets/icons/users/tasks.svg', label: 'USERS.KPI_TASKS', value: '12' },
    { icon: 'assets/icons/users/cpu.svg', label: 'USERS.KPI_CPU', value: '67%' },
    { icon: 'assets/icons/users/storage.svg', label: 'USERS.KPI_STORAGE', value: '45/100 To' },
    { icon: 'assets/icons/users/ram.svg', label: 'USERS.KPI_RAM', value: '4,2/8 Go' },
    { icon: 'assets/icons/users/network.svg', label: 'USERS.KPI_NETWORK', value: '120 Mb/s' },
    { icon: 'assets/icons/users/api.svg', label: 'USERS.KPI_API', value: 'Opérationnelles' }
  ];

  // Reactive search
  searchCtrl = new FormControl<string>('', { nonNullable: true });

  page = 1;
  pageSize = 7;
  showAdd = false;

  users: UserRow[] = [
    { id: 'U1', lastName: 'Ndiaye', firstName: 'Abdoulaye', role: 'ADMIN', roleLabel: 'USERS.ROLES.ADMIN', enabled: true },
    { id: 'U2', lastName: 'Nguyen', firstName: 'Minh', role: 'DEV', roleLabel: 'USERS.ROLES.DEV', enabled: true },
    { id: 'U3', lastName: 'Smith', firstName: 'Emily', role: 'DESIGNER', roleLabel: 'USERS.ROLES.DESIGNER', enabled: false },
    { id: 'U4', lastName: 'Garcia', firstName: 'Sofia', role: 'PM', roleLabel: 'USERS.ROLES.PM', enabled: true },
    { id: 'U5', lastName: 'Chen', firstName: 'Wei', role: 'ANALYST', roleLabel: 'USERS.ROLES.ANALYST', enabled: true },
    { id: 'U6', lastName: 'Patel', firstName: 'Arjun', role: 'DEV', roleLabel: 'USERS.ROLES.DEV', enabled: true },
    { id: 'U7', lastName: 'Johnson', firstName: 'Michael', role: 'HR', roleLabel: 'USERS.ROLES.HR', enabled: false }
  ];

  private term = '';

  constructor() {
    this.searchCtrl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(v => {
        this.term = (v ?? '').trim().toLowerCase();
        this.page = 1;
      });
  }

  get filteredUsers(): UserRow[] {
    if (!this.term) return this.users;
    return this.users.filter(u =>
      `${u.lastName} ${u.firstName} ${u.role}`.toLowerCase().includes(this.term)
    );
  }

  get pagesCount(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }

  get pages(): number[] {
    return Array.from({ length: this.pagesCount }, (_, i) => i + 1);
  }

  get pagedUsers(): UserRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  goPage(p: number) {
    if (p < 1 || p > this.pagesCount) return;
    this.page = p;
  }

  openAdd() {
    this.showAdd = true;
  }

  onUserCreated(payload: { lastName: string; firstName: string; role: UserRole }) {
    const id = `U${Math.floor(Math.random() * 99999)}`;
    const roleLabel = `USERS.ROLES.${payload.role}`;
    this.users = [{ id, enabled: true, roleLabel, ...payload }, ...this.users];
    this.page = 1;
  }

  toggleEnabled(u: UserRow) {
    u.enabled = !u.enabled;
    // TODO backend call
  }

  editUser(u: UserRow) {
    // TODO open edit modal
    console.log('edit', u);
  }

  deleteUser(u: UserRow) {
    // TODO confirm modal
    this.users = this.users.filter(x => x.id !== u.id);
  }

  back() {
    history.back();
  }
}
