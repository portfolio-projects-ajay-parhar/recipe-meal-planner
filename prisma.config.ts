import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Migrations use a direct/session connection (Supabase: port 5432),
    // because the transaction pooler on 6543 can't create shadow databases.
    url: process.env.DIRECT_URL ?? env('DATABASE_URL'),
  },
});
