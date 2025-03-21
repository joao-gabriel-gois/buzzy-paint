import { DatabaseTransactionError, NotFoundError } from "@shared/errors/ApplicationError.ts";
import { checkHash, hash } from "@utils/hash.ts";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { IUpdateUserDTO } from "@modules/accounts/DTOs/UpdateUserDTO.ts";
import { User } from "@modules/accounts/models/User.ts";
import { IUsersRepository } from "@modules/accounts/repositories/IUsersRepository.ts"


export class UsersRepositoryInMemory implements IUsersRepository {
  private users: User[] = [];

  async create(userDTO: ICreateUserDTO): Promise<ManageableUser> {
    // DON'T HASH THE DTO PASSWORD DIRECTLY, JS RECEIVE OBJS ARGS
    // BY REFERENCE AND THE UNIT TESTS WERE FAILING DUE TO THAT FACT!
    const hashedPassword = await hash(userDTO.password);
    const user = new User(userDTO);
    user.password = hashedPassword;

    const {
      id,
      username,
      email,
      password,
      firstname: firstName,
      lastname: lastName,
    } = user;

    return await new Promise((resolve, reject) => {
      if (!(
        id && username && email 
          && password && firstName && lastName  
      )) {
        reject(
          new DatabaseTransactionError(
            'Database Transaction for creating user has failed'
          ));
      }
      this.users.push(user);
      setTimeout(() => {
        resolve(user as ManageableUser);        
      }, 100);
    });
  };

  async findById(id: UUID): Promise<ManageableUser | undefined>{
    return await new Promise((resolve, reject) => {
      try {
        const user = this.users.find(user => user.id === id) as ManageableUser;
        // delete user?.password;
        setTimeout(() => {
          resolve(user);
        }, 100);
      }
      catch(error) {
        reject(error);
      }
    });
  }

  async findByEmail(email: string): Promise<ManageableUser | undefined>{
    return await new Promise((resolve, reject) => {
      try {
        const user = this.users.find(user => user.email === email) as ManageableUser;
        // delete user?.password;
        setTimeout(() => {
          resolve(user);
        }, 100);
      }
      catch(error) {
        reject(error);
      }
    });
  }

  async findByUsername(username: string): Promise<ManageableUser | undefined>{
    return await new Promise((resolve, reject) => {
      try {
        const user = this.users.find(user => user.username === username) as ManageableUser;
        // delete user?.password;
        setTimeout(() => {
          resolve(user);
        }, 100);

      }
      catch(error) {
        reject(error);
      }
    });
  };

  async update(userDTO: IUpdateUserDTO): Promise<ManageableUser> {
    const currentUser = await this.findById(userDTO.id) as User;
    if (!currentUser) 
      throw new NotFoundError('this.usersRepository.update: User not found');
  
    let hashedPassword: string;
    if (userDTO.email && userDTO.email !== currentUser.email) {
      userDTO.email = currentUser.email;
    }
    if (userDTO.firstName && userDTO.firstName !== currentUser.firstname) {
      userDTO.firstName = currentUser.firstname;
    }
    if (userDTO.lastName && userDTO.lastName !== currentUser.lastname) {
      userDTO.lastName = currentUser.lastname;
    }
    if (userDTO.password && !checkHash(userDTO.password, currentUser.password)) {
      hashedPassword = await hash(userDTO.password);
    }
    return await new Promise((resolve, reject) => {
      const currentUserIndex = this.users.findIndex(user => user.id === currentUser.id);
      if (currentUserIndex === -1)
        reject(new NotFoundError(
          'this.usersRepository.update: Database Transaction for updating user has failed')
        );
      this.users[currentUserIndex] = {
        ...userDTO,
       username: currentUser.username,
       password: hashedPassword ? hashedPassword : currentUser.password
      } as User;
      setTimeout(() => {
        resolve(this.users[currentUserIndex] as ManageableUser);
      }, 100);
    });
    
  };

  async delete(id: UUID): Promise<ManageableUser | undefined> {
    return await new Promise((resolve, reject) => {
      const currentUserIndex = this.users.findIndex(currentUser => id === currentUser.id);
      if (currentUserIndex === -1) reject(new NotFoundError('this.usersRepository.delete: User intended to be deleted was not found'));
      const currentUser = this.users[currentUserIndex];
      
      this.users = [
        ...this.users.slice(0, currentUserIndex),
        ...this.users.slice(currentUserIndex + 1, this.users.length)
      ];
      setTimeout(() => {
        resolve(currentUser as ManageableUser);
      }, 100);
    });
  };

}
