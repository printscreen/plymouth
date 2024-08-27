export enum UserRoles {
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
  'cognito:groups': UserRoles[];
  exp: number;
  iss: string;
};
