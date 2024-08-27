import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsEmail,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import { EmailExistsRule } from '../validators/email-exists.validator';
import { EmailVerificationRecentlySentRule } from '../validators/email-verification-recently-sent.validator';
import { blacklistDomains } from '../validators/blacklist.domains';

export class CreateEmailVerificationDto {
  @Transform((param) => param.value.toLowerCase().trim())
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  @IsEmail(
    { host_blacklist: blacklistDomains },
    { message: i18nValidationMessage('validators.EMAIL_INVALID') },
  )
  @Validate(EmailExistsRule, {
    message: i18nValidationMessage('validators.EMAIL_ALREADY_EXISTS'),
  })
  @Validate(EmailVerificationRecentlySentRule, {
    message: i18nValidationMessage(
      'validators.EMAIL_VERIFICATION_SENT_RECENTLY',
    ),
  })
  public email: string;
}
