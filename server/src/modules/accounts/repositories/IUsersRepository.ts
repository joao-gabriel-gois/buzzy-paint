import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { IUpdateUserDTO } from "@modules/accounts/DTOs/UpdateUserDTO.ts";

export interface IUsersRepository {
  createUser: (userDTO: ICreateUserDTO) => Promise<ManageableUser>;
  getUserById: (id: UUID) => Promise<ManageableUser | undefined>;
  getUserByEmail: (email: string) => Promise<ManageableUser | undefined>;
  getUserByUsername: (username: string) => Promise<ManageableUser | undefined>;
  updateUser: (user: IUpdateUserDTO) => Promise<ManageableUser>;
  deleteUser: (id: UUID) => Promise<ManageableUser | undefined>;
}