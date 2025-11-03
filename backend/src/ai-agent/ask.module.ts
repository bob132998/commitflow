import { Module } from '@nestjs/common';
import { AskService } from './ask.service';
import { AskGateway } from "./ask.gateway";
import { TtsController } from './tts/tts.controller';
import { TtsService } from './tts/tts.service';
import { TtsModule } from './tts/tts.module';
import { SharedModule } from "src/common/shared.module";
import { JwtGuard } from "src/common/guards/jwt.guard";
import { MessagesController } from './messages/messages.controller';
import { MessagesModule } from './messages/messages.module';
import { MessagesService } from "./messages/messages.service";

@Module({
  imports: [TtsModule, SharedModule, MessagesModule],
  controllers: [TtsController, MessagesController],
  providers: [AskService, AskGateway, TtsService, MessagesService, JwtGuard],
  exports: []
})
export class AskModule { }
