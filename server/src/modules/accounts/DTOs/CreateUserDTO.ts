export interface ICreateUserDTO {
  id?: UUID;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  draws_mongo_id?: string;
}