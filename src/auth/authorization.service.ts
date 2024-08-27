import { firstValueFrom } from 'rxjs';
import { decode, JwtPayload } from 'jsonwebtoken';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ClientsConfig } from './authorization.config';
import { Cache } from 'cache-manager';
import { Mutex } from 'async-mutex';
import { FIVE_MINUTES_IN_SECONDS } from './types';

@Injectable()
export class AuthorizationService {
  private mutex: Mutex = new Mutex();
  private readonly logger: Logger = new Logger(AuthorizationService.name);
  constructor(
    private httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject('CLIENTS') private clients: ClientsConfig[],
  ) {}
  async getServiceToken(client: string, scopes: string[]): Promise<string> {
    const found: string = await this.cacheManager.get<string>(client);
    if (found) {
      if (this.isTokenExpiring(found)) {
        // JWT is about to expire, refresh it but don't wait
        this.refreshJwt(client, scopes).catch((error) => {
          this.logger.error(error);
          throw error;
        });
      }
      return found;
    }
    return this.refreshJwt(client, scopes);
  }

  async refreshJwt(client: string, scopes: string[]): Promise<string> {
    // Ensure only one refresh operation happens at a time
    return this.mutex.runExclusive(async () => {
      // Has a previous call already refreshed the token
      const found: string = await this.cacheManager.get<string>(client);
      if (found && !this.isTokenExpiring(found)) {
        return found;
      }
      // Fetch a new JWT.
      const newToken = await this.fetchNewJwt(client, scopes);
      const expires = this.getTokenExpiration(newToken);
      const ttl: number = expires - Math.floor(Date.now() / 1000) - 1;
      await this.cacheManager.set(client, newToken, ttl); // Store without expiry, manage expiry internally
      return newToken;
    });
  }

  async fetchNewJwt(client: string, scopes: string[]): Promise<string> {
    const foundClient: ClientsConfig = this.clients.find(
      (c) => c.name === client,
    );
    if (!foundClient) {
      throw new Error(`${client} not a valid client`);
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('scope', scopes.join(' '));

    const credentials = Buffer.from(
      `${foundClient.clientId}:${foundClient.clientSecret}`,
    ).toString('base64');
    const result = await firstValueFrom(
      this.httpService.post(
        `${foundClient.publicAuthority}/oauth2/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // Basic Auth with Client ID and Client Secret
            Authorization: `Basic ${credentials}`,
          },
        },
      ),
    );
    const accessToken: string = result.data?.access_token;
    if (!accessToken || accessToken.split('.').length !== 3) {
      throw new Error('Unable to acquire a valid access token');
    }
    return accessToken;
  }

  isTokenExpiring(token: string) {
    const expires: number = this.getTokenExpiration(token);
    const now: number = Math.floor(Date.now() / 1000);
    return expires - now < FIVE_MINUTES_IN_SECONDS;
  }

  getTokenExpiration(token: string): number {
    const decoded: JwtPayload | string = decode(token);
    if (typeof decoded !== 'object') {
      throw new Error('Token not a valid object');
    }
    const payload: JwtPayload = decoded as JwtPayload;
    const expires: number = payload.exp;
    return expires;
  }
}
