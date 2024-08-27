import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';
import { CreateEmailVerificationDto } from './dto/create-email-verification.dto';
import { EmailCodeVerificationDto } from './dto/email-code-verification.dto';
import { VerifyEmailDto } from './dto/email-verification.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly email: EmailService) {}

  @Post()
  create(
    @Body() createEmailVerificationDto: CreateEmailVerificationDto,
  ): Promise<VerifyEmailDto> {
    return this.email.createVerificationRequest(createEmailVerificationDto);
  }

  @Post(':email')
  verify(
    @Body() emailVerificationDto: EmailCodeVerificationDto,
  ): Promise<VerifyEmailDto> {
    return this.email.verify(
      emailVerificationDto.email,
      emailVerificationDto.emailId,
    );
  }
}
