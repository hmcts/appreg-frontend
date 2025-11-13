import { ActivatedRoute } from '@angular/router';

export function getEntryId(route: ActivatedRoute): string | null {
  return route.snapshot.paramMap.get('entryId')
    || route.snapshot.paramMap.get('id')
    || route.snapshot.queryParamMap.get('entryId');
}
