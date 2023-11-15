import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { StockSchema, UserSchema, stockSchemaName, userSchemaName } from '@anveshak/schema';
import { UsersRepository } from './users.repository';
import { UsersController } from './users.controller';
import { AlgorandModule } from '@anveshak/algorand';
@Module({
  imports: [
    AlgorandModule,
    MongooseModule.forFeature([
      {
        name: userSchemaName,
        schema: UserSchema,
      },
      {
        name: stockSchemaName,
        schema: StockSchema,
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
