import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  ProviderInterface,
  ProviderUser,
  Provider,
  ProviderId,
} from './provider.interface';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { get, capitalize, isArray } from 'lodash';
import { I18nService } from 'nestjs-i18n';

type GoogleTokenResponse = {
  iss: string;
  sub: string;
  azp: string;
  aud: string;
  iat: string;
  exp: string;
  email: string;
  email_verified: 'true' | 'false';
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale: string;
};

@Injectable()
export class Google implements ProviderInterface {
  constructor(
    private configService: ConfigService,
    private readonly i18n: I18nService,
    private httpService: HttpService,
    @InjectPinoLogger()
    private readonly logger: PinoLogger,
  ) {}

  async getUser(accessToken: string): Promise<ProviderUser> {
    const { data }: { data: GoogleTokenResponse } = await firstValueFrom(
      this.httpService
        .get<GoogleTokenResponse>('https://oauth2.googleapis.com/tokeninfo', {
          params: {
            id_token: accessToken,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response.data);
            throw new HttpException(
              {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: this.i18n.translate('errors.INTERNAL_SERVER_ERROR'),
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
              {
                cause: error,
              },
            );
          }),
        ),
    );

    const emailVerified = get(data, 'email_verified', false);
    const audience = get(data, 'aud');

    if (audience !== this.configService.get<string>('oauth.google.id')) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: this.i18n.translate('errors.INVALID_TOKEN'),
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: new Error(`Invalid audience:${audience}`),
        },
      );
    }

    const user = {
      provider: Provider.GOOGLE,
      providerId: ProviderId.GOOGLE,
      externalId: get(data, 'sub'),
      email: this.getAccountEmail(data.email),
      picture: this.getAvatarUrl(get(data, 'picture')),
      givenName: get(data, 'given_name') ? capitalize(data.given_name) : null,
      familyName: get(data, 'family_name')
        ? capitalize(data.family_name)
        : null,
    };

    if (!user.externalId) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: this.i18n.translate('errors.USER_NOT_FOUND'),
        },
        HttpStatus.NOT_FOUND,
        {
          cause: new Error('No user id found for google user'),
        },
      );
    }

    if (!user.email || String(emailVerified) !== 'true') {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: this.i18n.translate('errors.USER_NOT_FOUND'),
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: new Error('No verified email found for google user'),
        },
      );
    }
    return user;
  }

  getAvatarUrl(uri: string): string {
    if (!uri) {
      return null;
    }
    // You can get the image size dynamically. Google sets it to 50
    // by default. Thats way to small to work with, so we are going
    // to rewrite the URL to tell it we want a larger size
    const parts = new URL(uri);
    parts.search = 'sz=300';
    return parts.toString();
  }

  getAccountEmail(emails: [any] | string): string {
    let email = null;
    if (!isArray(emails) && typeof emails === 'string') {
      return emails;
    }

    for (const e of emails) {
      if (emails[e].type.toLowerCase() === 'account') {
        email = emails[e].value;
        break;
      }
    }
    return email ? email.trim().toLowerCase() : null;
  }
}
