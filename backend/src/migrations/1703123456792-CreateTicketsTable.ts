import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTicketsTable1703123456790 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tickets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'nft_token_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'transaction_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'owner_address',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'event_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'ticket_type_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'order_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'is_used',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'minted_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['event_id'],
            referencedTableName: 'events',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'tickets',
      new TableIndex({
        name: 'IDX_TICKETS_OWNER_ADDRESS',
        columnNames: ['owner_address'],
      }),
    );

    await queryRunner.createIndex(
      'tickets',
      new TableIndex({
        name: 'IDX_TICKETS_EVENT_ID',
        columnNames: ['event_id'],
      }),
    );

    await queryRunner.createIndex(
      'tickets',
      new TableIndex({
        name: 'IDX_TICKETS_NFT_TOKEN_ID',
        columnNames: ['nft_token_id'],
      }),
    );

    await queryRunner.createIndex(
      'tickets',
      new TableIndex({
        name: 'IDX_TICKETS_ORDER_ID',
        columnNames: ['order_id'],
      }),
    );

    await queryRunner.createIndex(
      'tickets',
      new TableIndex({
        name: 'IDX_TICKETS_IS_USED',
        columnNames: ['is_used'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tickets');
  }
}
