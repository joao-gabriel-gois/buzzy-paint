export interface ICreateUserTokensDTO {
  id?: UUID;
  user_id: UUID;
  expiration_date: string;
  refresh_token: string;
}