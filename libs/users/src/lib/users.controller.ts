import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import {LoginDto, RequestBuyDto, SignUpDto} from '@anveshak/data-transfer-objects';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard, GetUser } from '@anveshak/auth';

@ApiTags('User')
@Controller('users')
export class UsersController {
  constructor(
    private userService: UsersService
  ) {}

  @Post('login')
  async login(@Body() bodyParams: LoginDto){
    const loggedIn =await this.userService.login(bodyParams);
    if(loggedIn.status == 200){
      return {
        status: 200,
        info: 'Logged in successfully',
        access_token: loggedIn.access_token,
        role: loggedIn.role
      }
    }else if(loggedIn.status == 404){
      throw new HttpException('User not exist', HttpStatus.NOT_FOUND);
    }else{
      throw new HttpException('Wrong Password', HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('signUp')
  async signUp(@Body() bodyParams: SignUpDto){
    const response = await this.userService.signUp(bodyParams);
    if(response.status == 201){
      return response
    }else if(response.status == 409){
      throw new HttpException('User already exist', HttpStatus.CONFLICT);
    }else{
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('Authorization')
  @Get('balance')
  getData(
    @GetUser() user: any,
  ) {
    return this.userService.getAccountBalance(user);
  }

  /* BUY */
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Authorization')
  @Post('request')
  async request(@GetUser() user: any, @Body() bodyparams: RequestBuyDto){
    return await this.userService.requestProduct(user, bodyparams);
  }

  /* Balance */
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Authorization')
  @Get('assets/balance')
  async getAssetBalance(@GetUser() user: any){
    return await this.userService.getAssetBalance(user);
  }

  // /* Receiving an asset */
  // @UseGuards(AuthGuard)
  // @ApiBearerAuth('Authorization')
  // @Post('receive')
  // async receive(@Body() bodyParams: RequestBuyDto){
  //   return await this.userService.receiveAssets(bodyParams);
  // }

  /* Transferring an asset */
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Authorization')
  @Post('transfer')
  async transfer(@GetUser() user: any, @Body() bodyParams: RequestBuyDto){
    try {
      return await this.userService.transferAssets(user, bodyParams);
    } catch (error) {
      Logger.error("Errrrr", error);
      throw new  HttpException("Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
