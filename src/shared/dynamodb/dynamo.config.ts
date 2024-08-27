import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DynamooseOptionsFactory,
  DynamooseModuleOptions,
} from 'nestjs-dynamoose';

@Injectable()
export class DynamodbConfigService implements DynamooseOptionsFactory {
  // constructor(
  //   @InjectPinoLogger()
  //   private readonly logger: PinoLogger,
  // ) {}

  @Inject(ConfigService)
  private readonly config: ConfigService;

  public createDynamooseOptions(): DynamooseModuleOptions {
    // this.logger.log = function (message, ...args) {
    //   this.info(message, ...args);
    // };
    return {
      aws: this.config.get<object>('dynamoDb'),
      // logger: this.logger,
    };
  }
}
