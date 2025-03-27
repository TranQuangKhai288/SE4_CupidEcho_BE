export interface IApiResponse<T> {
  status: "OK" | "ERR";
  message: string;
  data?: T;
  access_token?: string;
  refresh_token?: string;
}
