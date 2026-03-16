import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { env } from '../config/env.js';

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

interface LogEntry {
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

const sequenceTokenByStream: Record<string, string | undefined> = {};

async function sendToCloudWatch(entry: LogEntry): Promise<void> {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) return;

  const client = new CloudWatchLogsClient({ region: env.AWS_REGION });
  const logStreamName = `api-${new Date().toISOString().slice(0, 10)}`;
  const logGroupName = env.LOG_GROUP_NAME;

  try {
    try {
      await client.send(
        new CreateLogStreamCommand({
          logGroupName,
          logStreamName,
        })
      );
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err.name !== 'ResourceAlreadyExistsException') throw e;
    }

    const existing = await client.send(
      new DescribeLogStreamsCommand({
        logGroupName,
        logStreamNamePrefix: logStreamName,
        limit: 1,
      })
    );
    const uploadSequenceToken =
      sequenceTokenByStream[logStreamName] ??
      existing.logStreams?.[0]?.uploadSequenceToken;

    const event = {
      message: JSON.stringify(entry),
      timestamp: Date.now(),
    };

    const result = await client.send(
      new PutLogEventsCommand({
        logGroupName,
        logStreamName,
        logEvents: [event],
        sequenceToken: uploadSequenceToken,
      })
    );

    sequenceTokenByStream[logStreamName] = result.nextSequenceToken;
  } catch (err) {
    console.error('[Logger] CloudWatch send failed:', err);
  }
}

function formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = formatEntry(level, message, meta);
  const out = `${entry.timestamp} [${level.toUpperCase()}] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}`;
  if (level === 'error') console.error(out);
  else if (level === 'warn') console.warn(out);
  else console.log(out);

  if (env.NODE_ENV === 'production' && env.AWS_ACCESS_KEY_ID) {
    sendToCloudWatch(entry).catch(() => {});
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
};
