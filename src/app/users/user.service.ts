import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository, EntityManager } from 'typeorm';
import { plainToClass } from 'class-transformer';
import {
  AttributeType,
  CognitoIdentityProviderClient,
  SignUpCommand,
  SignUpCommandInput,
  AdminConfirmSignUpCommand,
  AdminConfirmSignUpCommandInput,
  AdminDeleteUserCommandInput,
  AdminDeleteUserCommand,
  AdminAddUserToGroupCommand,
  AdminAddUserToGroupCommandInput,
  SignUpCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import { InjectAws } from 'aws-sdk-v3-nest';
import { InjectRepository } from '@nestjs/typeorm';
import { camelCase, get, mapKeys } from 'lodash';
import { UserDto } from '@app/app/users/dto/user.dto';
import { CreateUserDto } from '@app/app/users/dto/create-user.dto';
import { UserEntity } from '@app/app/users/entities/user.entity';
import { EmailEntity } from '@app/app/users/entities/email.entity';
import { UserPaginatorDto } from '@app/app/users/dto/user-paginator.dto';
import { USER_ROLES } from '@app/auth/roles';

const AWS_COGNITO_USER_ATTRIBUTE_KEYS = [
  'email',
  'phone_number',
  'given_name',
  'family_name',
  'birthdate',
  'picture',
  'locale',
];

@Injectable()
export class UserService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserEntity)
    private userEntityRepository: Repository<UserEntity>,
    @InjectRepository(EmailEntity)
    private emailEntityRepository: Repository<EmailEntity>,
    @InjectAws(CognitoIdentityProviderClient)
    private readonly cognito: CognitoIdentityProviderClient,
    private readonly entityManager: EntityManager,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    let cognitoUserCreated = false;
    try {
      return await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          const time = new Date().toISOString();
          const userAttributes: AttributeType[] = [
            {
              Name: 'created_at',
              Value: time,
            },
            {
              Name: 'updated_at',
              Value: time,
            },
            {
              Name: 'preferred_username',
              Value: createUserDto.userName,
            },
          ];
          AWS_COGNITO_USER_ATTRIBUTE_KEYS.map((key: string) => {
            const value = get(createUserDto, camelCase(key));
            if (value !== null) {
              userAttributes.push({
                Name: key,
                Value: value,
              });
            }
          });

          const signupParams: SignUpCommandInput = {
            ClientId: this.configService.get<string>('aws.clientId'),
            Username: createUserDto.userName,
            Password: createUserDto.password,
            UserAttributes: userAttributes,
          };
          const result: SignUpCommandOutput = await this.cognito.send(
            new SignUpCommand(signupParams),
          );
          cognitoUserCreated = true;
          // We verify emails before a user can sign up
          const confirmSignup: AdminConfirmSignUpCommandInput = {
            UserPoolId: this.configService.get<string>('aws.userPoolId'),
            Username: createUserDto.userName,
          };
          await this.cognito.send(new AdminConfirmSignUpCommand(confirmSignup));

          const addUserToGroupParams: AdminAddUserToGroupCommandInput = {
            GroupName: USER_ROLES.CONSUMER_BASIC,
            Username: createUserDto.userName,
            UserPoolId: this.configService.get<string>('aws.userPoolId'),
          };
          await this.cognito.send(
            new AdminAddUserToGroupCommand(addUserToGroupParams),
          );

          const user: UserEntity = this.userEntityRepository.create({
            userId: result.UserSub,
            ...createUserDto,
          });
          await transactionalEntityManager.save(user);
          const email: EmailEntity = this.emailEntityRepository.create({
            email: createUserDto.email,
            userId: user.userId,
            verified: true,
          });
          await transactionalEntityManager.save(email);
          return plainToClass(
            UserDto,
            mapKeys(user, (v, k) => camelCase(k)),
          );
        },
      );
    } catch (error) {
      if (cognitoUserCreated) {
        const deleteUserParams: AdminDeleteUserCommandInput = {
          UserPoolId: this.configService.get<string>('aws.userPoolId'),
          Username: createUserDto.userName,
        };
        await this.cognito.send(new AdminDeleteUserCommand(deleteUserParams));
      }
      throw error;
    }
  }

  async findAll(userPagination: UserPaginatorDto) {
    const [users, totalCount] = await this.userEntityRepository.findAndCount({
      order: {
        [userPagination.sort]: userPagination.sortDirection,
      },
      skip: userPagination.offset,
      take: userPagination.limit,
    });
    return {
      users: users.map((user) =>
        plainToClass(
          UserDto,
          mapKeys(user, (v, k) => camelCase(k)),
        ),
      ),
      totalCount,
    };
  }

  findOne(userId: string): Promise<UserEntity> {
    return this.userEntityRepository.findOne({
      where: {
        userId,
      },
    });
  }

  findByEmail(email: string): Promise<UserEntity> {
    return this.userEntityRepository.findOne({
      where: {
        email,
      },
    });
  }

  findByUserName(userName: string): Promise<UserEntity> {
    return this.userEntityRepository
      .createQueryBuilder('user')
      .where('LOWER(user_name) = :value', {
        value: `%${userName.toLowerCase()}%`,
      })
      .getOne();
  }
}
