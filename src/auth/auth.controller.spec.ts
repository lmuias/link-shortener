import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";
import { getModelToken } from "@nestjs/mongoose";
import { User } from "./schema/user.schema";

class MockUserModel {
  static findOne = jest.fn();
  save = jest.fn().mockResolvedValue({ _id: 'mocked-id', email: 'test@test.com' });
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtService,
        {
          provide: getModelToken(User.name),
          useValue: MockUserModel,
        },
        {
          provide: JwtService,
          useValue: {
            sign: () => 'mock-token',
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('POST /auth/register returns token', async () => {
    jest.spyOn(authService, 'register').mockResolvedValue({ accessToken: 'mock-token' });
    
    const result = await controller.register({ 
      email: 'test@test.com', 
      password: 'pass' 
    });
    
    expect(result).toEqual({ accessToken: 'mock-token' });
  });
});