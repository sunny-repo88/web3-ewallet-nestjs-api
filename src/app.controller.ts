import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';
import axios from 'axios';
import { Logger } from '@nestjs/common';
import { TransactionService } from './transaction.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const InputDataDecoder = require('ethereum-input-data-decoder');

export class ResponseMetaData {
  total = 0;
  page = 0;
  pageSize = 0;
}

export class ResponseEntity {
  status: HttpStatus;
  results: Array<any>;
  metaData: ResponseMetaData;

  constructor(partial: Partial<ResponseEntity>) {
    Object.assign(this, partial);
  }
}

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(
    private readonly appService: AppService,
    private readonly transactionService: TransactionService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // http://localhost:3000/0x80efF130ddE6223a10e6ab27e35ee9456b635cCD/nft
  @Get(':walletAddress/nft')
  async getWalletAddressNfts(
    @Param('walletAddress') walletAddress: string,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<ResponseEntity> {
    if (limit > 50) {
      limit = 50;
    }

    try {
      // getNft
      const options = {
        chain: 'Eth',
        address: walletAddress,
        offset: offset,
        limit: limit,
      };
      const walletAddressNfts = await this.appService.getNfts(options);
      if (walletAddressNfts.result === 0) {
        return {
          status: HttpStatus.OK,
          results: [],
          metaData: {
            total: 0,
            page: 0,
            pageSize: 0,
          },
        };
      }
      // realNft Content is inside tokenUri
      // prepare axios request
      let results = [];
      const reqs = [];
      for (let index = 0; index < walletAddressNfts.result.length; index++) {
        const tokenUri = walletAddressNfts.result[index].token_uri;
        reqs.push(axios.get(tokenUri).then((response) => response.data));
      }
      // collect all axios request's result at once
      await Promise.all(reqs).then((responses) => {
        results = responses;
      });

      // return result
      return new ResponseEntity({
        status: HttpStatus.OK,
        results: results,
        metaData: {
          total: walletAddressNfts.total,
          page: walletAddressNfts.page,
          pageSize: walletAddressNfts.page_size,
        },
      });
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  // http://localhost:3000/0x80efF130ddE6223a10e6ab27e35ee9456b635cCD/transactions
  @Get(':walletAddress/transactions')
  async getMessage(
    @Param('walletAddress') walletAddress: string,
  ): Promise<ResponseEntity> {
    try {
      // get wallet addresss/user transactions

      let transactions = [];
      let done = 0;
      const limit = 500;
      let offset = 0;
      while (done === 0) {
        const options = {
          address: walletAddress,
          offset: offset,
          limit: limit,
        };
        const transactionsResult = await this.appService.getTransactions(
          options,
        );
        transactions = transactions.concat(transactionsResult.result);
        if (
          transactionsResult.page != 0 &&
          transactionsResult.page * transactionsResult.page_size >
          transactionsResult.total
        ) {
          done = 1;
        }
        offset += limit;
      }

      const cached_to_addresses = [];
      // cache unique to address
      this.logger.log('cache unique to_address (contract address)');
      for (let index = 0; index < transactions.length; index++) {
        const element = transactions[index];
        if (
          !cached_to_addresses.includes(element.to_address) &&
          element.to_address
        ) {
          cached_to_addresses.push(element.to_address);
        }
      }
      // cache valid contracts
      this.logger.log('cache valid contracts');
      const validContracts = {};
      for (let index = 0; index < cached_to_addresses.length; index++) {
        const cached_to_address = cached_to_addresses[index];
        const contractInfo = await axios
          .get(
            `https://api.etherscan.io/api?module=contract&action=getabi&address=${cached_to_address}&apikey=${process.env.ETHERSCAN_API_KEY}`,
          )
          .then((response) => response.data);
        if (contractInfo.status == '1') {
          validContracts[cached_to_address] = contractInfo.result;
        }
      }

      // running input data decoder
      this.logger.log('input data decoder');
      for (let index = 0; index < transactions.length; index++) {
        const transaction = transactions[index];
        transaction['decoded_input'] = {};
        if (transaction.to_address in validContracts) {
          const decoder = new InputDataDecoder(
            validContracts[transaction.to_address],
          );
          // input data from transaction api
          const data = transaction.input;
          const result = decoder.decodeData(data);
          // print all the keys
          // ["method", "types", "inputs", "names"];
          transaction['decoded_input'] = result;
          this.logger.log(transaction['decoded_input'])
        }
        transaction.nonce = parseInt(transaction.nonce);
        transaction.transaction_index = parseInt(transaction.transaction_index);
        transaction.value = parseInt(transaction.value);
        transaction.gas = parseInt(transaction.gas);
        transaction.gas_price = parseInt(transaction.gas_price);
        transaction.receipt_cumulative_gas_used = parseInt(
          transaction.receipt_cumulative_gas_used,
        );
        transaction.receipt_gas_used = parseInt(transaction.receipt_gas_used);
        transaction.receipt_status = parseInt(transaction.receipt_status);
        transaction.block_number = parseInt(transaction.block_number);
        transaction.wallet_id = walletAddress;
        delete transaction.transfer_index;
      }

      // save to db
      this.logger.log('saving db');
      await this.transactionService.createTransactions(
        walletAddress,
        transactions,
      );

      return new ResponseEntity({
        status: HttpStatus.OK,
        results: transactions,
      });
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
