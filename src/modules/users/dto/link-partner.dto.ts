import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LinkPartnerDto {
  @IsEmail()
  @IsNotEmpty()
  partnerEmail: string;

  @IsString()
  @IsOptional()
  partnerName?: string;
}
