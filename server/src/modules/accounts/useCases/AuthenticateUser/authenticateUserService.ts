import { checkHash } from "../../../../utils/hash.ts";
import { sign } from 'npm:jsonwebtoken';
// import { IUsersRepository } from "../../repositories/IUsersRepositories.ts";
import { BadRequestError, BusinessLogicError } from "../../../../shared/errors/ApplicationError.ts";
import { usersRepository } from "../../repositories/postgres/usersRepository.ts";
import auth from "../../../../config/auth.ts";
// import IUsersTokensRepository from '@modules/accounts/repositories/IUsersTokensRepository';

interface IRequest {
  email: string;
  password: string;
}

interface IResponse {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  token: string;
  refresh_token: string;
}

class AuthenticateUserUseCase {
  // constructor(
  //   private usersRepository: IUsersRepository,
  //   private usersTokensRepository: IUsersTokensRepository,
  // ) {};

  async execute({ email, password }: IRequest): Promise<IResponse> {
    const user = await usersRepository.getUserByEmail(email);
    const {
      token_secret,
      token_expires_in,
      refresh_token_secret,
      refresh_token_expires_in
    } = auth;

    if (!user || !user!.id) {
      throw new BadRequestError('Incorrect Email or password!');
    }

    const passwordMatch = await checkHash(password, user.password!); // Password is manageable to get deleteable, but it will be surely returned

    if (!passwordMatch) {
      throw new BusinessLogicError('Incorrect Email or password!');
    }

    // only for example, generated with md5, with this input: pudãoignitenode_ultrasecure_hash
    // it should be used with better input and saved in an .env variable
    const token = sign({}, token_secret , {
      subject: user.id,
      expiresIn: token_expires_in,
    });

    // const expiration_date = (add number of expiring date as days to be considered the expiration date)

    const refresh_token = sign({ email }, refresh_token_secret, {
      subject: user.id,
      expiresIn: refresh_token_expires_in 
    }); 

    // usersTokensRepository
    // await usersTokensRepository.create({
    //   user_id: user.id!,
    //   expiration_date,
    //   refresh_token
    // });
    
    return {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }, 
      token,
      refresh_token
    };

  }

}

export const authenticateUserUseCase = new AuthenticateUserUseCase();