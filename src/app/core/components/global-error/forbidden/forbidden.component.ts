import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, input } from '@angular/core';

import { HeaderService } from '@services/header.service';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forbidden.component.html',
})
export class ForbiddenComponent implements OnInit, OnDestroy {
  headerService = inject(HeaderService);

  header = input<string>();

  ngOnInit(): void {
    this.headerService.hideNavigation();
  }

  ngOnDestroy(): void {
    this.headerService.showNavigation();
  }
}
