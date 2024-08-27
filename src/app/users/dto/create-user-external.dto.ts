import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  Validate,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { randomBytes } from 'crypto';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Provider } from '@app/app/oauth/providers/provider.interface';
import { UserNameExistsRule } from '@app/app/users/validators/username-exists.validator';

export class CreateUserExternalDto {
  @ApiProperty({
    description:
      'The access token given by the 3rd party (FB, Google, Apple) provider',
    required: true,
  })
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  public accessToken: string;

  @ApiProperty({
    description: 'The name of the provider',
    required: true,
    enum: Provider,
    enumName: 'Provider',
  })
  @IsEnum(Provider, {
    message: i18nValidationMessage('validators.INVALID_PROVIDER'),
  })
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  public provider: Provider;

  @ApiProperty({ description: 'Unique user name', required: true })
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  @Validate(UserNameExistsRule, {
    message: i18nValidationMessage('validators.USERNAME_ALREADY_EXISTS'),
  })
  public userName: string;

  @ApiProperty({
    description: 'The new password for the account',
    required: false,
  })
  @Transform(({ value }) => (value ? value : randomBytes(20).toString('hex')))
  public password: string;
}
