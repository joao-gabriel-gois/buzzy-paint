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

// export interface IErrorDetails {
//   name: string;
//   message: string;
// }

// export interface IValidationIssueDetails {
//   message: string;
//   path: string;
// }

// export interface IErrorResponse {
//   error: IErrorDetails;
// }

// export interface IValidationErrorDetails {
//   error: {
//     name: "Validation Error";
//     message: "There is one or more input validation errors" | "Error confirming password";
//     issues: IValidationIssueDetails[];
//   }
// }
