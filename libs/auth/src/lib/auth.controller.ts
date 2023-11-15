import { Body, Controller, HttpException, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from '@anveshak/data-transfer-objects';


@ApiTags('Auth')
@Controller('auth')
export class AuthController {

}
