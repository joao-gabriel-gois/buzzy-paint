import { User } from "../models/User.ts";

import { Request } from 'npm:@types/express';

type UUIDBrand = { readonly UUID: unique symbol };

export type UUID = `${string}-${string}-${string}-${string}-${string}` & UUIDBrand;

type ExposableUser = Omit<User,'password'>;
type ManageableUser = ExposableUser & { password?: string };

interface IRequest extends Request {
  user?: { id : string }
}
