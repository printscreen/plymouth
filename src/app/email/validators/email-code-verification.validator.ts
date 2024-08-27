import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { EmailCodeVerificationDto } from '../dto/email-code-verification.dto';
import validator from 'validator';
import { EmailService } from '../email.service';
import { VerifyEmail } from '../schemas/verify-email.schema';

@ValidatorConstraint({ name: 'EmailCodeVerification', async: true })
@Injectable()
export class EmailCodeVerificationRule implements ValidatorConstraintInterface {
  constructor(private emailService: EmailService) {}

  async validate(email: string, args: ValidationArguments): Promise<boolean> {
    const form = args.object as EmailCodeVerificationDto;
    if (
      !email ||
      !validator.isEmail(String(email)) ||
      !form.emailId ||
      validator.isEmpty(String(form.emailId))
    ) {
      return false;
    }
    const record: VerifyEmail = await this.emailService.findOne(
      email,
      form.emailId,
    );

    if (
      record &&
      String(form.code).length &&
      String(form.code) === record.code
    ) {
      return true;
    }
    return false;
  }

  defaultMessage(): string {
    return 'Email sent recently';
  }
}
