import {
  S3Client,
  S3ClientConfig,
  CreateBucketCommand,
  CreateBucketCommandInput,
  DeleteBucketCommand,
  ListObjectsCommand,
  DeleteObjectCommand,
  DeleteBucketCommandInput,
} from '@aws-sdk/client-s3';

export async function createS3(config: S3ClientConfig): Promise<void> {
  const s3: S3Client = new S3Client(config);
  const buckets: CreateBucketCommandInput[] = [
    { Bucket: 'plymouth-development-avatar-pending' },
    { Bucket: 'plymouth-development' },
  ];

  for await (const bucket of buckets) {
    await s3.send(new CreateBucketCommand(bucket));
  }
}

export async function destroyS3(config: S3ClientConfig): Promise<void> {
  const s3: S3Client = new S3Client(config);

  const buckets: DeleteBucketCommandInput[] = [
    { Bucket: 'plymouth-development-avatar-pending' },
    { Bucket: 'plymouth-development' },
  ];

  for await (const bucket of buckets) {
    const { Contents } = await s3.send(new ListObjectsCommand(bucket));
    const contents = Contents ?? [];

    for await (const item of contents) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket.Bucket,
          Key: item.Key!,
        }),
      );
    }

    await s3.send(new DeleteBucketCommand(bucket));
  }
}
