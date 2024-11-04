import { DatabaseTransactionError, NotFoundError } from "../../../../shared/errors/ApplicationError.ts";
import { checkHash, hash } from "../../../../utils/hash.ts";
import { ManageableUser, UUID } from "../../@types/index.d.ts";
import { ICreateUserDTO } from "../../DTOs/CreateUserDTO.ts";
import { User } from "../../models/User.ts";
import { IUsersRepository } from "../IUsersRepositories.ts";

let users: User[] = [];

// Since in-memory impl is actualy sync and we need to simulate async
//   in order to correctly implement IUsersRepository naturally there
//   is a difference in the possible returning errors
// So future unit tests will not be 100% loyal to the real async
//   scenario in case it mocks from the class bellow

class UsersRepositoryInMemory implements IUsersRepository {
  async createUser(userDTO: ICreateUserDTO): Promise<ManageableUser> {
    userDTO.password = await hash(userDTO.password); 
    return await new Promise((resolve, reject) => {
      const user = new User(userDTO);
      if (!(
        user.email && user.firstName
          && user.lastName && user.password
      )) reject(
        new DatabaseTransactionError(
          'Query for creating user has failed!'
        ));
      
      users.push(user);
      resolve(user as ManageableUser);
    });
  };

  async getUserById(id: UUID): Promise<ManageableUser | undefined>{
    return await new Promise((resolve, reject) => {
      try {
        const user = users.find(user => user.id === id) as ManageableUser;
        // delete user?.password;
        resolve(user);
      }
      catch(error) {
        reject(error);
      }
    });
  }

  async getUserByEmail(email: string): Promise<ManageableUser | undefined>{
    return await new Promise((resolve, reject) => {
      try {
        const user = users.find(user => user.email === email) as ManageableUser;
        // delete user?.password;
        resolve(user);
      }
      catch(error) {
        reject(error);
      }
    });
  }

  async getUserByUsername(username: string): Promise<ManageableUser | undefined>{
    return await new Promise((resolve, reject) => {
      try {
        const user = users.find(user => user.username === username) as ManageableUser;
        // delete user?.password;
        resolve(user);
      }
      catch(error) {
        reject(error);
      }
    });
  };

  async updateUser(id: UUID, user: Omit<ICreateUserDTO, "username">): Promise<ManageableUser> {
    const currentUser = await this.getUserById(id) as User;
    if (!currentUser) throw new NotFoundError('User not found');

    if (user.email && user.email !== currentUser.email) {
      user.email = currentUser.email;
    }
    if (user.firstName && user.firstName !== currentUser.firstName) {
      user.firstName = currentUser.firstName;
    }
    if (user.lastName && user.lastName !== currentUser.lastName) {
      user.lastName = currentUser.lastName;
    }
    if (user.password && !checkHash(currentUser.password, user.password)) {
      user.password = await hash(user.password);
    }

    return await new Promise((resolve, reject) => {
      const currentUserIndex = users.findIndex(user => user.id === currentUser.id);
      if (currentUserIndex === -1) reject(new NotFoundError('User not found'));
      users[currentUserIndex] = {...user, username: currentUser.username } as User;
      resolve(users[currentUserIndex] as ManageableUser);
    });
    
  };

  async deleteUser(id: UUID): Promise<ManageableUser> {
    return await new Promise((resolve, reject) => {
      const currentUserIndex = users.findIndex(currentUser => id === currentUser.id);
      if (currentUserIndex === -1) reject(new NotFoundError('User not found'));
      const currentUser = users[currentUserIndex];
      
      users = [
        ...users.slice(0, currentUserIndex),
        ...users.slice(currentUserIndex + 1, users.length)
      ];

      resolve(currentUser as ManageableUser);
    });
  };

}

export const usersRepository = new UsersRepositoryInMemory();