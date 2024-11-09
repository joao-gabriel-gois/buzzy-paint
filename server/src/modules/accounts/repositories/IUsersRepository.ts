import { ManageableUser, UUID } from "../@types/index.d.ts";
import { ICreateUserDTO } from "../DTOs/CreateUserDTO.ts";
import { IUpdateUserDTO } from "../DTOs/UpdateUserDTO.ts";

export interface IUsersRepository {
  createUser: (userDTO: ICreateUserDTO) => Promise<ManageableUser>;
  getUserById: (id: UUID) => Promise<ManageableUser | undefined>;
  getUserByEmail: (email: string) => Promise<ManageableUser | undefined>;
  getUserByUsername: (username: string) => Promise<ManageableUser | undefined>;
  updateUser: (user: IUpdateUserDTO) => Promise<ManageableUser>;
  deleteUser: (id: UUID) => Promise<ManageableUser | undefined>;
}