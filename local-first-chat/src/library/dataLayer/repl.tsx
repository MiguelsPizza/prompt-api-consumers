import { usePGlite } from '@electric-sql/pglite-react';
import { Repl } from '@electric-sql/pglite-repl';

export default function ReplWDb() {
  const db = usePGlite();
  return (
    <>
      <Repl pg={db} />
    </>
  );
}
