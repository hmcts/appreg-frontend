export interface ApiError {
  status: number;
  message: string | object;
  detail?: string;
}
