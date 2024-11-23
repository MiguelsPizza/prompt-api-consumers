import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import LoginPage from '@/app/auth/login/page';
import RegisterPage from '@/app/auth/register/page';
import EntryPage from '@/app/page';
import TodoEditPage from '@/app/views/todo-lists/edit/page';
import TodoListsPage from '@/app/views/todo-lists/page';
import ViewsLayout from '@/app/views/layout';
import SQLConsolePage from '@/app/views/sql-console/page';
import React from 'react';

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
  component: () => (
    <>
      <ViewsLayout>
        <Outlet />
      </ViewsLayout>
      <TanStackRouterDevtools setIsOpen={() =>{}} />
    </>
  ),
});

// Define child routes
const entryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: EntryPage,
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

const todoListsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/views/todo-lists',
  component: TodoListsPage,
});

const todoEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/views/todo-lists/:id',
  component: TodoEditPage,
});

const sqlConsoleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sql-console',
  component: SQLConsolePage,
});

// Create route tree
const routeTree = rootRoute.addChildren([
  entryRoute,
  loginRoute,
  registerRoute,
  todoListsRoute,
  todoEditRoute,
  sqlConsoleRoute,
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
