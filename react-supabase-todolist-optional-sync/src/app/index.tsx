import { createRoot } from 'react-dom/client';
import { SystemProvider } from '@/components/providers/SystemProvider';
import { ThemeProviderContainer } from '@/components/providers/ThemeProviderContainer';
import router from '@/app/router';
import { RouterProvider } from '@tanstack/react-router';

const root = createRoot(document.getElementById('app')!);
root.render(<App />);

export function App() {
  return (
    <ThemeProviderContainer>
      <SystemProvider>
        <RouterProvider router={router} />
      </SystemProvider>
    </ThemeProviderContainer>
  );
}
