
export interface IUpdateUserDTO {
  id: UUID;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  draws_mongo_id?: string;
}