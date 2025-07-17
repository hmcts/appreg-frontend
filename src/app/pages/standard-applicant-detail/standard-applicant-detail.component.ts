import { Component } from '@angular/core';
import {initAll} from "govuk-frontend";
import {ActivatedRoute, RouterLink} from "@angular/router";

@Component({
  selector: 'app-standard-applicant-detail',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './standard-applicant-detail.component.html',
  styleUrl: './standard-applicant-detail.component.scss'
})
export class StandardApplicantDetailComponent {
  public id!: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    initAll();
  }

}
