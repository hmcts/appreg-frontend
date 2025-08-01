import { CourtHouse } from './court-house';

export interface ApplicationList {
  id: number;
  description: string;
  status: string;
  date: string;
  time: string;
  changedDate: string;
  changedBy: string;
  version: number;
  courthouse: CourtHouse;
  cja: 'Default CJA';
  location: '-';
  hours: '05';
  minutes: '00';
}

export interface ApplicationListWrite {
  courthouseId: number;
  description: string;
  status: string;
  date: string;
  time: string;
}
