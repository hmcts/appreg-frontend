import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { initAll } from 'govuk-frontend';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-application-create',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './application-create.component.html',
  styleUrl: './application-create.component.scss',
})
export class ApplicationCreateComponent {
  public id!: string;
  currentFragment: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    initAll();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.currentFragment = this.route.snapshot.fragment;
    });
  }
}
