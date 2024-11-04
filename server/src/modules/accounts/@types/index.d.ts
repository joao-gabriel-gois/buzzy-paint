import { v4 } from 'npm:@types/uuid';
import { User } from "../models/User.ts";

export type UUID = typeof v4;

type ExposableUser = Omit<User,'password'>;
type ManageableUser = ExposableUser & { password?: string };

type SearchTerm =
  | { id: UUID }
  | { email: string }
  | { username: string };
