import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterModule }   from '@angular/router';

@Component({
  selector: 'app-service-navigation',
  standalone: true,
  imports: [ CommonModule, RouterModule ],
  templateUrl: './service-navigation.component.html',
  styleUrls: ['./service-navigation.component.scss']
})
export class ServiceNavigationComponent {
  @Input() isLoginPage = false;

  @Output() signOut = new EventEmitter<MouseEvent>();

  handleSignOut(evt: MouseEvent) {
    evt.preventDefault();
    this.signOut.emit(evt);
  }
}
