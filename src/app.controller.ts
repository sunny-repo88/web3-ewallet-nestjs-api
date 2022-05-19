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
  constructor(private readonly appService: AppService) {}

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
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<ResponseEntity> {
    if (limit > 50) {
      limit = 50;
    }
    try {
      // get wallet addresss/user transactions
      const options = {
        address: walletAddress,
        offset: offset,
        limit: limit,
      };
      const transactions = await this.appService.getTransactions(options);
      return new ResponseEntity({
        status: HttpStatus.OK,
        results: transactions.result,
        metaData: {
          total: transactions.total,
          page: transactions.page,
          pageSize: transactions.page_size,
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
}
