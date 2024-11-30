export interface IUpdateUserDTO {
  id: UUID;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}