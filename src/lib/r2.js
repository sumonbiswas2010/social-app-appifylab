import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { AppError } from './errors';

const ALLOWED = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const MAX_SIZE = 5 * 1024 * 1024;

const globalRef = globalThis;
function client() {
  if (!globalRef.__r2) {
    globalRef.__r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return globalRef.__r2;
}

// Validates and uploads an image File, returns its public URL
export async function uploadImage(file, folder = 'posts') {
  const ext = ALLOWED[file.type];
  if (!ext) throw new AppError('Only jpeg, png, webp or gif images are allowed', 422);
  if (file.size > MAX_SIZE) throw new AppError('Image must be smaller than 5MB', 422);

  const key = `${folder}/${crypto.randomUUID()}.${ext}`;
  const body = Buffer.from(await file.arrayBuffer());
  await client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: file.type,
    })
  );
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
