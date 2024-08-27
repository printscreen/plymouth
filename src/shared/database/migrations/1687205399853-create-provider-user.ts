import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateProviderUser1687205399853 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'provider_users',
        columns: [
          {
            name: 'provider_user_id',
            type: 'uuid',
            isNullable: false,
            isPrimary: true,
            default: `uuid_generate_v4()`,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provider_id',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'external_id',
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
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedColumnNames: ['user_id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['provider_id'],
            referencedColumnNames: ['provider_id'],
            referencedTableName: 'providers',
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          new TableIndex({
            name: 'unique_provider_id_external_id',
            columnNames: ['provider_id', 'external_id'],
            isUnique: true,
          }),
          new TableIndex({
            name: 'unique_provider_id_user_id',
            columnNames: ['provider_id', 'user_id'],
            isUnique: true,
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('provider_users');
  }
}
