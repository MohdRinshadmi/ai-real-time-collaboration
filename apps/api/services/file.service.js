import { randomUUID } from 'node:crypto';

import config from '../config';
import { withWorkspace } from '../models';
import { badRequest } from '../utils/app-error';

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

// Presigned uploads: we issue a short-lived S3 PUT URL scoped to a specific
// key, content-type, and max size. The client uploads directly to S3 — our API
// never touches the bytes. After upload, the client confirms and we register
// the file (and trigger an AV scan via the worker queue).
//
// In a real implementation this uses @aws-sdk/s3-request-presigner — the stub
// returns a fake URL so the wiring is clear without the SDK dependency here.
export async function createUploadUrl(input) {
  if (input.sizeBytes > MAX_BYTES) {
    throw badRequest('file too large (max 100MB)');
  }

  const bucket = config.S3_BUCKET;
  const key = `${input.workspaceId}/${randomUUID()}-${input.filename}`;

  const file = await withWorkspace(input.workspaceId, (tx) =>
    tx.file.create({
      data: {
        workspaceId: input.workspaceId,
        uploadedBy: input.uploadedBy,
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: BigInt(input.sizeBytes),
        s3Key: key,
        s3Bucket: bucket,
        scanResult: 'pending',
      },
    }),
  );

  // Real implementation: presign via aws-sdk.
  const uploadUrl = `https://${bucket}.s3.amazonaws.com/${key}?stub=true`;
  return { fileId: file.id, uploadUrl, key };
}
