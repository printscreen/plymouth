import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsDate,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ProviderTypeId } from '../providers/provider.interface';

export class CreateProviderUserDto {
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsUUID('4', { message: i18nValidationMessage('validators.INVALID_UUID') })
  public userId: string;

  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  providerId: ProviderTypeId;

  @IsString({ message: i18nValidationMessage('validators.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @MaxLength(255, { message: i18nValidationMessage('validators.MAX_LENGTH') })
  public externalId: string;
}
