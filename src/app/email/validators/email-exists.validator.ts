import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UserService } from '../../users/user.service';
import validator from 'validator';

@ValidatorConstraint({ name: 'EmailExists', async: true })
@Injectable()
export class EmailExistsRule implements ValidatorConstraintInterface {
  constructor(private usersService: UserService) {}

  async validate(value: string) {
    if (!value || !validator.isEmail(String(value))) {
      return true;
    }
    const user = await this.usersService.findByEmail(value);
    return !user;
  }

  defaultMessage(): string {
    return 'Email in use';
  }
}
