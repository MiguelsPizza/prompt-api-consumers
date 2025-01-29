/**
 * extensionBridge.ts
 *
 * This module handles communication with the background script or other extension
 * runtime via window.postMessage. It includes:
 *  - sending requests (bridge.send)
 *  - mapping request IDs to response listeners
 *  - listening for posted responses in the current window
 */

import { v4 as uuidv4 } from "uuid"
import { RequestID } from "window.ai"
import { PortName, PortRequest } from "~core/constants"
import { Result } from "~core/utils/result-monad"

/**
 * The shape of the message for requests
 */
export interface RequestMessage<P> {
  type: "Request"
  portName: PortName
  id: RequestID
  request: P
}

/**
 * The shape of the message for responses
 */
export interface ResponseMessage<R> {
  type: "Response"
  id: RequestID
  response: R
  portName: PortName
}

/**
 * A global map from (RequestID | null) to Sets of handlers.
 * Each handler processes the resulting data from that ID.
 */
const responseListeners = new Map<RequestID | null, Set<(data: any) => void>>()

/**
 * The main function to send requests to the background (or to oneself).
 * This function returns the unique requestId so that the caller can
 * attach a listener to the response.
 */
export function send<PN extends PortName>(
  portName: PN,
  payload: PortRequest[PN]["request"]
): RequestID {
  const requestId = uuidv4() as RequestID
  const msg: RequestMessage<typeof payload> = {
    type: "Request",
    portName,
    id: requestId,
    request: payload
  }
  window.postMessage(msg, "*")
  return requestId
}

/**
 * Attach a callback for responses keyed by a given requestId (or null to listen for all).
 */
export function onResponse<T extends Result<any, string>>(
  requestId: RequestID | null,
  handler: (data: T) => void
) {
  const handlers = responseListeners.get(requestId) || new Set<(data: T) => void>()
  handlers.add(handler)
  responseListeners.set(requestId, handlers)
}

/**
 * Listen for messages posted back into the current window.
 * If it's a well-formed response, call all relevant handlers.
 */
window.addEventListener("message", (event: MessageEvent<any>) => {
  const { source, data } = event
  if (source !== window) return
  if (!data || data.type !== "Response" || !data.portName) return

  const msg = data as ResponseMessage<any>
  const handlers = new Set([
    ...(responseListeners.get(msg.id) || []),
    ...(responseListeners.get(null) || [])
  ])
  if (handlers.size === 0) {
    console.warn(`No handlers found for request ${msg.id}`)
    return
  }
  handlers.forEach((h) => h(msg.response))
})
