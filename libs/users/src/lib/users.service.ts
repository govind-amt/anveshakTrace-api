import { HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import {LoginDto, RequestBuyDto, SignUpDto} from '@anveshak/data-transfer-objects';
import { AlgorandService } from '@anveshak/algorand';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from "bcrypt";
import { log } from 'console';
import { Mongoose, Types } from 'mongoose';
import { Constants } from '@anveshak/configuration';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private algorandService: AlgorandService,
    private jwtService: JwtService
  ) {}

  async login(bodyParams: LoginDto){
    try {
      const user = await this.getUser({email : bodyParams.email});
      if(user && Object.keys(user).length) {
        const isPasswordMatching = await bcrypt.compare(bodyParams.password, user.password);
        if (!isPasswordMatching) {
          throw new UnauthorizedException();
        } else {
          const payload: object = {  email: user.email, role: user.role, userId: user._id};
          return {
            status: 200,
            info: 'OK',
            access_token: await this.jwtService.signAsync(payload),
            role: user.role
          }
        }
      } else {
        return {
          status: 404,
          info: "User not exist"
        }
      }
    } catch (error) {
      Logger.error("Error in Login",error);
      throw error;
    }
  }

  async signUp(bodyParams: SignUpDto){
    try {
      Logger.debug('Inside SignUp',JSON.stringify(bodyParams));
      const userDetails = await this.usersRepository.findUser({email: bodyParams.email});
      if(userDetails && Object.keys(userDetails).length){
        return {status: HttpStatus.CONFLICT, info: "User already exist"};
      }else{
        const accountCredentials = await this.algorandService.createWallet(bodyParams.email);
        await this.usersRepository.saveUser(bodyParams);
        const findQuery = {
          email: bodyParams.email
        };
        const updateQuery = {
          $set: accountCredentials
        }
        await this.usersRepository.udpateUser(findQuery, updateQuery)
        return {status: HttpStatus.CREATED, info: "User signed up successfully"};
      }
    }catch (error) {
      Logger.error('Error in signup', error);
      throw Error("Error in signUp");
    }
  }

  async getUser(findQuery: any){
    const userDetails = await this.usersRepository.findUser(findQuery);
    return userDetails;
  }


  async getAccountBalance(user: any){
    const userDetails = await this.getUser({email: user.email});
    if(userDetails && Object.keys(userDetails).length > 0){
      // const balanceInfo = await this.algorandService.getAccountBalance(userDetails.accountMnemonic);
      const balanceInfo = userDetails.balanceInfo
      const parsedInfo = JSON.parse(balanceInfo);
      return {
        status: 200,
        info: 'balance fetched successfully',
        data: parsedInfo
      };

    }else{
      throw new HttpException('No account found',HttpStatus.NOT_FOUND);
    }
  }

  async updateStock(find: any, update: any){
    const stockDetails = await this.usersRepository.updateStock(find, update);
    return stockDetails;
  }

  async getAssetBalance(user: any){
    const userId = Types.ObjectId(user.userId);
    const balanceDetails = await this.usersRepository.getAssetBalance(userId);
    Logger.log(balanceDetails)
    return balanceDetails;
  }

  async requestProduct(user: any, bodyParams: RequestBuyDto){
    if(user.role == 'producer') {
      const assestInfo = await this.algorandService.assetsCreate(bodyParams);
      console.log('asset Info', JSON.stringify(assestInfo));
      const parameters = {
        product: 'Green Hydrogen',
        userId: user.userId,
        quantity: bodyParams.quantity,
        coinSymbol: 'GHY',
        assestIndex: assestInfo['index']
      }
      const findQuery = {
        userId: Types.ObjectId(user.userId),
        product: parameters.product,
      }
      const updateQuery = {
        '$set': {
          quantity: bodyParams.quantity,
          coinSymbol: parameters.coinSymbol,
          assestIndex: assestInfo['index']
        }
      }
      await this.updateStock(findQuery, updateQuery);
      return {
        status: 201,
        info: 'Green hydrogen added'
      };
    }else{
      console.log("Else");
      return {
        status: 404,
        info: 'Green hydrogen not able to fetch'
      };
    }
  }

  // async receiveAssets(bodyParams: RequestBuyDto){
  //   if(bodyParams.role == 'producer') {
  //     const responseStructure = await this.algorandService.assetsReceive()
  //     console.log('responseStructure', responseStructure);
  //     return responseStructure;
  //   }
  // }


  async transferAssets(user: any, bodyParams: RequestBuyDto){
    const SenderDetails = await this.getUser({_id: Types.ObjectId(user.userId)});
    Logger.log("getSenderDetails: ", SenderDetails);
    const assetBalance = await this.getAssetBalance(user);
    if(assetBalance && assetBalance?.quantity > bodyParams.quantity){
      const assestIndex:number = assetBalance.assestIndex;
      const transferObject = {
        senderAddress : SenderDetails?.accountAddress,
        sernderPk : SenderDetails?.accountMnemonic,
        receiverAddress: ''
      }
      if(user.role == 'producer' || user.role == 'reseller') {
        if(user.role == 'producer'){
          transferObject.receiverAddress = Constants.RESELLER_ADDRESS
        }else if(user.role == 'reseller'){
          transferObject.receiverAddress = Constants.RETAILER_ADDRESS
        }else{
          Logger.log("Elseee")
        }
        const responseStructure = await this.algorandService.assetsTransfer(bodyParams, transferObject, assestIndex);
        console.log('responseStructure', responseStructure);
        const findQuery = {
          userId: Types.ObjectId(user.userId),
          product: 'Green Hydrogen'
        }
        const updateQuery = {
          '$set': {
            quantity: assetBalance?.quantity - bodyParams.quantity
          }
        }
        let newalgoBalance = 0;
        await this.updateStock(findQuery, updateQuery);
        const counterDetails = await this.getUser({accountAddress: transferObject.receiverAddress});
        Logger.log("AAAAAAAA",counterDetails)
        const assetBalQuery = {
          userId: counterDetails?._id
        }
        if(SenderDetails && SenderDetails.balanceInfo){
          const senderAlgoBalanceInfo = JSON.parse(SenderDetails?.balanceInfo);
          const algoBalance = senderAlgoBalanceInfo.amount;
          if(algoBalance > 0){
            newalgoBalance = algoBalance - 2;
          }
          const newBalanceInfo = {...senderAlgoBalanceInfo};
          newBalanceInfo.amount = newalgoBalance;
          const balanceInfoStr = JSON.stringify(newBalanceInfo);
          await this.usersRepository.udpateUser({_id: SenderDetails._id}, {balanceInfo: balanceInfoStr})
        }
        const counterAssetBalanceObject = await this.getAssetBalance(assetBalQuery);
        Logger.log("CCCCC",counterAssetBalanceObject);
        const counterAssetBalance = counterAssetBalanceObject && counterAssetBalanceObject.quantity? counterAssetBalanceObject.quantity : 0;
        const findCounterQuery = {
          userId: Types.ObjectId(counterDetails?._id),
          product: 'Green Hydrogen'
        }

        const updateCounterQuery = {
          '$set': {
            quantity: counterAssetBalance + bodyParams.quantity,
            coinSymbol: 'GHY',
            assestIndex: assestIndex
          }
        }
        await this.updateStock(findCounterQuery, updateCounterQuery);

        return {
          status: 201,
          info: 'Green hydrogen added'
        };
      }else{
        // Need code for destruction of assest, as the role is retailer
        return {
          status: 404,
          info: 'Transaction failed'
        }
      }
    }else{
      return {
        status: 404,
        info: 'Transaction failed'
      }
    }
  }

}
