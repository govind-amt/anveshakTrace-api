import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { Constants } from '@anveshak/configuration';
import { AuthGuard } from './auth.guard';

@Module({
  imports:[
    JwtModule.register({
      global: true,
      secret: Constants.JWT_SECRET,
    })
  ],
  controllers: [AuthController],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
