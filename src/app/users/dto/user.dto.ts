import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsEmail,
  IsDate,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UserDto {
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsUUID('4', { message: i18nValidationMessage('validators.INVALID_UUID') })
  public userId: string;

  @Transform(({ value }) => value.toLowerCase())
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  @IsEmail({}, { message: i18nValidationMessage('validators.EMAIL_INVALID') })
  public email: string;

  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  public userName: string;

  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsDate({ message: i18nValidationMessage('validators.DATE') })
  public createdAt: Date;

  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsDate({ message: i18nValidationMessage('validators.DATE') })
  public updatedAt: Date;
}
