import { Module } from '@nestjs/common';
import { AskModule } from './ai-agent/ask.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AskController } from "./ai-agent/ask.controller";
import { AskService } from "./ai-agent/ask.service";
import { AskGateway } from "./ai-agent/ask.gateway";
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from "./auth/auth.module";
import { JwtGuard } from "./common/guards/jwt.guard";
import { SharedModule } from "./common/shared.module";

@Module({
  imports: [
    // Serve folder public sebagai static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // folder public di root project
      serveRoot: '/', // bisa diakses langsung di http://localhost:3000/namafile
    }),
    AuthModule, UsersModule, AskModule, SharedModule],
  controllers: [AppController, AskController],
  providers: [AppService, AskService, AskGateway, JwtGuard],
})
export class AppModule { }
