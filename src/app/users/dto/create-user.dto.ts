import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsEmail,
  Validate,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { UserNameExistsRule } from '../validators/username-exists.validator';
import { EmailVerifiedRule } from '../validators/email-verified.validator';
import { blacklistDomains } from '../../email/validators/blacklist.domains';

export class CreateUserDto {
  @ApiProperty({ description: 'Unique email address', required: true })
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  @IsEmail(
    { host_blacklist: blacklistDomains },
    { message: i18nValidationMessage('validators.EMAIL_INVALID') },
  )
  @Validate(EmailVerifiedRule, {
    message: i18nValidationMessage('validators.EMAIL_NOT_VERIFIED'),
  })
  public email: string;

  @ApiProperty({
    description:
      'The code sent to the users email to verify their email address',
    required: true,
  })
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  public emailId: string;

  @ApiProperty({
    description: 'The new password for the account',
    required: true,
  })
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  public password: string;

  @ApiProperty({ description: 'Unique user name', required: true })
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  @Validate(UserNameExistsRule, {
    message: i18nValidationMessage('validators.USERNAME_ALREADY_EXISTS'),
  })
  public userName: string;
}
