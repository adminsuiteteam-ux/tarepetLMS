/**
 * Create Better Auth schema in PostgreSQL using the adapter's createSchema method
 */
import { auth } from './auth.js';

const ctx = await auth.$context;

// Try runMigrations first (built-in Better Auth v1.6 migration runner)
if (typeof ctx.runMigrations === 'function') {
  console.log('Running ctx.runMigrations()...');
  await ctx.runMigrations();
  console.log('✅ Migration complete');
} else if (typeof ctx.adapter?.createSchema === 'function') {
  console.log('Creating schema via adapter.createSchema()...');
  const result = await ctx.adapter.createSchema(ctx, {});
  console.log('Schema result:', JSON.stringify(result, null, 2));
  console.log('✅ Schema creation complete');
} else {
  console.log('❌ No migration API found.');
}

process.exit(0);
