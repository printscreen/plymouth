import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateProvider1687190536714 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'providers',
        columns: [
          {
            name: 'provider_id',
            type: 'bigint',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar(24)',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.query(`
      INSERT INTO providers(provider_id, name)
      VALUES (1, 'FACEBOOK'), (2, 'GOOGLE'), (3, 'APPLE')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('providers');
  }
}
