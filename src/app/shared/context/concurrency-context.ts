import { HttpContextToken } from '@angular/common/http';
export const IF_MATCH = new HttpContextToken<string | null>(() => null);
export const ROW_VERSION = new HttpContextToken<string | null>(() => null);
