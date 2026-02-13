import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';

@Component({
  selector: 'sm-modal',
  templateUrl: './sm-modal.component.html',
  styleUrls: ['./sm-modal.component.css']
})
export class SmModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('panel', { static: true }) panelRef!: ElementRef<HTMLDivElement>;

    @Input() hideHeader = false;         // ✅ pas de barre de titre
  @Input() contentClass = '';          // ✅ custom padding
  @Input() panelClass = '';            // ✅ custom classes
  @Input() backdropClass = 'bg-gray-900/60'; // ✅ niveau d’opacité


  @Input() title?: string;
  @Input() titleKey?: string;
  @Input() titleParams?: Record<string, any>;

  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;
  @Input() showCloseButton = true;

  @Input() closeLabel?: string;
  @Input() closeLabelKey?: string; // ex: COMMON.CLOSE

  @Output() close = new EventEmitter<void>();

  private lastActiveElement: HTMLElement | null = null;
  private keyListener = (e: KeyboardEvent) => this.onKeydown(e);

  ngAfterViewInit(): void {
    this.lastActiveElement = document.activeElement as HTMLElement;

    setTimeout(() => {
      const focusable = this.getFocusableElements();
      if (focusable.length) focusable[0].focus();
      else this.panelRef.nativeElement.focus();
    });

    document.addEventListener('keydown', this.keyListener, true);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.keyListener, true);
    if (this.lastActiveElement) {
      setTimeout(() => this.lastActiveElement?.focus());
    }
  }

  requestClose() { this.close.emit(); }

  backdropClick() {
    if (this.closeOnBackdrop) this.requestClose();
  }

  private onKeydown(e: KeyboardEvent) {
    if (this.closeOnEscape && e.key === 'Escape') {
      e.preventDefault();
      this.requestClose();
      return;
    }

    // Focus trap
    if (e.key === 'Tab') {
      const focusable = this.getFocusableElements();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  get panelSizeClass(): string {
    switch (this.size) {
      case 'sm': return 'max-w-[420px]';
      case 'lg': return 'max-w-[920px]';
      default: return 'max-w-[640px]';
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const root = this.panelRef.nativeElement;
    const selectors =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(root.querySelectorAll<HTMLElement>(selectors))
      .filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  }
}