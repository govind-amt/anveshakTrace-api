import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {Document} from 'mongoose';


@Schema()
export class User {
  @Prop()
  email!: string;

  @Prop()
  username!: string;

  @Prop()
  password!: string;

  @Prop()
  role!: string;

  @Prop()
  accountAddress!: string

  @Prop()
  accountMnemonic!: string

  @Prop()
  balanceInfo!: string

}
export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = User & Document;
export const userSchemaName = "User";
