import { checkHash } from "@utils/hash.ts";
import { sign } from 'npm:jsonwebtoken';
import { InvalidParameterError, BadRequestError, BusinessLogicError } from "@shared/errors/ApplicationError.ts";
import { usersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";
import auth from "@config/auth.ts";
import { usersTokensRepository } from "@modules/accounts/repositories/postgres/usersTokensRepository.ts";
import { expiryDateMapper, pgsqlDateAdapter } from "@utils/expiryDateMapper.ts";
import { IUsersRepository } from "@modules/accounts/repositories/IUsersRepository.ts";
import IUsersTokensRepository from "@modules/accounts/repositories/IUsersTokensRepository.ts";

interface IRequest {
  email: string;
  password: string;
}

interface IResponse {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
  };
  token: string;
  refresh_token: string;
}

class AuthenticateUserService {
  constructor(
    private usersTokensRepository: IUsersTokensRepository,
    private usersRepository: IUsersRepository,
  ) {};

  async execute({ email, password }: IRequest): Promise<IResponse> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user || !user!.id) {
      throw new BadRequestError('Incorrect Email or password!');
    }

    const  {
      token_secret,
      token_expires_in,
      refresh_token_secret,
      refresh_token_expires_in
    } = auth;

    if (!(token_secret || token_expires_in || refresh_token_secret || refresh_token_expires_in)) {
      throw new InvalidParameterError('Server is not accessing .env variables used on authentication cofig file! Fatal Error. Contact admin!');
    }

    const passwordMatch = await checkHash(password, user.password!); // Password is manageable to get deleteable, but it will be surely returned

    if (!passwordMatch) {
      throw new BusinessLogicError('Incorrect Email or password!');
    }

    const token = sign({}, token_secret , {
      subject: user.id,
      expiresIn: token_expires_in,
    });

    const expiration_date = pgsqlDateAdapter(
      new Date(Date.now() + expiryDateMapper(token_expires_in!))
    );

    const refresh_token = sign({ email }, refresh_token_secret, {
      subject: user.id,
      expiresIn: refresh_token_expires_in 
    });

    // usersTokensRepository
    await this.usersTokensRepository.create({
      user_id: user.id!,
      expiration_date,
      refresh_token
    });
    
    return {
      user: {
        firstName: user.firstname,
        lastName: user.lastname,
        email: user.email,
        username: user.username
      }, 
      token,
      refresh_token,
    };

  }

}

export const authenticateUserService = new AuthenticateUserService(usersTokensRepository, usersRepository);