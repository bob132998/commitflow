import { IsEmail, IsNotEmpty, IsOptional } from "class-validator";

export class SendEmailDto {
  @IsEmail()
  to: string;

  @IsNotEmpty()
  subject: string;

  @IsOptional()
  text?: string;

  @IsOptional()
  html?: string;
}
