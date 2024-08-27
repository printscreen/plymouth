import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsIn,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import { UserEntity } from '@app/app/users/entities/user.entity';

export class UserPaginatorDto {
  static readonly ALLOWED_SORT_VALUES = Object.keys(
    UserEntity.prototype,
  ) as (keyof UserEntity)[];

  @IsOptional()
  @IsIn(UserPaginatorDto.ALLOWED_SORT_VALUES, {
    message: i18nValidationMessage('validators.INVALID_SORT'),
  })
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  public sort = 'userId';

  @IsOptional()
  @IsIn(['ASC', 'DESC'], {
    message: i18nValidationMessage('validators.INVALID_SORT_DIRECTION'),
  })
  @IsString({ message: i18nValidationMessage('validators.STRING') })
  public sortDirection = 'DESC';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: i18nValidationMessage('validators.INTEGER') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @Min(0, { message: i18nValidationMessage('validators.MIN') })
  public offset = 0;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: i18nValidationMessage('validators.INTEGER') })
  @IsNotEmpty({ message: i18nValidationMessage('validators.REQUIRED') })
  @Min(0, { message: i18nValidationMessage('validators.MIN') })
  @Max(1000, { message: i18nValidationMessage('validators.MAX') })
  public limit = 20;
}
