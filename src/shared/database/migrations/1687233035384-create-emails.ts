import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateEmails1687233035384 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'emails',
        columns: [
          {
            name: 'email_id',
            type: 'uuid',
            isNullable: false,
            isPrimary: true,
            default: `uuid_generate_v4()`,
          },
          {
            name: 'email',
            type: 'varchar(255)',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'verified',
            type: 'boolean',
            isNullable: false,
            default: false,
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
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedColumnNames: ['user_id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX globally_unique_email ON emails ((lower(email)));`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('emails');
  }
}
