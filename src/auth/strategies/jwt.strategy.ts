// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { CognitoAccessTokenPayload } from '../types';
import { AuthorizationConfigOptions } from '../authorization.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject('CLIENTS') config: AuthorizationConfigOptions) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        JwtStrategy.extractJWTFromCookie.bind(
          JwtStrategy,
          config.consumer.cookieName,
        ),
      ]),
      ignoreExpiration: false,
      _audience: config.consumer.clientId,
      issuer: config.consumer.publicAuthority,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${config.consumer.publicAuthority}/.well-known/jwks.json`,
      }),
    });
  }

  private static extractJWTFromCookie(
    cookieName: string,
    request: any,
  ): string | null {
    if (request.cookies && request.cookies[cookieName]) {
      return request.cookies[cookieName];
    }
    return null;
  }

  async validate(payload: CognitoAccessTokenPayload) {
    return {
      userId: payload.sub,
      username: payload.username,
      roles: payload['cognito:groups'],
    };
  }
}
