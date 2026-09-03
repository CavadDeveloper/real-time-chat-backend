import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}
  async register(registerdto: RegisterDto) {
    const { username, email, password } = registerdto;
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });
    if (existingUser) {
      throw new BadRequestException(
        'Bu İstifadəçi adı və ya emaili artıq mövcuddur!',
      );
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = this.userRepository.create({
      username,
      email,
      passwordHash,
    });
    await this.userRepository.save(newUser);
    return { message: 'Qeydiyyat uğurla tamamlandı', userId: newUser.id };
  }
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email və  ya Şifrə yanlışdır ');
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email və ya şifrə yanlışdır');
    }
    const payload = { sub: user.id, email: user.email };
    const accesToken = this.jwtService.sign(payload);
    return {
      accesToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
      },
    };
  }
}
