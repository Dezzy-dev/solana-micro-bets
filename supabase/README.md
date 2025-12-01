# Supabase Database Migrations

This directory contains SQL migration files for the Solana betting game database.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Get your connection details:**
   - Project URL
   - Anon/public key
   - Service role key (for server-side operations)

3. **Run migrations:**

   Using Supabase CLI:
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Link to your project
   supabase link --project-ref your-project-ref
   
   # Push migrations
   supabase db push
   ```

   Or manually via Supabase Dashboard:
   - Go to SQL Editor
   - Copy and paste the migration file contents
   - Execute the SQL

## Migration Files

### `20240101000000_create_bets_and_users_tables.sql`

Creates the initial database schema:
- **users** table: Stores user statistics (wins, losses, total earned)
- **bets** table: Stores individual bet records with outcomes and transaction signatures

## Environment Variables

Add these to your `.env` file:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Usage

See `backend/src/db/betHelpers.ts` for TypeScript helper functions to interact with these tables.

