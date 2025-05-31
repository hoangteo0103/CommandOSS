import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLocationFields1703123456790 implements MigrationInterface {
  name = 'AddLocationFields1703123456790';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('events', [
      new TableColumn({
        name: 'latitude',
        type: 'decimal',
        precision: 10,
        scale: 7,
        isNullable: true,
      }),
      new TableColumn({
        name: 'longitude',
        type: 'decimal',
        precision: 10,
        scale: 7,
        isNullable: true,
      }),
      new TableColumn({
        name: 'place_id',
        type: 'varchar',
        isNullable: true,
      }),
    ]);

    // Create index for location-based queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_events_location" 
      ON "events" ("latitude", "longitude") 
      WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_events_location";');
    await queryRunner.dropColumn('events', 'place_id');
    await queryRunner.dropColumn('events', 'longitude');
    await queryRunner.dropColumn('events', 'latitude');
  }
}
