import {
  IsBoolean,
  IsNumber,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsEmail,
  IsDate,
} from 'class-validator';
import { Exclude, Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import { DateTime } from 'luxon';

export class VerifyEmailDto {
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  @IsEmail({}, { message: i18nValidationMessage('validators.EMAIL_INVALID') })
  public email: string;

  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  public emailId: string;

  @Exclude()
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  public code: string;

  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @IsBoolean({ message: i18nValidationMessage('validators.BOOLEAN') })
  public verified: boolean;

  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsDate({ message: i18nValidationMessage('validators.DATE') })
  @Transform(({ value }) =>
    // Is the value epoch? Then convert it to ISO. Handle seconds and milliseconds epoch too
    value && /^\d+$/.test(String(value))
      ? DateTime.fromMillis(parseInt(value)).toJSDate()
      : value,
  )
  public createdAt: Date;

  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsDate({ message: i18nValidationMessage('validators.DATE') })
  @Transform(({ value }) =>
    // Is the value epoch? Then convert it to ISO. Handle seconds and milliseconds epoch too
    value && /^\d+$/.test(String(value))
      ? DateTime.fromMillis(parseInt(value)).toJSDate()
      : value,
  )
  public updatedAt: Date;

  @Exclude()
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: i18nValidationMessage('validators.INTEGER') },
  )
  public ttl: number;
}
