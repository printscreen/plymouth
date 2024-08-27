import {
  Provider,
  ProviderId,
  ProviderInterface,
  ProviderUser,
} from './provider.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { JwksClient } from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { get } from 'lodash';
import { promisify } from 'util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Apple implements ProviderInterface {
  client;
  verify;

  constructor(
    private configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    this.verify = promisify(jwt.verify);
    this.client = new JwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      timeout: 30000,
    });
  }

  async getUser(accessToken: string): Promise<ProviderUser> {
    let response;
    try {
      const { header } = jwt.decode(accessToken, {
        complete: true,
      });

      const kid = get(header, 'kid');
      const publicKey = (await this.client.getSigningKey(kid)).getPublicKey();

      response = await this.verify(accessToken, publicKey);
    } catch (error) {
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
    }
    const emailVerified = get(response, 'email_verified', false);
    const audience = get(response, 'aud');

    if (audience !== this.configService.get<string>('oauth.apple.audience')) {
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

    const user: ProviderUser = {
      provider: Provider.APPLE,
      providerId: ProviderId.APPLE,
      externalId: get(response, 'sub'),
      email: get(response, 'email'),
      givenName: null,
      familyName: null,
    };

    if (!user.externalId) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: this.i18n.translate('errors.USER_NOT_FOUND'),
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: new Error('No user id found for apple user'),
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
          cause: new Error('No verified email found for apple user'),
        },
      );
    }
    return user;
  }
}
