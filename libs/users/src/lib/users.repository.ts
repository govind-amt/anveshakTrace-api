import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId} from 'mongoose';
import * as bcrypt from "bcrypt";
import {StockDocument, UserDocument , stockSchemaName, userSchemaName} from "@anveshak/schema";
import { SignUpDto } from '@anveshak/data-transfer-objects';

@Injectable()
export class UsersRepository {

  constructor(
    @InjectModel(userSchemaName) private userModel: Model<UserDocument>,
    @InjectModel(stockSchemaName) private stockModel: Model<StockDocument>
    ) { }

  async saveUser(signUpParam: SignUpDto) {
    const passwordhash = await bcrypt.hash(signUpParam.password, 12);
    const user = new this.userModel({
      email: signUpParam.email,
      password: passwordhash,
      username: signUpParam.username,
      role: signUpParam.role
    });
    await user.save();
    return user;
  }

  async findUser(findQuery: any) {
    Logger.log("AAA",findQuery);
    return this.userModel.findOne(findQuery).exec();
  }

  async udpateUser(findQuery: any, updateQuery: any) {
    return this.userModel.updateOne(findQuery, updateQuery).exec();
  }

  async updateStock(findQuery: any, updateQuery: any){
    return this.stockModel.updateOne(findQuery, updateQuery, {upsert: true, new: true}).exec();
  }

  async getAssetBalance(userId: any){
    Logger.log(userId);
    return this.stockModel.findOne({userId: userId}).exec();
  }
}
