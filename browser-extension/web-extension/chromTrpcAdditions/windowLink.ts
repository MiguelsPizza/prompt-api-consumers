// windowLink.ts
import { TRPCClientError, TRPCLink } from '@trpc/client';
import { AnyRouter } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { WindowRequest, WindowResponse } from '../types';

export interface WindowLinkConfig {
  /**
   * If true, shows debug logs when sending / receiving messages.
   */
  debug?: boolean;

  /**
   * If true, measures how long each request/response cycle took.
   */
  trackRequestTime?: boolean;

  /**
   * If true, only accept messages from the current origin.
   */
  enforceSameOrigin?: boolean;
}

export function windowLink<TRouter extends AnyRouter>(): TRPCLink<TRouter> {
  return (runtime) => {
    return ({ op }) => {
      const { id, type, path, input } = op;
      return observable((observer) => {
        /**
         * 1. Listen for one or more response messages with matching "id"
         */
        function handleMessage(evt: MessageEvent<WindowResponse>) {
          const msg = evt.data?.trpc;
          if (!msg || msg.id !== id) return; // not for us

          // if there's an error
          if (typeof msg.error !== 'undefined') {
            observer.error(
              // re-create a TRPCClientError
              TRPCClientError.from(msg as any),
            );
            return;
          }

          // if there's a result
          if (msg.result) {
            const { type: resultType, data } = msg.result;
            if (!resultType || resultType === 'data') {
              // standard data payload
              observer.next({
                result: {
                  type: 'data',
                  // pass it through the output deserializer
                  data: runtime.transformer.deserialize(data),
                },
              });
              // If it’s a query or mutation, we complete right away
              if (op.type !== 'subscription') {
                observer.complete();
              }
            } else if (resultType === 'started') {
              // subscription established
            } else if (resultType === 'stopped') {
              // subscription ended
              observer.complete();
            }
          }
        }

        window.addEventListener('message', handleMessage);

        /**
         * 2. Send the request to the content script
         */
        try {
          const serializedInput = runtime.transformer.serialize(input);
          const requestPayload: WindowRequest = {
            trpc: {
              id,
              jsonrpc: '2.0',
              method: type,
              params: {
                path,
                input: serializedInput,
              },
            },
          };
          window.postMessage(requestPayload, '*');
        } catch (cause) {
          observer.error(
            cause instanceof Error
              ? new TRPCClientError(cause.message)
              : new TRPCClientError('Unknown serialization error'),
          );
        }

        /**
         * 3. Teardown function
         */
        return () => {
          window.removeEventListener('message', handleMessage);
          // If it's a subscription, send "subscription.stop"
          if (type === 'subscription') {
            const stopPayload: WindowRequest = {
              trpc: {
                id,
                jsonrpc: '2.0',
                method: 'subscription.stop',
              },
            };
            window.postMessage(stopPayload, '*');
          }
        };
      });
    };
  };
}