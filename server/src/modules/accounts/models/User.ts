import { ICreateUserDTO } from "../DTOs/CreateUserDTO.ts";
import { v4 as uuid } from 'npm:uuid';

export class User {
  public id;
  public email;
  public username;
  public firstName;
  public lastName;
  public password;

  constructor(userDto: ICreateUserDTO) {
    const {
      id,
      email,
      username,
      firstName,
      lastName,
      password
    } = userDto;


    this.id = id ? id : uuid();
    this.email = email;
    this.username = username;
    this.firstName = firstName;
    this.lastName = lastName;
    this.password = password;
  }
}