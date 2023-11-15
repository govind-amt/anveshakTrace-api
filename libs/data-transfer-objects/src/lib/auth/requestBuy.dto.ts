import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RequestBuyDto{
  @ApiProperty({
    required: true,
    example: '54EZUFRVP7TDWM7B5SCEUKQJGLRYMITZKDPMA7D7PJGLJGRG3AL35OZX74'
  })
  @IsString()
  receiver!:string;


  @ApiProperty({
    required: true,
    example: 1000
  })
  @IsString()
  quantity!: number;

}
