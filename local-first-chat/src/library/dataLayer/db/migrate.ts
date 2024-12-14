import { migrate } from 'drizzle-orm/pglite/migrator';
import { db } from '.';

// This will run migrations on the database
async function main() {
  console.log('Running migrations...');

  await migrate(db, {
    migrationsFolder: './drizzle',
  });

  console.log('Migrations complete!');

  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});
