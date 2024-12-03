import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { IUpdateUserDTO } from "@modules/accounts/DTOs/UpdateUserDTO.ts";

export interface IUsersRepository {
  create: (userDTO: ICreateUserDTO) => Promise<ManageableUser>;
  findById: (id: UUID) => Promise<ManageableUser | undefined>;
  findByEmail: (email: string) => Promise<ManageableUser | undefined>;
  findByUsername: (username: string) => Promise<ManageableUser | undefined>;
  update: (user: IUpdateUserDTO) => Promise<ManageableUser>;
  delete: (id: UUID) => Promise<ManageableUser | undefined>;
}