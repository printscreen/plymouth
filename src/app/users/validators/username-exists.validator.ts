import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@app/app/users/entities/user.entity';
import { Repository } from 'typeorm';

@ValidatorConstraint({ name: 'EmailExists', async: true })
@Injectable()
export class UserNameExistsRule implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(UserEntity)
    private userEntityRepository: Repository<UserEntity>,
  ) {}

  async validate(value: string) {
    const user = await this.userEntityRepository
      .createQueryBuilder('user')
      .where('LOWER(user_name) = :value', {
        value: `%${value.toLowerCase()}%`,
      })
      .getOne();
    return !user;
  }

  defaultMessage(): string {
    return 'Username in use';
  }
}
