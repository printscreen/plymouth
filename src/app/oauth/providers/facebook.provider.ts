import { HttpException, HttpStatus } from '@nestjs/common';
import {
  Provider,
  ProviderId,
  ProviderInterface,
  ProviderUser,
} from './provider.interface';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { capitalize, get } from 'lodash';
import { I18nService } from 'nestjs-i18n';

type FacebookTokenResponse = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  picture: {
    data: {
      height: number;
      width: number;
      is_silhouette: boolean;
      url: string;
    };
  };
};

export class Facebook implements ProviderInterface {
  constructor(
    private configService: ConfigService,
    private readonly i18n: I18nService,
    private httpService: HttpService,
    @InjectPinoLogger()
    private readonly logger: PinoLogger,
  ) {}

  async getUser(accessToken: string): Promise<ProviderUser> {
    // Verify the token is a token associated with our app. Will throw a 400 if the user token doesn't match
    // the app token application id. We want it to throw the error and stop moving forward if it's not our token
    await firstValueFrom(
      this.httpService
        .get('https://graph.facebook.com/v15.0/debug_token', {
          params: {
            input_token: accessToken,
            access_token: this.configService.get<string>(
              'oauth.facebook.appToken',
            ),
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response.data);
            throw new HttpException(
              {
                status: HttpStatus.BAD_REQUEST,
                error: this.i18n.translate('errors.INVALID_TOKEN'),
              },
              HttpStatus.BAD_REQUEST,
              {
                cause: new Error(`Invalid token for app`),
              },
            );
          }),
        ),
    );

    /* Response object looks like
     * @see https://developers.facebook.com/docs/graph-api/reference/user
     * @see https://developers.facebook.com/tools/explorer/?method=GET&path=me%3Ffields%3Did%2Cfirst_name%2C%20last_name%2Cemail%2Cpicture&version=v17.0
     * More fields can be requested for more data on the user
     */

    const { data }: { data: FacebookTokenResponse } = await firstValueFrom(
      this.httpService
        .get<FacebookTokenResponse>('https://graph.facebook.com/v17.0/me', {
          params: {
            access_token: accessToken,
            fields: ['id', 'first_name', 'last_name', 'email'].join(','),
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

    const user: ProviderUser = {
      provider: Provider.FACEBOOK,
      providerId: ProviderId.FACEBOOK,
      externalId: get(data, 'id'),
      email: get(data, 'email') ? data.email.trim().toLowerCase() : null,
      givenName: get(data, 'first_name') ? capitalize(data.first_name) : null,
      familyName: get(data, 'last_name') ? capitalize(data.last_name) : null,
    };

    if (!user.externalId) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: this.i18n.translate('errors.USER_NOT_FOUND'),
        },
        HttpStatus.NOT_FOUND,
        {
          cause: new Error('No user id found for facebook user'),
        },
      );
    }

    if (!user.email) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: this.i18n.translate('errors.USER_NOT_FOUND'),
        },
        HttpStatus.NOT_FOUND,
        {
          cause: new Error('No email found for facebook user'),
        },
      );
    }

    return user;
  }
}
