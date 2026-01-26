import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { HeaderService } from '@services/header.service';
import { SessionService } from '@services/session.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent implements OnInit, OnDestroy {
  headerService = inject(HeaderService);
  sessionService = inject(SessionService);
  readonly isAuthenticated = this.sessionService.isAuthenticated;

  constructor() {
    void this.sessionService.refresh();
  }

  ngOnInit(): void {
    this.headerService.hideNavigation();
  }

  ngOnDestroy(): void {
    this.headerService.showNavigation();
  }
}
