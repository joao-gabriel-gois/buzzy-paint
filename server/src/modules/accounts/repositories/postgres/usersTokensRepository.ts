import { DatabaseTransactionError } from "../../../../shared/errors/ApplicationError.ts";
import { pool } from "../../../../shared/infra/postgres/config.ts";
import { ICreateUserTokensDTO } from "../../DTOs/CreateUserTokensDTO.ts";
import { UserTokens } from "../../models/UserTokens.ts";
import IUsersTokensRepository from "../IUsersTokensRepository.ts";


class UsersTokensRepository implements IUsersTokensRepository {
  async create(createUserDTO: ICreateUserTokensDTO): Promise<UserTokens> {
    const {
      id,
      user_id,
      expiration_date,
      refresh_token
    } = new UserTokens(createUserDTO);

    const query = 'INSERT INTO user_tokens (id, user_id, expiration_date, refresh_token) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [id, user_id, expiration_date, refresh_token];
    let result;
    try {
      result = await pool.query(query, values);
    }
    catch(error) {
      const dbError = new DatabaseTransactionError('Database Transaction for creating token for this user has failed');
      console.error(
        `[${new Date().toISOString()}]:`,
        `(${dbError}) Query has failed ⮷\n`,
        dbError.message + ':\n\t',
        error
      );
      throw dbError;
    }

    const { rows } = result;
    return rows[0] as UserTokens;
  }

  async findByRefreshTokenAndUserId(refresh_token: string, user_id: string): Promise<UserTokens | undefined> {
    const query = 'SELECT * FROM user_tokens WHERE refresh_token = $1 AND user_id = $2';
    const values = [refresh_token, user_id];
    let result;

    try {
      result = await pool.query(query, values);
    }
    catch(error) {
      const dbError = new DatabaseTransactionError('Database Transaction for finding Token by refresh_token and user_id has failed.');
      console.error(
        `[${new Date().toISOString()}]:`,
        `(${dbError}) Query has failed ⮷\n`,
        dbError.message + ':\n\t',
        error
      );
      throw dbError;
    }
    
    const { rows } = result;
    return rows && rows[0] as UserTokens;
  }

  async deleteById(id: string): Promise<void> {
    const query = 'DELETE FROM user_tokens WHERE id = $1';
    const values = [id];

    try {
      await pool.query(query, values);
    }
    catch(error) {
      const dbError = new DatabaseTransactionError('Database Transaction for creating token for this user has failed');
      console.error(
        `[${new Date().toISOString()}]:`,
        `(${dbError}) Query has failed ⮷\n`,
        dbError.message + ':\n\t',
        error
      );
      throw dbError;
    }
  }

  async findByRefreshToken(refresh_token: string): Promise<UserTokens | undefined> {
    const query = 'SELECT refresh_token FROM user_tokens WHERE refresh_token = $1';
    const values = [refresh_token];
    let result;

    try {
      result = await pool.query(query, values);
    }
    catch(error) {
      const dbError = new DatabaseTransactionError('Database Transaction for finding Token by refresh_token has failed.');
      console.error(
        `[${new Date().toISOString()}]:`,
        `(${dbError}) Query has failed ⮷\n`,
        dbError.message + ':\n\t',
        error
      );
      throw dbError;
    }
    const { rows } = result;

    return rows && rows[0] as UserTokens;
  }
}

export const usersTokensRepository =  new UsersTokensRepository();
