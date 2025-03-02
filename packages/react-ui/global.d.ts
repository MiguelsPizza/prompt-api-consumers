/**
 * This file is needed to fix TypeScript errors with react-markdown
 * See: https://github.com/remarkjs/react-markdown/issues/877
 */
import type { JSX as Jsx } from 'react/jsx-runtime';

declare global {
  namespace JSX {
    type ElementClass = Jsx.ElementClass;
    type Element = Jsx.Element;
    type IntrinsicElements = Jsx.IntrinsicElements;
  }
}
