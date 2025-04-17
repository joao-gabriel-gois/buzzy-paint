export interface IAuthRequest {
  email: string;
  password: string;
}

export interface IAuthResponse {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
  };
  token: string;
  refresh_token: string;
}

export interface IRefreshAuthRequest {
  sub: string;
  email: string;
}

export interface IRefreshAuthResponse {
  token: string;
  refresh_token: string;
}