export enum Provider {
  FACEBOOK = 'FACEBOOK',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

export enum ProviderId {
  FACEBOOK = 1,
  GOOGLE = 2,
  APPLE = 3,
}

export type ProviderTypeId =
  | ProviderId.FACEBOOK
  | ProviderId.GOOGLE
  | ProviderId.APPLE;

export type ProviderUser = {
  provider: Provider;
  providerId: ProviderTypeId;
  externalId: string;
  email: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
};

export interface ProviderInterface {
  getUser: (accessToken: string) => ProviderUser | Promise<ProviderUser>;
}
