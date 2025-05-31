import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'eventify',
  ssl: true,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: true,
});

async function setupDatabase() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();

    console.log('🔄 Running migrations...');
    await AppDataSource.runMigrations();

    console.log('✅ Database setup completed successfully!');
    console.log('📋 Available tables:');

    const queryRunner = AppDataSource.createQueryRunner();
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });

    await queryRunner.release();
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

setupDatabase();
