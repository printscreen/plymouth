import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { CognitoAccessTokenPayload } from '../types';
import { AuthorizationConfigOptions } from '../authorization.config';

@Injectable()
export class ServiceStrategy extends PassportStrategy(Strategy, 'service-jwt') {
  constructor(@Inject('CLIENTS') config: AuthorizationConfigOptions) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      _audience: config.service.clientId,
      issuer: config.service.publicAuthority,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${config.service.publicAuthority}/.well-known/jwks.json`,
      }),
    });
  }

  async validate(payload: CognitoAccessTokenPayload) {
    return {
      userId: payload.sub,
      username: payload.username,
      roles: payload['cognito:groups'],
    };
  }
}
