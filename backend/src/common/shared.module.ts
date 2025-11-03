// src/common/shared.module.ts
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';

@Global()
@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'supersecret',
            signOptions: { expiresIn: '1d' },
        }),
    ],
    providers: [
        {
            provide: PrismaClient,
            useValue: new PrismaClient(),
        },
    ],
    exports: [JwtModule, PrismaClient],
})
export class SharedModule { }
