export interface CourtHouse {
  id: number;
  name: string;
  welshName?: string;
  courtType: string;
  courtLocationCode?: string;
  addressLines: string[];
  postcode: string;
  telephoneNo: number;
  startDate?: string;
  endDate?: string;
}
