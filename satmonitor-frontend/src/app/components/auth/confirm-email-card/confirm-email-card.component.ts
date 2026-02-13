import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-email-card',
  templateUrl: './confirm-email-card.component.html',
  styleUrls: ['./confirm-email-card.component.css']
})
export class ConfirmEmailCardComponent {
  @Input() email = '';
  @Input() token = '';
  @Input() loading = false;

  @Output() cancelled = new EventEmitter<void>();
  @Output() validated = new EventEmitter<void>();
}
