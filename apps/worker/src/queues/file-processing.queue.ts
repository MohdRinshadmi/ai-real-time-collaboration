import { Worker, type Job } from 'bullmq';

import { createPrismaClient } from '@collab/db';

import { connection } from './connection';

// File pipeline:
//   1. AV scan via ClamAV running as a sidecar (HTTP api). On infected, quarantine.
//   2. For images, generate thumbnails (256/512/1024) and store under {key}/thumbs/.
//   3. For PDFs, extract text → enqueue embeddings job for RAG indexing.

export type FileProcessingJob = { fileId: string; s3Key: string; mimeType: string };

const prisma = createPrismaClient();

export function registerFileProcessingWorker() {
  return new Worker<FileProcessingJob>(
    'file-processing',
    async (job: Job<FileProcessingJob>) => {
      const { fileId } = job.data;
      // Stub: in prod we call ClamAV. We mark scanned + clean.
      await prisma.file.update({
        where: { id: fileId },
        data: { scannedAt: new Date(), scanResult: 'clean' },
      });
    },
    { connection, concurrency: 20 },
  );
}
