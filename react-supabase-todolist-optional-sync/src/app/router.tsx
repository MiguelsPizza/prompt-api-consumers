import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import LoginPage from './auth/login/page';
import RegisterPage from './auth/register/page';
import EntryPage from './page';
import React from 'react';
import ChatInterface from './views/ChatInterface';

const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null // Render nothing in production
    : React.lazy(() =>
      // Lazy load in development
      import('@tanstack/router-devtools').then((res) => ({
        default: res.TanStackRouterDevtoolsPanel,
      })),
    )

// Define root route
const rootRoute = createRootRoute({
  component: () => {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
      <>
        <Outlet />
        <div style={{ position: 'fixed', bottom: 10, right: 10 }}>
          <button onClick={() => setIsOpen((prev) => !prev)}>
            Dev Tools
          </button>
        </div>
        {isOpen && <TanStackRouterDevtools setIsOpen={setIsOpen} isOpen={isOpen} />}
      </>
    )
  },
});

// Define child routes
const entryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: EntryPage,
});

const ChatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat',
  component: ChatInterface,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/login',
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/register',
  component: RegisterPage,
});
// Create route tree
const routeTree = rootRoute.addChildren([
  entryRoute,
  loginRoute,
  registerRoute,
  ChatRoute
]);

// Create router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default router;
