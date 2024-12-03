import { pool } from '@shared/infra/postgres/config.ts';
import { hash, checkHash } from "@utils/hash.ts";
import { DatabaseTransactionError, NotFoundError } from "@shared/errors/ApplicationError.ts";
import { User } from "@modules/accounts/models/User.ts";
import { IUsersRepository } from "@modules/accounts/repositories/IUsersRepository.ts";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { IUpdateUserDTO } from "@modules/accounts/DTOs/UpdateUserDTO.ts";

class UserRepository implements IUsersRepository {
  async create(userDTO: ICreateUserDTO) {
    let {
      id,
      username,
      email,
      password,
      firstname: lastName,
      lastname: firstName,
    } = new User(userDTO);
    
    password = await hash(password);

    const query = 'INSERT INTO users (id, email, username, password, firstName, lastName) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    const values = [id, email, username, password, firstName, lastName];
    let result;
    try {
      result = await pool.query(query, values);
    }
    catch(error) {
      const dbError = new DatabaseTransactionError('Database Transaction for creating user has failed');
      console.error(
        `[${new Date().toISOString()}]:`,
        `(${dbError}) Query has failed ⮷\n`,
        dbError.message + ':\n\t',
        error
      );
      throw dbError;
    }
    const { rows } = result;
    return rows[0] as ManageableUser;
  }

  async findById(id: UUID) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const values = [id];
    let result;
    try {
      result = await pool.query(query, values);
    }
    catch(error) {
      const dbError = new DatabaseTransactionError('Database Transaction for finding user by `id` has failed');
      console.error(
        `[${new Date().toISOString()}]:`,
        `(${dbError}) Query has failed ⮷\n`,
        dbError.message + ':\n\t',
        error
      );
      throw dbError;
    }
    const { rows } = result;
    return rows[0] as ManageableUser | undefined;
  }

  async findByEmail(email: string) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const values = [email];
    let result;
    try {
      result = await pool.query(query, values);
    }
    catch(error) {
      const dbError = new DatabaseTransactionError('Database Transaction for finding user by `email` has failed');
      console.error(
        `[${new Date().toISOString()}]:`,
        `(${dbError.name}) Query has failed ⮷\n`,
        dbError.message + ':\n\t',
        error
      );
      throw dbError;
    }
    const { rows } = result;
    return rows[0] as ManageableUser | undefined;
  }

  async findByUsername(username: string) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const values = [username];
    let result;
    try {
      result = await pool.query(query, values);
    }
    catch(error) {
      const dbError = new DatabaseTransactionError('Database Transaction for finding user by `username` has failed');
      console.error(
        `[${new Date().toISOString()}]:`,
        `(${dbError.name}) Query has failed ⮷\n`,
        dbError.message + ':\n\t',
        error
      );
      throw dbError;
    }
    const { rows } = result;
    return rows[0] as ManageableUser | undefined;
  }

  async update(user: IUpdateUserDTO) {
    const currentUser = await this.findById(user.id);
    if (!currentUser) throw new NotFoundError('User not found');
  
    const updates: string[] = [];
    const values: (UUID | string | number)[] = [];
    let index = 1;

    if (user.email && user.email !== currentUser.email) {
      updates.push(`email = $${index}`);
      values.push(user.email);
      index++;
    }
    if (user.firstName && user.firstName !== currentUser.firstname) {
      updates.push(`firstName = $${index}`);
      values.push(user.firstName);
      index++;
    }
    if (user.lastName && user.lastName !== currentUser.lastname) {
      updates.push(`lastName = $${index}`);
      values.push(user.lastName);
      index++;
    }
    if (user.password) {
      const samePassword = await checkHash(user.password, currentUser.password!); // ensured by service error handler
      if (!samePassword) {
        const hashedPassword = await hash(user.password);
        updates.push(`password = $${index}`);
        values.push(hashedPassword);
        index++;
      }
    }
    if (user.draws_mongo_id) {
      updates.push(`draws_mongo_id = $${index}`);
      values.push(user.draws_mongo_id);
      index++;
    }
    if (updates.length === 0) {
      return currentUser; // No changes
    }
    // Creating dynamic query in order to update only the real changed values
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${index} RETURNING *`;
    values.push(user.id);
  
    let result;
    try {
      result = await pool.query(query, values);
    }
    catch(error) {
      const dbError = new NotFoundError('User intended to be updated was not found');
      console.error(
        `[${new Date().toISOString()}]:`,
        `(${dbError.name}) Query has failed ⮷\n`,
        dbError.message + ':\n\t',
        error
      );
      throw dbError;
    }
    const { rows } = result;

    return rows[0] as ManageableUser;
  }
  
  async delete(id: UUID) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const values = [id];
    let result;
    try {
      result = await pool.query(query, values);
    }
    catch(error) {
      const dbError = new NotFoundError('User intended to be deleted was not found');
      console.error(
        `[${new Date().toISOString()}]:`,
        `(${dbError.name}) Query has failed ⮷\n`,
        dbError.message + ':\n\t',
        error
      );
      throw dbError;
    }
    const { rows } = result;
    return rows[0] as ManageableUser;
  }
}

export const usersRepository =  new UserRepository();
