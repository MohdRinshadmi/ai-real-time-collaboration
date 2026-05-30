import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Worker, type Job } from 'bullmq';

import { connection } from './connection';

export type EmailJob = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const ses = new SESClient({ region: process.env.SES_REGION ?? 'us-east-1' });

// Idempotent: jobId derived from a deterministic hash by the producer.
// Retries: exponential, max 5 — SES occasionally throttles.
export function registerEmailWorker() {
  return new Worker<EmailJob>(
    'email',
    async (job: Job<EmailJob>) => {
      const { to, subject, html, text } = job.data;
      await ses.send(
        new SendEmailCommand({
          Source: process.env.EMAIL_FROM ?? 'noreply@example.com',
          Destination: { ToAddresses: [to] },
          Message: {
            Subject: { Data: subject },
            Body: {
              Html: { Data: html },
              Text: text ? { Data: text } : undefined,
            },
          },
        }),
      );
    },
    {
      connection,
      concurrency: 50,
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  );
}
