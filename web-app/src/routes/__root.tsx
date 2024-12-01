import * as React from 'react'
import { Outlet, createRootRouteWithContext, useMatches } from '@tanstack/react-router'
import { RouterContext } from '../main'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
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
