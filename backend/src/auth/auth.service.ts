// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaClient,
        private jwtService: JwtService,
    ) { }

    async createOrGetAnonymousUser(clientUserId?: string) {
        console.log('AuthService: createOrGetAnonymousUser called', clientUserId);

        let user;

        if (clientUserId) {
            // cek apakah user dengan id FE ini sudah ada
            user = await this.prisma.user.findUnique({ where: { id: clientUserId } });
        }

        if (!user) {
            // kalau belum ada, buat user baru pakai id dari FE atau generate baru
            user = await this.prisma.user.create({
                data: {
                    id: clientUserId || undefined, // kalau undefined, Prisma buatkan sendiri
                },
            });
            console.log('Created new anonymous user:', user.id);
        } else {
            console.log('Existing user found:', user.id);
        }

        // bikin JWT
        const jwt = this.jwtService.sign({ userId: user.id });

        // simpan JWT di DB
        await this.prisma.user.update({
            where: { id: user.id },
            data: { session_token: jwt },
        });

        return { token: jwt, user };
    }

    async validateUser(token: string) {
        try {
            const payload: any = this.jwtService.verify(token);
            const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
            if (!user || user.session_token !== token) return null;
            return user;
        } catch {
            return null;
        }
    }
}
