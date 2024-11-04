import { UUID } from "../@types/index.d.ts";

export interface IUpdateUserDTO {
  id: UUID;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}