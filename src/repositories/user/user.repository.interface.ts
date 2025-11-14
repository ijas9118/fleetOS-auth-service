import type { RegisterDTO } from "@/dto/register.dto";
import type { IUser } from "@/models/user.model";

export interface IUserRepository {
  /**
   * Retrieves a user by email.
   *
   * @param email - Email address to query.
   * @returns A user object if found, otherwise null.
   */
  getUserByEmail: (email: string) => Promise<IUser | null>;

  /**
   * Retrieves a user by ID.
   *
   * @param id - The user ID to query.
   * @returns A user object if found, otherwise null.
   */
  getUserById: (id: string) => Promise<IUser | null>;

  /**
   * Creates a new user using the provided registration data.
   * Implementations must persist the user to the database.
   *
   * @param data - User registration details.
   * @returns The newly created user object.
   */
  createUser: (data: RegisterDTO) => Promise<IUser>;
};
