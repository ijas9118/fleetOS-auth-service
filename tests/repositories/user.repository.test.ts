import User from "@/models/user.model";
import { UserRepository } from "@/repositories/user/user.repository";

jest.mock("@/models/user.model");

describe("user repository", () => {
  let repo: UserRepository;

  beforeEach(() => {
    repo = new UserRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserByEmail()", () => {
    it("should return a user when found", async () => {
      const mockUser = { email: "test@example.com", password: "hashed" };
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockReturnValue({ select: selectMock });

      const result = await repo.getUserByEmail("test@example.com");

      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(selectMock).toHaveBeenCalledWith("+password");
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found", async () => {
      const selectMock = jest.fn().mockResolvedValue(null);
      (User.findOne as jest.Mock).mockReturnValue({ select: selectMock });

      const result = await repo.getUserByEmail("notfound@example.com");

      expect(result).toBeNull();
    });
  });

  describe("getUserById()", () => {
    it("should call User.findById with id", async () => {
      const mockUser = { _id: "123", email: "x@example.com" };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await repo.getUserById("123");

      expect(User.findById).toHaveBeenCalledWith("123");
      expect(result).toEqual(mockUser);
    });
  });

  describe("createUser()", () => {
    it("should create and save a new user", async () => {
      const saveMock = jest.fn().mockResolvedValue({ _id: "1", email: "test@example.com" });
      (User as unknown as jest.Mock).mockImplementation(() => ({ save: saveMock }));

      const result = await repo.createUser({
        name: "John",
        email: "test@example.com",
        password: "hashed",
      });

      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ _id: "1", email: "test@example.com" });
    });
  });
});
