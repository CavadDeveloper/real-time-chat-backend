import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;
  @IsEmail()
  email: string;
  @IsString()
  @MinLength(6, { message: 'Şifrə ən azı 6 simvoldan ibarət olmalıdı' })
  password: string;
}
