// src/common/guards/jwt.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaClient,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.replace('Bearer ', '');

        if (!token) throw new UnauthorizedException('No token');

        try {
            const payload: any = this.jwtService.verify(token);
            const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
            if (!user || user.session_token !== token) throw new UnauthorizedException('Invalid token');

            req.user = payload;
            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
