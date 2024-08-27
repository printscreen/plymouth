import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectAws } from 'aws-sdk-v3-nest';
import {
  AuthFlowType,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
  InitiateAuthCommandOutput,
  CognitoIdentityProviderServiceException,
  ChangePasswordCommand,
  ChangePasswordCommandInput,
  ChangePasswordCommandOutput,
  ForgotPasswordCommand,
  ForgotPasswordCommandInput,
  ForgotPasswordCommandOutput,
  ConfirmForgotPasswordCommand,
  ConfirmForgotPasswordCommandInput,
  ConfirmForgotPasswordCommandOutput,
  InvalidPasswordException,
  NotAuthorizedException,
} from '@aws-sdk/client-cognito-identity-provider';
import { Apple } from '@app/app/oauth/providers/apple.provider';
import { Facebook } from '@app/app/oauth/providers/facebook.provider';
import { Google } from '@app/app/oauth/providers/google.provider';
import { LoginDto } from '@app/app/oauth/dto/login.dto';
import { LoginExternalDto } from '@app/app/oauth/dto/login-external.dto';
import { SessionDto } from '@app/app/oauth/dto/session.dto';
import { ProviderUserDto } from '@app/app/oauth/dto/provider-user.dto';
import { ForgotPasswordSendDto } from '@app/app/oauth/dto/forgot-password-send.dto';
import { ForgotPasswordConfirmDto } from '@app/app/oauth/dto/forgot-password-confirm.dto';
import { CreateProviderUserDto } from '@app/app/oauth/dto/create-provider-user.dto';
import { UpdatePasswordDto } from '@app/app/oauth/dto/update-password.dto';
import {
  ProviderInterface,
  ProviderUser,
  Provider,
} from '@app/app/oauth/providers/provider.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderUserEntity } from '@app/app/oauth/entities/provider-user.entity';
import { EmailEntity } from '@app/app/users/entities/email.entity';
import { UserEntity } from '@app/app/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { camelCase, mapKeys } from 'lodash';

@Injectable()
export class OauthService {
  constructor(
    private configService: ConfigService,
    private readonly i18n: I18nService,
    @InjectRepository(ProviderUserEntity)
    private providerUserEntityRepository: Repository<ProviderUserEntity>,
    @InjectRepository(EmailEntity)
    private emailEntityRepository: Repository<EmailEntity>,
    @InjectRepository(UserEntity)
    private userEntityRepository: Repository<UserEntity>,
    @InjectAws(CognitoIdentityProviderClient)
    private readonly cognito: CognitoIdentityProviderClient,
    private readonly apple: Apple,
    private readonly google: Google,
    private readonly facebook: Facebook,
  ) {}

  async login(credentials: LoginDto, ipAddress: string): Promise<SessionDto> {
    const params: InitiateAuthCommandInput = {
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: this.configService.get<string>('clients.consumer.clientId'),
      AuthParameters: {
        USERNAME: credentials.email,
        PASSWORD: credentials.password,
      },
      UserContextData: {
        IpAddress: ipAddress,
      },
    };

    return this.validateCredentials(params);
  }

  async loginFromProvider(
    loginExternal: LoginExternalDto,
    providerUser: ProviderUserEntity,
    ipAddress: string,
  ): Promise<SessionDto> {
    const user: UserEntity = await this.userEntityRepository.findOne({
      where: {
        userId: providerUser.user.userId,
      },
    });
    const params: InitiateAuthCommandInput = {
      AuthFlow: 'CUSTOM_AUTH',
      ClientId: this.configService.get<string>('aws.clientId'),
      AuthParameters: {
        USERNAME: user.email,
        CHALLENGE_RESPONSE: loginExternal.accessToken,
        CHALLENGE_NAME: 'TOKEN_CHALLENGE',
      },
      ClientMetadata: {
        provider: Provider[loginExternal.provider],
      },
      UserContextData: {
        IpAddress: ipAddress,
      },
    };
    return this.validateCredentials(params);
  }

