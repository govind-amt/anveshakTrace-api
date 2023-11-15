import { Module } from '@nestjs/common';
import { AlgorandService } from './algorand.service';
import { AuthModule } from '@anveshak/auth';

@Module({
  imports: [AuthModule],
  providers: [AlgorandService],
  exports: [AlgorandService],
})
export class AlgorandModule {}
