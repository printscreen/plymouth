import {
  Controller,
  Post,
  Put,
  Body,
  Res,
  HttpStatus,
  HttpException,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';
import { LoginDto } from '@app/app/oauth/dto/login.dto';
import { LoginExternalDto } from '@app/app/oauth/dto/login-external.dto';
import { UpdatePasswordDto } from '@app/app/oauth/dto/update-password.dto';
import { ForgotPasswordSendDto } from '@app/app/oauth/dto/forgot-password-send.dto';
import { ForgotPasswordConfirmDto } from '@app/app/oauth/dto/forgot-password-confirm.dto';
import { OauthService } from '@app/app/oauth/oauth.service';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ProviderUserEntity } from '@app/app/oauth/entities/provider-user.entity';
import { ProviderUser } from '@app/app/oauth/providers/provider.interface';
import { SessionDto } from '@app/app/oauth/dto/session.dto';

@Controller('oauth')
export class OauthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OauthService,
  ) {}

  private static setAuthCookies(
    configService: ConfigService,
    tokens: SessionDto,
    response: FastifyReply,
  ): void {
    response.setCookie(
      configService.get<string>('cookies.accessToken.name'),
      tokens.accessToken,
      configService.get<object>('cookies.options'),
    );
    response.setCookie(
      configService.get<string>('cookies.idToken.name'),
      tokens.idToken,
      configService.get<object>('cookies.options'),
    );
  }

  @Post('login')
  async login(
    @Body() credentials: LoginDto,
    @Res({ passthrough: true }) response: FastifyReply,
    @Req() request: FastifyRequest,
  ): Promise<SessionDto> {
    const tokens: SessionDto = await this.oauthService.login(
      credentials,
      request.ip,
    );
    OauthController.setAuthCookies(this.configService, tokens, response);
    return tokens;
  }

  @Put('login')
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto) {
    await this.oauthService.updatePassword(updatePasswordDto);
    return;
  }

  @Post('login/forgot-password')
  async sendForgotPassword(
    @Body() forgotPasswordSendDto: ForgotPasswordSendDto,
    @Req() request: FastifyRequest,
  ) {
    await this.oauthService.sendForgotPassword(
      forgotPasswordSendDto,
      request.ip,
    );
    return;
  }

  @Put('login/forgot-password')
  async confirmForgotPassword(
    @Body() forgotPasswordConfirmDto: ForgotPasswordConfirmDto,
    @Req() request: FastifyRequest,
  ) {
    await this.oauthService.confirmForgotPassword(
      forgotPasswordConfirmDto,
      request.ip,
    );
    return;
  }

  @Post('login/external')
  async loginExternal(
    @Body() loginExternal: LoginExternalDto,
    @Res({ passthrough: true }) response: FastifyReply,
    @Req() request: FastifyRequest,
    @I18n() i18n: I18nContext,
  ): Promise<SessionDto> {
    const providerUser: ProviderUser =
      await this.oauthService.getUserFromProvider(loginExternal);
    const foundProviderUser: ProviderUserEntity =
      await this.oauthService.findOrCreateProviderUserLinkForExistingUser(
        providerUser,
      );
    if (!foundProviderUser) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: i18n.t('errors.USER_NOT_FOUND'),
        },
        HttpStatus.NOT_FOUND,
        {
          cause: new Error('No user found with that provider'),
        },
      );
    }
    const tokens: SessionDto = await this.oauthService.loginFromProvider(
      loginExternal,
      foundProviderUser,
      request.ip,
    );
    OauthController.setAuthCookies(this.configService, tokens, response);
    return tokens;
  }
}
