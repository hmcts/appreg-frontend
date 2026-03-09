import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { HeaderService } from '@core/services/header.service';

@Component({
  selector: 'app-list-close',
  imports: [],
  templateUrl: './list-close.component.html',
})
export class ListCloseComponent implements OnInit, OnDestroy {
  numberOfItems = input<number>(0);
  title = input<string>('');
  closeButtonTxt = input<string>('Continue');
  cancelButtonTxt = input<string>('Cancel');
  isRedCloseButton = input<boolean>(true);

  confirm = output<void>();
  cancelled = output<void>();

  isClosing = signal(false);

  headerService = inject(HeaderService);

  ngOnInit(): void {
    this.headerService.hideNavigation();
  }

  ngOnDestroy(): void {
    this.headerService.showNavigation();
  }

  onConfirm(): void {
    this.isClosing.set(true);
    this.confirm.emit();
  }

  onCancel(): void {
    this.isClosing.set(false);
    this.cancelled.emit();
  }
}
