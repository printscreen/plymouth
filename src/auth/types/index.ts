import { FastifyRequest } from 'fastify';
export enum Role {
  CONSUMER_BASIC = 'CONSUMER_BASIC',
  PLYMOUTH_ADMIN = 'PLYMOUTH_ADMIN',
}

export type CognitoAccessTokenPayload = {
  auth_time: number;
  client_id: string;
  event_id: string;
  iat: number;
  jti: string;
  scope: string;
  sub: string;
  token_use: 'access';
  username: string;
  'cognito:groups': Role[];
  exp: number;
  iss: string;
};

export const FIVE_MINUTES_IN_SECONDS: number = 5 * 60;
export interface RequestWithUser extends FastifyRequest {
  user: {
    userId: string;
    username: string;
    roles: Role[];
  };
}
