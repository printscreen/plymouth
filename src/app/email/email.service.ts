import { randomBytes } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel, Item, Model, QueryResponse } from 'nestjs-dynamoose';
import { plainToClass } from 'class-transformer';
import { camelCase, mapKeys } from 'lodash';
import { DateTime } from 'luxon';
import { CreateEmailVerificationDto } from '@app/app/email/dto/create-email-verification.dto';
import {
  CREATED_AT_LOCAL_SECONDARY_INDEX,
  VerifyEmail,
  VerifyEmailKey,
} from '@app/app/email/schemas/verify-email.schema';
import { VerifyEmailDto } from '@app/app/email/dto/email-verification.dto';
import { customAlphabet } from 'nanoid';
import { SortOrder } from 'dynamoose/dist/General';

const generator = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);
const EMAIL_TYPE_VERIFICATION = 'verification';

@Injectable()
export class EmailService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    @InjectModel('VerifyEmail')
    private verifyEmailModel: Model<VerifyEmail, VerifyEmailKey>,
    @Inject(I18nService)
    private readonly i18nService: I18nService,
  ) {}

  generateVerificationCode(): string {
    return String(generator());
  }

  async createVerificationRequest(
    createEmailVerificationDto: CreateEmailVerificationDto,
  ): Promise<VerifyEmailDto> {
    const epoch: number = Math.round(Date.now() / 1000);
    const code = this.generateVerificationCode();
    const record: VerifyEmail = {
      email: createEmailVerificationDto.email,
      emailId: randomBytes(20).toString('hex'),
      ttl: this.configService.get<number>('verification.email.ttl') + epoch,
      code: code,
      verified: false,
      createdAt: DateTime.now().toMillis(),
      updatedAt: DateTime.now().toMillis(),
    };
    const verify: Item<VerifyEmail> = await this.verifyEmailModel.create(
      record,
      {
        return: 'item',
      },
    );
    const dto: VerifyEmailDto = plainToClass(
      VerifyEmailDto,
      mapKeys(verify, (v, k) => camelCase(k)),
    );

    const domain = this.configService.get<string>('domain');
    const params = {
      locale: 'en-US',
      to: [
        {
          email: createEmailVerificationDto.email,
        },
      ],
      fromName: this.i18nService.translate('email.DEFAULT_FROM_USER'),
      fromEmail: `no-reply@${domain}`,
      type: EMAIL_TYPE_VERIFICATION,
      definition: {
        code,
        domain,
      },
    };
    await firstValueFrom(
      this.httpService.post(
        `${this.configService.get<string>(
          'services.email',
        )}/send/${EMAIL_TYPE_VERIFICATION}`,
        params,
      ),
    );
    return dto;
  }

  findOne(email: string, emailId: string): Promise<VerifyEmail> {
    const key: VerifyEmailKey = {
      email,
      emailId,
    };
    return this.verifyEmailModel.get(key);
  }

  async findMostRecent(email: string): Promise<VerifyEmail> {
    const result: QueryResponse<Item<VerifyEmail>> = await this.verifyEmailModel
      .query('email')
      .eq(email)
      .using(CREATED_AT_LOCAL_SECONDARY_INDEX)
      .sort(SortOrder.descending)
      .limit(1)
      .exec();
    return result && result.length > 0 ? result[0] : null;
  }

  async verify(email: string, emailId: string): Promise<VerifyEmailDto> {
    const key: VerifyEmailKey = {
      email,
      emailId,
    };
    const record: Partial<VerifyEmail> = {
      verified: true,
    };
    const verify = await this.verifyEmailModel.update(key, record);
    return plainToClass(
      VerifyEmailDto,
      mapKeys(verify, (v, k) => camelCase(k)),
    );
  }
}
