/*
Shared types throughout this app
*/

import { Duration } from '../../shared/components/duration-input/duration-input.component';

export type SuccessBanner = {
  heading: string;
  body: string;
  link?: { href: string; text: string };
};

export interface FormRaw<S> {
  date: unknown;
  description: string | null;
  time: Duration | null;
  status: S | string | null;
  court: string | null;
  location: string | null;
  cja: string | null;
}
