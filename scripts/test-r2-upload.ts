import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { randomBytes } from 'crypto';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

async function testUpload() {
  console.log('Generating presigned URL...');
  const fileKey = `test-${Date.now()}.pdf`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: 'application/pdf',
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  console.log('Presigned URL generated:', url);

  console.log('Creating 38MB dummy buffer...');
  // 38 MB buffer
  const buffer = randomBytes(38 * 1024 * 1024);

  console.log('Uploading 38MB file via PUT request...');
  const startTime = Date.now();
  
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
      },
      body: buffer,
    });

    console.log('Upload response status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Upload response body:', text);
    console.log(`Took ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error('Upload failed with exception:', error);
  }
}

testUpload();
