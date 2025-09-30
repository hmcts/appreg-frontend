import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DurationInputComponent } from '../../shared/components/duration-input/duration-input.component';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DurationInputComponent,
  ],
  templateUrl: './applications-list-detail.html',
})
export class ApplicationsListDetail implements AfterViewInit {
  id!: number;
  currentFragment: string | null = null;

  formModel = {
    description: '',
    status: '',
    time: '',
    location: 'Default Location',
    cja: 'Default CJA',
    date: { day: '', month: '', year: '' },
    duration: { hours: '', minutes: '' },
    courthouseName: '',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngAfterViewInit(): void {}
}
