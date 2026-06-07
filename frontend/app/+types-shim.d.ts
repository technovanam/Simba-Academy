// This project uses React Router's route type generation (`./+types/*` imports).
// In environments where the generated files are not present, we provide a minimal shim
// so `tsc` can still typecheck the app code.

declare module "./+types/*" {
  export namespace Route {
    export type MetaArgs = any;
    export type LinksFunction = any;
    export type ErrorBoundaryProps = any;
  }
}

declare module "../+types/*" {
  export namespace Route {
    export type MetaArgs = any;
    export type LinksFunction = any;
    export type ErrorBoundaryProps = any;
  }
}

