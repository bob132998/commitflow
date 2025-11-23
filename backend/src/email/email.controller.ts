import { Body, Controller, Post } from "@nestjs/common";
import { EmailService } from "./email.service";
import { SendEmailDto } from "./dto/send-email.dto";

@Controller("email")
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post("send")
  async send(@Body() dto: SendEmailDto) {
    const res = await this.emailService.sendMail({
      to: dto.to,
      subject: dto.subject,
      text: dto.text,
      html: dto.html,
    });
    return res;
  }
}
