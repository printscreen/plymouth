import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import validator from 'validator';
import { DateTime } from 'luxon';
import { EmailService } from '../email.service';
import {
  EMAIL_CREATION_WAIT_TIME,
  VerifyEmail,
} from '../schemas/verify-email.schema';

@ValidatorConstraint({ name: 'EmailVerificationRecentlySent', async: true })
@Injectable()
export class EmailVerificationRecentlySentRule
  implements ValidatorConstraintInterface
{
  constructor(private emailService: EmailService) {}

  async validate(email: string): Promise<boolean> {
    if (!email || !validator.isEmail(String(email))) {
      return true;
    }
    const found: VerifyEmail = await this.emailService.findMostRecent(email);
    if (!found) {
      return true;
    }
    const storedDateTime: DateTime = DateTime.fromMillis(found.createdAt);
    const diffInMinutes: number = DateTime.now().diff(
      storedDateTime,
      'minutes',
    ).minutes;
    return EMAIL_CREATION_WAIT_TIME < diffInMinutes;
  }

  defaultMessage(): string {
    return 'Email sent recently';
  }
}
