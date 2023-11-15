import { RequestBuyDto } from '@anveshak/data-transfer-objects';
import { Injectable, Logger } from '@nestjs/common';
import algosdk from 'algosdk';
import {Buffer} from "buffer";

const token = 'a'.repeat(64);
const server = "http://192.168.2.4";
const port = 4001;

// Instantiate the algod wrapper
const algodclient = new algosdk.Algodv2(token, server, port);

const kmdToken = 'a'.repeat(64);
const kmdServer = 'http://192.168.2.4';
const kmdPort = 4002;
const kmdClient = new algosdk.Kmd(kmdToken, kmdServer, kmdPort);

 interface SandboxAccount {
  addr: string;
  privateKey: Uint8Array;
  signer: algosdk.TransactionSigner;
}

@Injectable()
export class AlgorandService {
  // constructor(){}

  async createWallet(username: string){
  const walletName = 'testWallet'+username;
  const password = 'testpassword';
  const masterDerivationKey = undefined;
  const driver = 'sqlite';

  const wallet = await kmdClient.createWallet(
      walletName,
      password,
      masterDerivationKey,
      driver
    );
    const walletID = wallet.wallet.id;
    console.log('Created wallet:', walletID);

    const wallethandle = (
      await kmdClient.initWalletHandle(walletID, 'testpassword')
    ).wallet_handle_token;
    console.log('Got wallet handle:', wallethandle);

    const newAccount = await this.createAccount();
    const importedAccount = await kmdClient.importKey(
      wallethandle,
      newAccount.newAccount.sk
    );
    console.log('Account successfully imported: ', importedAccount);
    return newAccount;

  }

   async getLocalAccounts(): Promise<SandboxAccount[]> {
     try {
       const wallets = await kmdClient.listWallets();
       let walletId;
       for (const wallet of wallets.wallets) {
         if (wallet.name === 'unencrypted-default-wallet') walletId = wallet.id;
       }
       if (walletId === undefined)
         throw Error('No wallet named: unencrypted-default-wallet');
       const handleResp = await kmdClient.initWalletHandle(walletId, '');
       const handle = handleResp.wallet_handle_token;

       const addresses = await kmdClient.listKeys(handle);
       const acctPromises: Promise<{ private_key: Buffer }>[] = [];
       for (const addr of addresses.addresses) {
         acctPromises.push(kmdClient.exportKey(handle, '', addr));
       }
       const keys = await Promise.all(acctPromises);
       kmdClient.releaseWalletHandle(handle);
       return keys.map((k) => {
         const addr = algosdk.encodeAddress(k.private_key.slice(32));
         const acct = { sk: k.private_key, addr } as algosdk.Account;
         const signer = algosdk.makeBasicAccountTransactionSigner(acct);
         return {
           addr: acct.addr,
           privateKey: acct.sk,
           signer,
         };
       });
     } catch (error) {
       console.error('Error in getLocalAccounts:', error);
       throw error;
     }
  }


  async createAccount(){

    let acct = null;
    acct = algosdk.generateAccount();
    const account1 = acct.addr;
    console.log("Account 1 = " + account1);
    const account1_mnemonic = algosdk.secretKeyToMnemonic(acct.sk);
    console.log("Account Mnemonic 1 = "+ account1_mnemonic);
    const recoveredAccount1 = algosdk.mnemonicToSecretKey(account1_mnemonic);
    const isValid = algosdk.isValidAddress(recoveredAccount1.addr);
    const account_info = (await algodclient.accountInformation(recoveredAccount1.addr).do());
    console.log("Is this a valid address: " + isValid);
    console.log("Account created. Save off Mnemonic and address");
    return {
      newAccount: acct,
      accountAddress: account1,
      accountMnemonic: account1_mnemonic,
      balanceInfo: JSON.stringify(account_info)
    }
  }

  async getAccountBalance(key: string){
    try {
      const recoveredAccount1 = algosdk.mnemonicToSecretKey(key);
      const account_info = (await algodclient.accountInformation(recoveredAccount1.addr).do());
      const acct_string = JSON.stringify(account_info);
      console.log("Account 1 Info: " + acct_string);
      return acct_string;
    } catch (error) {
      console.log(error);
      throw new Error('Something went wrong');
    }
  }

  async assetsCreate(bodyParams: RequestBuyDto) {
    const accounts = await this.getLocalAccounts();
    const creator = accounts[0];
    const suggestedParams = await algodclient.getTransactionParams().do();
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: creator.addr,
      suggestedParams,
      defaultFrozen: false,
      unitName: 'GHY',
      assetName: 'Green Hydrogen',
      manager: creator.addr,
      reserve: creator.addr,
      freeze: creator.addr,
      clawback: creator.addr,
      total: bodyParams.quantity,
      decimals: 0,
    });

    const signedTxn = txn.signTxn(creator.privateKey);
    await algodclient.sendRawTransaction(signedTxn).do();
    const result = await algosdk.waitForConfirmation(
      algodclient,
      txn.txID().toString(),
      3
    );

    const assetIndex = result['asset-index'];
    console.log(`Asset ID created: ${assetIndex}`);
    console.log(`result: ${result}`);

    const assetInfo = await algodclient.getAssetByID(assetIndex).do();
    console.log(`Asset Name: ${assetInfo['params'].name}`);
    console.log(`Asset Params: ${assetInfo['params']}`);
    return assetInfo;
  }

  // async assetsReceive() {
  //   /* first initiate an asset creation, then go with receiving assets. Working now */

  //   const accounts = await this.getLocalAccounts();
  //   const receiver = accounts[2];
  //   const suggestedParams = await algodclient.getTransactionParams().do();
  //   const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
  //     from: receiver.addr,
  //     to: receiver.addr,
  //     suggestedParams,
  //     assetIndex,
  //     amount: 0,
  //   });
  //   const signedOptInTxn = optInTxn.signTxn(receiver.privateKey);
  //   await algodclient.sendRawTransaction(signedOptInTxn).do();
  //   await algosdk.waitForConfirmation(algodclient, optInTxn.txID().toString(), 3);
  //   console.log('results of receiving assets--', optInTxn, '----', signedOptInTxn)
  // }


  async assetsTransfer(bodyParams: any, transferObject: any, assetIndex: any) {
    try {
      const senderSk = algosdk.mnemonicToSecretKey(transferObject.sernderPk);
      const suggestedParams = await algodclient.getTransactionParams().do();
      const xferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: senderSk.addr,
        to: bodyParams.receiver,
        suggestedParams,
        assetIndex,
        amount: bodyParams.quantity,
      });
      const signedXferTxn = xferTxn.signTxn(senderSk.sk);
      await algodclient.sendRawTransaction(signedXferTxn).do();
      await algosdk.waitForConfirmation(algodclient, xferTxn.txID().toString(), 3);
      console.log('results of transfer assets--', JSON.stringify(xferTxn) , '----', signedXferTxn);
      return {
        info: signedXferTxn,
        id: 'BOVD3AZ4ICENJUE4ESCZSBIVE5TO6A7IJ5RDZCTXOH47HB7VRUFA'
      }
    } catch (error) {
      Logger.error("  Error whileeeeee",error);
      return {
        info: "transfer failed",
        id: 'CENJUE4ESCZSBIVE5TTXOH47HB7VRUFABOVD3AZ4IO6A7IJ5RDZC'

      }
    }
  }

}
