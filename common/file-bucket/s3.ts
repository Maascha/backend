import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { assert } from 'console';

export const AWS_BUCKET_ENDPOINT = process.env.AWS_BUCKET_ENDPOINT;
export const DEFAULT_BUCKET = process.env.AWS_DEFAULT_BUCKET;
export const ATTACHMENT_BUCKET = process.env.AWS_ATTACHMENT_BUCKET;

/// The domain that can be used to access the files in the bucket
export const ACCESS_DOMAIN_NAME = DEFAULT_BUCKET && AWS_BUCKET_ENDPOINT ? `${DEFAULT_BUCKET}.${AWS_BUCKET_ENDPOINT}` : undefined;

/// The default s3 endpoint
const s3Endpoint = AWS_BUCKET_ENDPOINT ? `https://${AWS_BUCKET_ENDPOINT}` : undefined;

/// Returns the default s3 instance
export const s3 = new S3Client({
    ...(s3Endpoint && { endpoint: s3Endpoint }),
    region: process.env.AWS_REGION,
});

/// Returns a URL for a given key (it is not ensured whether the file for that key exists or is even publicly accessible)
export function accessURLForKey(key: string) {
    assert(
        ACCESS_DOMAIN_NAME,
        `Cannot create access URL for key ${key} because the ACCESS_DOMAIN_NAME is undefined. Please consider setting the appropriate environment variables to make the file bucket work.`
    );
    return `https://${ACCESS_DOMAIN_NAME}/${key}`;
}

export async function generatePresignedURL(key: string, bucket: string) {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(s3, cmd, { expiresIn: 3600 });
}
