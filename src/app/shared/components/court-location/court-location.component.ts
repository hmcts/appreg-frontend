import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { CourtHouse } from '../../../core/models/court-house';
import { CourthouseService } from '../../../core/services/court-locations.service';

@Component({
  selector: 'app-court-locations',
  standalone: true,
  templateUrl: 'court-location.component.html',
  imports: [AsyncPipe],
})
export class CourtLocationsComponent {
  private readonly svc = inject(CourthouseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly items$: Observable<CourtHouse[]> = this.svc.getAllCourtLocations$();

  // Load specific ID details if specified
  readonly selected$: Observable<CourtHouse | null> = this.route.paramMap.pipe(
    map((p) => p.get('id')),
    switchMap((id) => (id ? this.svc.getCourtLocationById$(+id) : of(null))),
  );

  readonly error$ = this.svc.error$;

  // Click handler in template
  loadCourtById(id: number): void {
    void this.router.navigate(['/court-locations', id]);
  }
}
