import { UUID } from "../@types/index.d.ts";
import { ICreateUserDTO } from "../DTOs/CreateUserDTO.ts";
import { v4 as uuid } from 'npm:uuid';

export class User {
  public id: UUID;
  public email: string;
  public username: string;
  public firstName: string;
  public lastName: string;
  public password: string;

  constructor(userDTO: ICreateUserDTO) {
    const {
      id,
      email,
      username,
      firstName,
      lastName,
      password
    } = userDTO;

    this.id = id ? id : uuid() as UUID;
    this.email = email;
    this.username = username;
    this.firstName = firstName;
    this.lastName = lastName;
    this.password = password;
  }
}