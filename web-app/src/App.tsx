import PWABadge from './PWABadge.tsx';
import PromptApiPlayground from './PromptApiPlayground.tsx';
import { Toaster } from './components/ui/toaster.tsx';
import { AICapabilitiesProvider } from 'use-prompt-api';


function App() {
  return (
    <AICapabilitiesProvider>
      <PromptApiPlayground />
      <PWABadge />
      <Toaster />
    </AICapabilitiesProvider>
  );
}

export default App;
