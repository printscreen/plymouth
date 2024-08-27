import { Injectable } from '@nestjs/common';
import { Logger } from 'typeorm';
import { QueryRunner } from 'typeorm/query-runner/QueryRunner';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class DatabaseLogger implements Logger {
  constructor(
    @InjectPinoLogger(DatabaseLogger.name) private readonly logger: PinoLogger,
  ) {}

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    this.logger.info({ query, parameters });
  }

  logQueryError(
    error: string,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    this.logger.error({ query, parameters }, error);
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    this.logger.warn({ query, parameters, time }, 'Slow query');
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    this.logger.info(message);
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    this.logger.info(message);
  }

  /**
   * Perform logging using given logger, or by default to the console.
   * Log has its own level and message.
   */
  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
    switch (level) {
      case 'log':
        this.logger.info(message);
        break;
      case 'info':
        this.logger.info(message);
        break;
      case 'warn':
        this.logger.warn(message);
        break;
    }
  }
}
