import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUser1658810368141 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
            isPrimary: true,
            default: `uuid_generate_v4()`,
          },
          {
            name: 'user_name',
            type: 'varchar(24)',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar(255)',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
        checks: [
          {
            expression: `user_name ~* '^[a-z0-9_.]+$'`,
          },
        ],
      }),
      true,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX globally_unique_username ON users ((lower(user_name)));`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX globally_unique_user_email ON users ((lower(email)));`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
