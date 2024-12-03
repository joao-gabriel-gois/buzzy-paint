import { User } from "@modules/accounts/models/User.ts";
import { Request } from 'npm:@types/express';

declare global {

  type UUIDBrand = { readonly UUID: unique symbol };

  type UUID = `${string}-${string}-${string}-${string}-${string}` & UUIDBrand;

  type ExposableUser = Omit<User,'password'>;
  type ManageableUser = ExposableUser & { password?: string };

  interface AuthRequest extends Request {
    user?: { id : UUID }
  }
}
