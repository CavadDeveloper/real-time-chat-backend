import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class CreateConversationDto {
  @IsArray()
  @IsNotEmpty()
  memberIds: number[];
  @IsOptional()
  @IsString()
  title?: string;
}
