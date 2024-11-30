import { DatabaseTransactionError } from "@shared/errors/ApplicationError.ts";
import { pool } from "@shared/infra/postgres/config.ts";
import { ICreateUserTokensDTO } from "@modules/accounts/DTOs/CreateUserTokensDTO.ts";
import { UserTokens } from "@modules/accounts/models/UserTokens.ts";
import IUsersTokensRepository from "@modules/accounts/repositories/IUsersTokensRepository.ts";


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

  async findAllByUserId(user_id: UUID): Promise<UserTokens[] | undefined> {
    const query = 'SELECT * FROM user_tokens WHERE user_id = $1';
    const values = [user_id];
    let result;
    
    try {
      result = await pool.query(query, values);
    }
    catch(error) {
      const dbError = new DatabaseTransactionError('Database Transaction for finding Tokens for a certain user_id has failed.');
      console.error(
        `[${new Date().toISOString()}]:`,
        `(${dbError}) Query has failed ⮷\n`,
        dbError.message + ':\n\t',
        error
      );
      throw dbError;
    }

    const { rows } = result;

    return rows;

  }

  async findUniqueByRefreshTokenAndUserId(refresh_token: string, user_id: string): Promise<UserTokens | undefined> {
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
      const dbError = new DatabaseTransactionError('Database Transaction for deleting token for this user has failed');
      console.error(
        `[${new Date().toISOString()}]:`,
        `(${dbError}) Query has failed ⮷\n`,
        dbError.message + ':\n\t',
        error
      );
      throw dbError;
    }
  }

  async deleteExpiredRefreshTokens(): Promise<void> {
    const query = "DELETE FROM user_tokens WHERE expiration_date < NOW() - INTERVAL '30 days'";
    try {
      await pool.query(query);
    }
    catch(error) {
      const dbError = new DatabaseTransactionError('Database Transaction for deleting all expired refresh tokens has failed');
      console.error(
        `[${new Date().toISOString()}]:`,
        `(${dbError}) Query has failed ⮷\n`,
        dbError.message + ':\n\t',
        error
      );
      throw dbError;
    }
  }
}

export const usersTokensRepository =  new UsersTokensRepository();
