import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsEmail,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import { blacklistDomains } from '../validators/blacklist.domains';
import { EmailCodeVerificationRule } from '@app/app/email/validators/email-code-verification.validator';

export class EmailCodeVerificationDto {
  @Transform((param) => param.value.toLowerCase().trim())
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  @IsEmail(
    { host_blacklist: blacklistDomains },
    { message: i18nValidationMessage('validators.EMAIL_INVALID') },
  )
  @Validate(EmailCodeVerificationRule, {
    message: i18nValidationMessage(
      'validators.EMAIL_VERIFICATION_CODE_INCORRECT',
    ),
  })
  public email: string;

  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  public emailId: string;

  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  public code: string;
}
