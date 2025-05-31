# Database Setup Guide

This guide will help you set up the PostgreSQL database for the ticket system API.

## Prerequisites

1. **PostgreSQL installed** (version 12 or higher)
2. **Node.js and npm** installed
3. **Environment variables** configured

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your database settings:

```bash
cp env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=ticketing_system
DATABASE_SYNCHRONIZE=false
```

### 3. Create Database

Connect to PostgreSQL and create the database:

```sql
CREATE DATABASE ticketing_system;
```

### 4. Run Database Setup

```bash
npm run db:setup
```

This command will:

- Initialize the database connection
- Run all migrations
- Create the required tables
- Show you the created tables

## Manual Migration Commands

If you prefer to run migrations manually:

### Run Migrations

```bash
npm run migration:run
```

### Show Migration Status

```bash
npm run migration:show
```

### Revert Last Migration

```bash
npm run migration:revert
```

### Generate New Migration

```bash
npm run migration:generate src/migrations/YourMigrationName
```

### Create Empty Migration

```bash
npm run migration:create src/migrations/YourMigrationName
```

## Database Schema

### Events Table

- `id` (UUID, Primary Key)
- `name` (VARCHAR, NOT NULL)
- `description` (TEXT, NOT NULL)
- `location` (VARCHAR, NOT NULL)
- `organizer_name` (VARCHAR, NOT NULL)
- `date` (TIMESTAMP, NOT NULL)
- `logo_url` (VARCHAR, NULLABLE)
- `banner_url` (VARCHAR, NULLABLE)
- `categories` (TEXT, NULLABLE) - Stored as comma-separated string
- `total_tickets` (INTEGER, DEFAULT 0)
- `available_tickets` (INTEGER, DEFAULT 0)
- `status` (VARCHAR, DEFAULT 'draft')
- `created_at` (TIMESTAMP, DEFAULT NOW())
- `updated_at` (TIMESTAMP, DEFAULT NOW())

## Troubleshooting

### Connection Issues

1. Ensure PostgreSQL is running
2. Check your connection credentials in `.env`
3. Verify the database exists

### Migration Issues

1. Check if the database user has proper permissions
2. Ensure `uuid-ossp` extension is available
3. Run `npm run migration:show` to check migration status

### Reset Database

If you need to completely reset the database:

```bash
npm run db:reset
```

⚠️ **Warning**: This will drop all tables and data!

## Production Deployment

For production:

1. Set `NODE_ENV=production`
2. Use secure database credentials
3. Set `DATABASE_SYNCHRONIZE=false` (always!)
4. Run migrations before starting the application
5. Consider using connection pooling for better performance
