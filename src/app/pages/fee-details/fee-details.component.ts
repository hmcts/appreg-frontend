import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { initAll } from 'govuk-frontend';

@Component({
  selector: 'app-fee-details',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './fee-details.component.html',
  styleUrl: './fee-details.component.scss',
})
export class FeeDetailsComponent {
  public id!: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    initAll();
  }
}
