import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto{
  @ApiProperty({
    required: true,
    example: 'producer1@anveshak.in'
  })
  @IsString()
  email!:string;


  @ApiProperty({
    required: true,
    example:'password'
  })
  @IsString()
  password!:string;

}
