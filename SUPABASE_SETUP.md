# Supabase Setup Guide

This guide will help you set up Supabase for the Evo2 Pathogenicity Analysis application.

## Prerequisites

- A Supabase account and project (create one at https://supabase.com)
- Your Supabase project URL and API keys

## Step 1: Create Database Tables

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-migration.sql`
4. Run the migration script

This will create:
- `sessions` table: Stores analysis sessions
- `predictions` table: Stores Evo2 variant predictions
- Indexes for better query performance
- Row Level Security (RLS) policies

## Step 2: Configure Environment Variables

Create a `.env.local` file in the `prototype` directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Where to find these values:

1. **NEXT_PUBLIC_SUPABASE_URL**: 
   - Go to Project Settings → API
   - Copy the "Project URL"

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: 
   - Go to Project Settings → API
   - Copy the "anon public" key

3. **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY**: 
   - This is typically the same as the anon key, or you can use the anon key

4. **SUPABASE_SERVICE_ROLE_KEY**: 
   - Go to Project Settings → API
   - Copy the "service_role" key (⚠️ Keep this secret! Never expose it in client-side code)

## Step 3: Verify Setup

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `http://localhost:3000/dashboard`
3. Try creating a new session
4. Open the session and run a variant analysis
5. Check your Supabase dashboard to verify data is being saved

## Features

### Sessions
- Create, rename, and delete analysis sessions
- Auto-save session state (selected gene, assembly)
- Persistent across browser sessions

### Predictions
- All Evo2 predictions are automatically saved
- Linked to their parent session
- Queryable via the API

### Dashboard
- View all your analysis sessions
- Quick access to recent sessions
- Create new sessions with custom names

## Security Notes

The current RLS policies allow public access. For production:

1. Enable Supabase Authentication
2. Update the RLS policies in `supabase-migration.sql` to restrict access to authenticated users
3. Update the API routes to use authenticated user IDs

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure your `.env.local` file exists in the `prototype` directory
- Verify all environment variables are set correctly
- Restart your development server after adding environment variables

### "Failed to fetch sessions"
- Check that the migration script ran successfully
- Verify your Supabase project is active
- Check browser console for detailed error messages

### Predictions not saving
- Verify the session ID is being passed correctly
- Check Supabase logs for any errors
- Ensure the `predictions` table was created with the correct schema

