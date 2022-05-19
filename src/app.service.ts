import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Moralis = require('moralis/node');

@Injectable()
export class AppService {
  serverUrl: string;
  appId: string;
  masterKey: string;

  constructor() {
    this.serverUrl = process.env.MORALIS_SERVER_URL;
    this.appId = process.env.MORALIS_APPID;
    this.masterKey = process.env.MORALIS_MASTERKEY;
  }

  getHello(): string {
    return 'Hello World!';
  }

  async connect() {
    await Moralis.start({
      serverUrl: this.serverUrl,
      appId: this.appId,
      masterKey: this.masterKey,
    });
  }

  async getNfts(options: any): Promise<any> {
    await this.connect();
    const walletAddressNfts = await Moralis.Web3API.account.getNFTs(options);
    return walletAddressNfts;
  }

  async getTransactions(options: any): Promise<any> {
    await this.connect();
    const transactions = await Moralis.Web3API.account.getTransactions(options);
    return transactions;
  }
}
