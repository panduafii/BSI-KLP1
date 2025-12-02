import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User, UserRole } from '../users/user.entity';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({ where: { nim: dto.nim } });
    if (existing) {
      throw new ConflictException('NIM already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      nim: dto.nim,
      email: dto.nim,
      passwordHash,
      role: dto.role || UserRole.STUDENT
    });
    await this.usersRepo.save(user);
    return { id: user.id, nim: user.nim, role: user.role };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { nim: dto.nim } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id, role: user.role, nim: user.nim };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: { id: user.id, nim: user.nim, role: user.role }
    };
  }
}
