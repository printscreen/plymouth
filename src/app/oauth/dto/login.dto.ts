import { IsNotEmpty, IsString, MaxLength, IsEmail } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { blacklistDomains } from '../../email/validators/blacklist.domains';

export class LoginDto {
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  @IsEmail(
    { host_blacklist: blacklistDomains },
    { message: i18nValidationMessage('validators.EMAIL_INVALID') },
  )
  public email: string;

  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  public password: string;
}
