import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {Document, ObjectId, SchemaTypes} from 'mongoose';


@Schema({ timestamps: true })
export class Stock {
  @Prop()
  product!: string;

  @Prop()
  quantity!: number;

  @Prop()
  coinSymbol!: string;

  @Prop({ref: 'User',type:SchemaTypes.ObjectId})
  userId!: ObjectId;

  @Prop()
  assestIndex!: number

}
export const StockSchema = SchemaFactory.createForClass(Stock);
export type StockDocument = Stock & Document;
export const stockSchemaName = "Stock";
