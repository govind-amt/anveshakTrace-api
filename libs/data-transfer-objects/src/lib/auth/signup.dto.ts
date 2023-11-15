import {ApiProperty} from '@nestjs/swagger';
import {IsString} from "class-validator";

export class SignUpDto {
  @ApiProperty({
    required: true,
    example: 'producer@anveshak.in'
  })
  @IsString()
  email!: string;

  @ApiProperty({
    required: true,
    example: 'password'
  })
  @IsString()
  password!: string;

  @ApiProperty({
    required: true,
    example: 'Anveshak Producer'
  })
  @IsString()
  username!: string;

  @ApiProperty({
    required: true,
    example: 'producer'
  })
  @IsString()
  role!: string;
}
