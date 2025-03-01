import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { User } from './schema/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';

describe('AuthService', () => {
  let authService: AuthService;
  let userModel: Model<User>

  class MockUserModel {
    static findOne = jest.fn();
    
    constructor(public data: Partial<User>) {}
    
    save() {
      return Promise.resolve({ ...this.data, _id: 'mocked-id' });
    }
  }


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: MockUserModel,
        },
        {
          provide: JwtService,
          useValue: {
            sign: () => 'mockToken',
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));

    jest.spyOn(MockUserModel.prototype, 'save').mockImplementation(
      function (this: MockUserModel) {
        return Promise.resolve({ ...this.data, _id: 'mocked-id' });
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      
      MockUserModel.findOne.mockResolvedValue(null);
      const saveSpy = jest.spyOn(MockUserModel.prototype, 'save');
      const result = await authService.register(dto);

      expect(saveSpy).toHaveBeenCalled();
      expect(result.accessToken).toBe('mockToken');
      expect(MockUserModel.findOne).toHaveBeenCalledWith({ email: dto.email });
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const user = new MockUserModel({
        email: dto.email,
        password: await bcrypt.hash(dto.password, 10),
      });

      MockUserModel.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await authService.login(dto);

      expect(result).toHaveProperty('accessToken', 'mockToken');
      expect(MockUserModel.findOne).toHaveBeenCalledWith({ email: dto.email });
    });

    it('should throw UnauthorizedException if email is wrong', async () => {
      const dto = { email: 'wrong@example.com', password: 'password123' };
      MockUserModel.findOne.mockResolvedValue(null);

      await expect(authService.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const dto = { email: 'test@example.com', password: 'wrongPassword' };
      const user = new MockUserModel({
        email: dto.email,
        password: await bcrypt.hash('password123', 10),
      });

      MockUserModel.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(authService.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});