import { Module } from '@nestjs/common';
import {MongooseModule} from "@nestjs/mongoose";
import {ConfigModule, ConfigService} from "@nestjs/config";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from '@anveshak/users';
import { AuthModule } from '@anveshak/auth';
import { AlgorandModule } from '@anveshak/algorand';

@Module({
  imports: [
    AlgorandModule,
    AuthModule,
    UsersModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: process.env.MONGO_URI,
        dbName: process.env.MONGO_DB_NAME,
      })
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
