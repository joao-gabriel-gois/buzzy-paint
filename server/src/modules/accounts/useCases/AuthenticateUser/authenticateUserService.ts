import { checkHash } from "@utils/hash.ts";
import { sign } from "npm:jsonwebtoken";
import auth from "@config/auth.ts";
import { IAuthRequest, IAuthResponse } from "@modules/accounts/useCases/interfaces.ts";
import { usersTokensRepository as prodUsersTokensRepository } from "@modules/accounts/repositories/postgres/usersTokensRepository.ts";
import { usersTokensRepository as testUsersTokensRepository  } from "@modules/accounts/repositories/in-memory/usersTokensRepository.ts";
import { usersRepository as prodUsersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";
import { usersRepository as testUsersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { InvalidParameterError, BadRequestError, BusinessLogicError } from "@shared/errors/ApplicationError.ts";
import { expiryDateMapper, pgsqlDateAdapter } from "@utils/expiryDateMapper.ts";

const ENV = Deno.env.get('ENV');
const usersTokensRepository = ENV === 'test' ? testUsersTokensRepository : prodUsersTokensRepository;
const usersRepository = ENV === 'test' ? testUsersRepository : prodUsersRepository;


export async function authenticateUserService({ email, password }: IAuthRequest): Promise<IAuthResponse> {
  const user = await usersRepository.findByEmail(email);
  if (!user || !user!.id) {
    throw new BadRequestError("Incorrect Email or password!");
  }

  const  {
    token_secret,
    token_expires_in,
    refresh_token_secret,
    refresh_token_expires_in
  } = auth;

  if (!(token_secret || token_expires_in || refresh_token_secret || refresh_token_expires_in)) {
    throw new InvalidParameterError("Server is not accessing .env variables used on authentication cofig file! Fatal Error. Contact admin!");
  }

  const passwordMatch = await checkHash(password, user.password!); // Password is manageable to get deleteable, but it will be surely returned
  if (!passwordMatch) {
    throw new BusinessLogicError("Incorrect Email or password!");
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

  await usersTokensRepository.create({
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
