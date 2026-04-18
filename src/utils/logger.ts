type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const IS_DEV = import.meta.env.DEV;

function log(level: LogLevel, ctx: string, msg: string, data?: unknown): void {
  if (!IS_DEV && level === 'debug') return;
  const args: unknown[] = [`[TIVE:${ctx}]`, msg];
  if (data !== undefined) args.push(data);
  console[level](...args);
  // Future hook: reportToSentry(level, ctx, msg, data)
}

export const logger = {
  debug: (ctx: string, msg: string, data?: unknown) => log('debug', ctx, msg, data),
  info:  (ctx: string, msg: string, data?: unknown) => log('info',  ctx, msg, data),
  warn:  (ctx: string, msg: string, data?: unknown) => log('warn',  ctx, msg, data),
  error: (ctx: string, msg: string, data?: unknown) => log('error', ctx, msg, data),
};
