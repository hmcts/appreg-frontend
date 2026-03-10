import {
  Component,
  OnDestroy,
  OnInit,
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
export class ReviewConfirmComponent implements OnInit, OnDestroy {
  numberOfItems = input<number>(0);
  title = input<string>('');
  confirmButtonTxt = input<string>('Continue');
  cancelButtonTxt = input<string>('Cancel');
  isRedButton = input<boolean>(true);

  confirm = output<void>();
  cancelled = output<void>();

  isConfirmed = signal(false);

  headerService = inject(HeaderService);

  ngOnInit(): void {
    this.headerService.hideNavigation();
  }

  ngOnDestroy(): void {
    this.headerService.showNavigation();
  }

  onConfirm(): void {
    this.isConfirmed.set(true);
    this.confirm.emit();
  }

  onCancel(): void {
    this.isConfirmed.set(false);
    this.cancelled.emit();
  }
}