  private async validateCredentials(
    params: InitiateAuthCommandInput,
  ): Promise<SessionDto> {
    const authCommand: InitiateAuthCommand = new InitiateAuthCommand(params);
    try {
      const result: InitiateAuthCommandOutput =
        await this.cognito.send(authCommand);
      return {
        idToken: result.AuthenticationResult.IdToken,
        accessToken: result.AuthenticationResult.AccessToken,
        refreshToken: result.AuthenticationResult.RefreshToken,
      } as SessionDto;
    } catch (error) {
      if (error instanceof CognitoIdentityProviderServiceException) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: this.i18n.translate('errors.INVALID_CREDENTIALS'),
          },
          HttpStatus.BAD_REQUEST,
          {
            cause: new Error(`Invalid credentials`),
          },
        );
      }
      throw error;
    }
  }

  async getUserFromProvider(
    loginExternal: LoginExternalDto,
  ): Promise<ProviderUser> {
    const providerUser: ProviderUser | Promise<ProviderUser> =
      await this.getProvider(Provider[loginExternal.provider]).getUser(
        loginExternal.accessToken,
      );
    return providerUser;
  }

  async createProviderUser(
    createProviderUserDto: CreateProviderUserDto,
  ): Promise<ProviderUserDto> {
    const providerUser = this.providerUserEntityRepository.create(
      createProviderUserDto,
    );
    await this.providerUserEntityRepository.save(providerUser);
    return plainToClass(
      ProviderUserDto,
      mapKeys(providerUser, (v, k) => camelCase(k)),
    );
  }

  async findOrCreateProviderUserLinkForExistingUser(
    providerUser: ProviderUser,
  ): Promise<ProviderUserEntity> {
    const foundProviderUser: ProviderUserEntity =
      await this.providerUserEntityRepository.findOne({
        where: {
          provider: { providerId: providerUser.providerId },
          externalId: providerUser.externalId,
        },
      });

    // Check and see if the user's email has changed from the provider since last login
    // If it has, add it to the list of emails associated with the user
    if (foundProviderUser?.user.userId) {
      const foundEmail: EmailEntity = await this.emailEntityRepository.findOne({
        where: {
          email: providerUser.email,
        },
      });

      if (
        foundEmail?.email &&
        foundEmail.userId !== foundProviderUser.user.userId
      ) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: this.i18n.translate(
              'errors.EMAIL_ASSOCIATED_TO_ANOTHER_ACCOUNT',
            ),
          },
          HttpStatus.BAD_REQUEST,
          {
            cause: new Error(
              `${foundEmail.email} belongs to user ${foundEmail.userId}, not user ${foundProviderUser.user.userId} provider id ${providerUser.externalId}, this shouldn't be possible`,
            ),
          },
        );
      }

      // We found the user in the system, but they have a new email. Let's associate this new email to their account
      if (!foundEmail?.email) {
        const email: EmailEntity = this.emailEntityRepository.create({
          email: providerUser.email,
          userId: foundProviderUser.user.userId,
          verified: true,
        });
        await this.emailEntityRepository.save(email);
      }

      return foundProviderUser;
    }

    const user: EmailEntity = await this.emailEntityRepository.findOne({
      where: {
        email: providerUser.email,
      },
    });
    if (user?.userId) {
      // Ok, so no user linked to this provider id, but did we see the email in
      // our system? Well lets link that provider id to this user account
      const createProviderUser: ProviderUserEntity =
        this.providerUserEntityRepository.create({
          user: { userId: user.userId },
          externalId: providerUser.externalId,
          provider: { providerId: providerUser.providerId },
        });
      await this.providerUserEntityRepository.save(createProviderUser);

      return createProviderUser;
    }
    return null;
  }

  getProvider(provider: Provider): ProviderInterface {
    switch (provider.trim().toLocaleLowerCase()) {
      case 'apple':
        return this.apple;
      case 'google':
        return this.google;
      case 'facebook':
        return this.facebook;
      default:
        throw new Error(`Invalid provider: ${provider}`);
    }
  }

  updatePassword(
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<ChangePasswordCommandOutput> {
    const input: ChangePasswordCommandInput = {
      PreviousPassword: updatePasswordDto.currentPassword,
      ProposedPassword: updatePasswordDto.newPassword,
      AccessToken: updatePasswordDto.accessToken,
    };
    try {
      const command: ChangePasswordCommand = new ChangePasswordCommand(input);
      return this.cognito.send(command);
    } catch (error) {
      if (
        error instanceof InvalidPasswordException ||
        error instanceof NotAuthorizedException
      ) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: this.i18n.translate('errors.INVALID_CREDENTIALS'),
          },
          HttpStatus.BAD_REQUEST,
          {
            cause: new Error(`Invalid credentials`),
          },
        );
      }
      throw error;
    }
  }

  sendForgotPassword(
    forgotPasswordDto: ForgotPasswordSendDto,
    ipAddress: string,
  ): Promise<ForgotPasswordCommandOutput> {
    const input: ForgotPasswordCommandInput = {
      ClientId: this.configService.get<string>('aws.clientId'),
      UserContextData: {
        IpAddress: ipAddress,
      },
      Username: forgotPasswordDto.email,
    };
    const command = new ForgotPasswordCommand(input);
    return this.cognito.send(command);
  }

  confirmForgotPassword(
    forgotPasswordConfirmDto: ForgotPasswordConfirmDto,
    ipAddress: string,
  ): Promise<ConfirmForgotPasswordCommandOutput> {
    const input: ConfirmForgotPasswordCommandInput = {
      ClientId: this.configService.get<string>('aws.clientId'),
      UserContextData: {
        IpAddress: ipAddress,
      },
      ConfirmationCode: forgotPasswordConfirmDto.confirmationCode,
      Password: forgotPasswordConfirmDto.password,
      Username: forgotPasswordConfirmDto.email,
    };
    const command = new ConfirmForgotPasswordCommand(input);
    return this.cognito.send(command);
  }
}
