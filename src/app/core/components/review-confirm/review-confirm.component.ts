import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { HeaderService } from '@services/header.service';

@Component({
  selector: 'app-review-confirm',
  standalone: true,
  imports: [],
  templateUrl: './review-confirm.component.html',
})
export class ReviewConfirmComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  numberOfItems = input<number>(0);
  title = input<string>('');
  confirmButtonTxt = input<string>('Continue');
  cancelButtonTxt = input<string>('Cancel');
  isRedButton = input<boolean>(true);
  disabled = input<boolean | null>(null);
  scrollToTopOnInit = input<boolean>(false);

  confirm = output<void>();
  cancelled = output<void>();

  isConfirmed = signal(false);
  buttonDisabled = computed(() => this.disabled() ?? this.isConfirmed());

  headerService = inject(HeaderService);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    this.headerService.hideNavigation();
  }

  ngOnDestroy(): void {
    this.headerService.showNavigation();
  }

  ngAfterViewInit(): void {
    if (!this.scrollToTopOnInit() || !isPlatformBrowser(this.platformId)) {
      return;
    }

    setTimeout(() => window.scrollTo(0, 0), 0);
  }

  onConfirm(): void {
    if (this.buttonDisabled()) {
      return;
    }

    if (this.disabled() === null) {
      this.isConfirmed.set(true);
    }

    this.confirm.emit();
  }

  onCancel(): void {
    this.isConfirmed.set(false);
    this.cancelled.emit();
  }
}
