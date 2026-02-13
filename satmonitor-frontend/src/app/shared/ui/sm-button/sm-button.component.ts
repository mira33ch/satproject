import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'sm-button',
  templateUrl: './sm-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() fullWidth = false;

  @Input() disabled = false;
  @Input() loading = false;

  /** Text (tu peux utiliser labelKey + translate pipe ailleurs si tu veux) */
  @Input() label?: string;

  /** Icons */
  @Input() leftIcon?: string;
  @Input() rightIcon?: string;

  @Input() ariaLabel?: string;
  @Input() extraClass = '';

  @Output() clicked = new EventEmitter<MouseEvent>();

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  private base(): string {
    return [
      'inline-flex items-center justify-center gap-2 font-semibold',
      'rounded-lg transition active:translate-y-[1px]',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-60 disabled:cursor-not-allowed',
      this.fullWidth ? 'w-full' : '',
    ].join(' ');
  }

  private sizeCls(): string {
    switch (this.size) {
      case 'sm': return 'px-4 py-2 text-xs';
      case 'lg': return 'px-6 py-3 text-base';
      default: return 'px-5 py-2.5 text-sm';
    }
  }

  private variantCls(): string {
    // Couleur maquette
    const greenBg = 'bg-[#337027] hover:bg-[#2b5f20] text-white focus:ring-[#337027]/40';
    const greenOutline = 'bg-white border border-[#337027] text-[#337027] hover:bg-[#337027]/10 focus:ring-[#337027]/30';

    switch (this.variant) {
      case 'outline':
        return greenOutline;

      case 'secondary':
        return 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400';

      case 'danger':
        return 'bg-red-700 text-white hover:bg-red-800 focus:ring-red-400';

      case 'ghost':
        return 'bg-transparent text-gray-900 hover:bg-gray-100 focus:ring-gray-400';

      default: // primary
        return greenBg;
    }
  }

  get finalClass(): string {
    // Primary = pas de border, Outline = border
    const border = this.variant === 'outline' ? '' : 'border border-transparent';
    return [this.base(), border, this.sizeCls(), this.variantCls(), this.extraClass].filter(Boolean).join(' ');
  }

  onClick(e: MouseEvent) {
    if (this.isDisabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.clicked.emit(e);
  }
}
