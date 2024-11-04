import { UUID } from "../@types/index.d.ts";

export interface ICreateUserDTO {
  id?: UUID;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}