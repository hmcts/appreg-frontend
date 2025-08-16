import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-service-navigation',
  templateUrl: './service-navigation.component.html',
  imports: [RouterLinkActive, RouterLink, NgIf],
})
export class ServiceNavigationComponent implements OnInit {
  isLoginPage = false;

  @Output() signOut = new EventEmitter<void>();

  ngOnInit(): void {}

  onSignOutClicked(e: Event): void {
    e.preventDefault();
    window.location.href = '/sso/logout';
  }
}
