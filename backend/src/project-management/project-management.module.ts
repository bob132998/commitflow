import { Module } from "@nestjs/common";
import { ProjectManagementController } from "./project-management.controller";
import { ProjectManagementService } from "./project-management.service";
import { MulterModule } from "@nestjs/platform-express";
import { EmailModule } from "src/email/email.module";

@Module({
  imports: [
    MulterModule.register({
      dest: "./uploads",
    }),
    EmailModule,
  ],
  controllers: [ProjectManagementController],
  providers: [ProjectManagementService],
  exports: [ProjectManagementService],
})
export class ProjectManagementModule {}
