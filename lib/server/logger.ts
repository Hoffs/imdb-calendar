import bunyan from 'bunyan';
import { LoggingBunyan } from '@google-cloud/logging-bunyan';
import { AsyncLocalStorage } from 'async_hooks';
import uniqid from 'uniqid';
import { UserError } from 'lib/graphql/user_error';
import { GetServerSideProps, NextApiRequest, NextApiResponse } from 'next';
import { GqlContext } from 'lib/graphql/resolvers';

let loggerInstance: bunyan | undefined;
function initLogger(): bunyan {
  let privateKey = process.env.FIREBASE_SVC_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const loggingBunyan = new LoggingBunyan({
    projectId: process.env.FIREBASE_SVC_PROJECT_ID,
    credentials: {
      client_email: process.env.FIREBASE_SVC_CLIENT_EMAIL,
      private_key: privateKey,
    },
  });

  loggerInstance = bunyan.createLogger({
    name: 'imdb-calendar',
    streams: [
      { stream: process.stdout, level: 'info' },
      loggingBunyan.stream('info'),
    ],
  });

  return loggerInstance;
}

export function logger(): bunyan {
  if (!loggerInstance) {
    return initLogger();
  }

  return loggerInstance;
}

let ctxLoggerInstance: CtxLogger | undefined;
export function ctxLogger(): CtxLogger {
  if (!ctxLoggerInstance) {
    const baseLogger = initLogger();
    ctxLoggerInstance = new CtxLogger(baseLogger);
    return ctxLoggerInstance;
  }

  return ctxLoggerInstance;
}

export type LogCtx = RootCtx & {
  labels?: LabelsCtx;
};

export type RootCtx = {
  err?: unknown;
  [key: string]: string | Record<string, unknown> | undefined | unknown;
};

export type LabelsCtx = {
  [key: string]: string | undefined;
};

// Use only "labels" since labels can be used as filters, any other context
// data should just exist in payload.
export const store = new AsyncLocalStorage<LabelsCtx>();

// It would be nice to have this "scoped", where it would be possible
// to dispose which would also remove the thing from the store once
// some scope is exited, akin to how it works in C#. That makes it
// easy to include properties in the scope and have the properties
// be removed "automatically" at the end of the scope.
export const updateStore = (ctx: LabelsCtx): void => {
  const s = store.getStore();
  if (s) {
    for (const x in ctx) {
      s[x] = ctx[x];
    }
  }
};

process.on('unhandledRejection', (error) => {
  logger().error(
    { labels: { ...store.getStore() }, error: String(error) },
    'unhandled rejection',
  );
});

export const newStoreCtx = (init?: LabelsCtx): LabelsCtx => {
  init ??= {};
  init.log_id = uniqid();
  return init;
};

export class CtxLogger {
  logger: bunyan;

  constructor(cLogger?: bunyan) {
    this.logger = cLogger || logger();
  }

  error(message: string): void {
    this.logger.error(CtxLogger.makeCtx(), message);
  }

  errorCtx(ctx: RootCtx, message?: string): void {
    this.logger.error(CtxLogger.makeCtx(ctx), message);
  }

  info(message: string): void {
    this.logger.info(CtxLogger.makeCtx(), message);
  }

  infoCtx(ctx: RootCtx, message: string): void {
    this.logger.info(CtxLogger.makeCtx(ctx), message);
  }

  private static makeCtx(ctx?: RootCtx): LogCtx {
    const localStore = store.getStore();
    // arguments.callee.name would be great to include caller function, but its not allowed since ES5
    if (ctx) {
      return {
        ...ctx,
        labels: { ...localStore },
      };
    } else {
      return {
        labels: { ...localStore },
      };
    }
  }
}

export const runWithCtx = <T>(
  logger: CtxLogger,
  ctx: LabelsCtx,
  fn: () => Promise<T>,
): Promise<T> => {
  return store.run(ctx, async () => {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof UserError)) {
        logger.errorCtx({ err: err });
      }

      throw err;
    }
  });
};

// Middleware for Next.js API
type NextApiExtendedFn<T> = (
  logger: CtxLogger,
  req: NextApiRequest,
  res: NextApiResponse<T>,
) => Promise<void>;
type NextApiFn<T> = (
  req: NextApiRequest,
  res: NextApiResponse<T>,
) => Promise<void>;

export function withCtx<T>(handler: NextApiExtendedFn<T>): NextApiFn<T> {
  return (req: NextApiRequest, res: NextApiResponse<T>): Promise<void> => {
    const log = ctxLogger();

    return runWithCtx(log, newStoreCtx(), async () => {
      try {
        await handler(log, req, res);
      } catch (err) {
        if (!(err instanceof UserError)) {
          log.errorCtx({ err: err });
        }

        throw err;
      }
    });
  };
}

// Middleware for Graphql
type GraphqlFn<TIn, TOut> = (
  _parent: unknown,
  input: TIn,
  gqlCtx: GqlContext,
) => Promise<TOut>;

export function withCtxGql<TIn, TOut>(
  name: string,
  handler: GraphqlFn<TIn, TOut>,
): GraphqlFn<TIn, TOut> {
  const wrapped: GraphqlFn<TIn, TOut> = (p, input, gqlCtx) => {
    return runWithCtx(
      gqlCtx.logger,
      newStoreCtx({ initiator: `graphql#${name}`, uid: gqlCtx.user.uid }),
      async () => {
        return await handler(p, input, gqlCtx);
      },
    );
  };

  Object.defineProperty(wrapped, 'name', { value: name });

  return wrapped;
}

// Middleware for Next.js Page
export function withCtxPage(fn: GetServerSideProps): GetServerSideProps {
  return (context) => {
    const log = ctxLogger();

    return runWithCtx(
      log,
      newStoreCtx({ url: context.resolvedUrl }),
      async () => {
        try {
          return await fn(context);
        } catch (err) {
          if (!(err instanceof UserError)) {
            log.errorCtx({ err: err });
          }

          throw err;
        }
      },
    );
  };
}
