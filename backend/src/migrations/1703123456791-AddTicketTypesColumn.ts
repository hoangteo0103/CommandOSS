import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTicketTypesColumn1703123456791 implements MigrationInterface {
  name = 'AddTicketTypesColumn1703123456791';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'events',
      new TableColumn({
        name: 'ticket_types',
        type: 'json',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('events', 'ticket_types');
  }
}
