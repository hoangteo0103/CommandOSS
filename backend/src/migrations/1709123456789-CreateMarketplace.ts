import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateMarketplace1709123456789 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create marketplace_listings table
    await queryRunner.createTable(
      new Table({
        name: 'marketplace_listings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'ticket_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'seller_address',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'buyer_address',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'listing_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'original_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'sold', 'cancelled', 'expired'],
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'transaction_hash',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'sale_transaction_hash',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'sold_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'cancelled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_hot',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
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
            columnNames: ['ticket_id'],
            referencedTableName: 'tickets',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'marketplace_listings',
      new TableIndex({
        name: 'IDX_MARKETPLACE_STATUS_CREATED',
        columnNames: ['status', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'marketplace_listings',
      new TableIndex({
        name: 'IDX_MARKETPLACE_PRICE',
        columnNames: ['listing_price'],
      }),
    );

    await queryRunner.createIndex(
      'marketplace_listings',
      new TableIndex({
        name: 'IDX_MARKETPLACE_CATEGORY',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'marketplace_listings',
      new TableIndex({
        name: 'IDX_MARKETPLACE_SELLER',
        columnNames: ['seller_address'],
      }),
    );

    await queryRunner.createIndex(
      'marketplace_listings',
      new TableIndex({
        name: 'IDX_MARKETPLACE_TICKET',
        columnNames: ['ticket_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('marketplace_listings');
  }
}
