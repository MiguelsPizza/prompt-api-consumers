import * as React from 'react'
import { Outlet, createRootRouteWithContext, useMatches } from '@tanstack/react-router'
import { RouterContext } from '../main'
import { Button } from '@/components/ui/button'
import { HomeIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-2">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">This page could not be found.</p>
        <Button asChild className="mt-4">
          <Link to="/">
            <HomeIcon className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    )
  },
})

function RootComponent() {
  const matches = useMatches()
  const currentMeta = matches.reduce<Required<RouterContext>['meta']>((acc, match) => ({
    ...acc,
    ...(match.context.meta || {})
  }), {})

  if (currentMeta.title) {
    document.title = `LFC - ${currentMeta.title}`
  }

  return (
    <React.Fragment>
      <Outlet />
    </React.Fragment>
  )
}