import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import validator from 'validator';
import { EmailService } from '../../email/email.service';
import { VerifyEmail } from '../../email/schemas/verify-email.schema';
import { CreateUserDto } from '@app/app/users/dto/create-user.dto';

@ValidatorConstraint({ name: 'EmailVerified', async: true })
@Injectable()
export class EmailVerifiedRule implements ValidatorConstraintInterface {
  constructor(private emailService: EmailService) {}

  async validate(value: string, args: ValidationArguments) {
    const form = args.object as CreateUserDto;
    if (!validator.isEmail(value)) {
      return true;
    }
    const email: VerifyEmail = await this.emailService.findOne(
      value,
      form.emailId,
    );
    if (email && email.verified === true) {
      return true;
    }
    return false;
  }

  defaultMessage(): string {
    return 'Verified email not found';
  }
}
