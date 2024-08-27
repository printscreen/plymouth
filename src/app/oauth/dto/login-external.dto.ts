import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Provider } from '@app/app/oauth/providers/provider.interface';

export class LoginExternalDto {
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
}
