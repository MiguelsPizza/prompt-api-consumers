import PWABadge from './PWABadge.tsx';
import PromptApiPlayground from './PromptApiPlayground.tsx';
import { Toaster } from './components/ui/toaster.tsx';

function App() {
  return (
    <>
      <PromptApiPlayground />
      <PWABadge />
      <Toaster />
    </>
  );
}

export default App;
