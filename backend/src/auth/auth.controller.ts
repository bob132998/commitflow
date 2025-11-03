// src/auth/auth.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('anon')
    async anonLogin(@Body('userId') userId?: string) {
        console.log('AuthController: anonLogin called', userId);
        const { token, user } = await this.authService.createOrGetAnonymousUser(userId);
        return { token, userId: user.id }; // kirim userId juga
    }

}
