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
  selector: 'app-delete',
  standalone: true,
  imports: [],
  templateUrl: './delete.component.html',
})
export class DeleteComponent implements OnInit, OnDestroy {
  numberOfItems = input<number>(0);
  title = input<string>('');
  deleteButtonTxt = input<string>('Yes - delete');
  cancelButtonTxt = input<string>('Cancel');
  isRedDeleteButton = input<boolean>(true);

  confirm = output<void>();
  cancelled = output<void>();

  isDeleting = signal(false);

  headerService = inject(HeaderService);

  ngOnInit(): void {
    this.headerService.hideNavigation();
  }

  ngOnDestroy(): void {
    this.headerService.showNavigation();
  }

  onConfirm(): void {
    this.isDeleting.set(true);
    this.confirm.emit();
  }

  onCancel(): void {
    this.isDeleting.set(false);
    this.cancelled.emit();
  }
}
