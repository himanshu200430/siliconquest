import type { ReactNode } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: { [prop: string]: unknown; children?: ReactNode };
    }
  }
}

export {};
