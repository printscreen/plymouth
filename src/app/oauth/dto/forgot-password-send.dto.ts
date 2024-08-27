import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { blacklistDomains } from '@app/app/email/validators/blacklist.domains';

export class ForgotPasswordSendDto {
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  @IsEmail(
    { host_blacklist: blacklistDomains },
    { message: i18nValidationMessage('validators.EMAIL_INVALID') },
  )
  public email: string;
}
