// src/common/guards/api-key.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        const apiKey = request.headers['x-api-key'];
        const validKey = process.env.API_KEY; // disimpan di .env

        if (apiKey && apiKey === validKey) {
            return true;
        }

        throw new UnauthorizedException('Invalid or missing API key');
    }
}
