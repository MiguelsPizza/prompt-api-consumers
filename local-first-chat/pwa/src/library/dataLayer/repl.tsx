import { usePGlite } from '@electric-sql/pglite-react';
import { Repl } from '@electric-sql/pglite-repl';

const SHOW_REPL = false

export default function ReplWDb() {
  const db = usePGlite();
  if (!SHOW_REPL) return false
  return (
    <>
      <Repl pg={db} />
    </>
  );
}
