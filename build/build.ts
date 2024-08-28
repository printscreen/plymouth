import { createCognito } from './cognito';
import { createDynamo } from './dynamo';
import { createS3 } from './s3';
import { CognitoIdentityProviderClientConfig } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { S3ClientConfig } from '@aws-sdk/client-s3';

async function build() {
  const cognitoConfig: CognitoIdentityProviderClientConfig = {
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    },
    endpoint: 'http://cognito.localhost:9229',
    region: 'us-east-1',
  };
  await createCognito(cognitoConfig);

  const dynamoConfig: DynamoDBClientConfig = {
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    },
    endpoint: 'http://dynamo.localhost:8000',
    region: 'us-east-1',
  };
  await createDynamo(dynamoConfig);

  const s3Config: S3ClientConfig = {
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    },
    forcePathStyle: true,
    endpoint: 'http://s3.localhost:4569',
    region: 'us-east-1',
  };
  await createS3(s3Config);
}

build()
  .then(function () {
    process.stdout.write('Done building aws');
  })
  .catch(function (error) {
    process.stdout.write('Error building aws');
    process.stdout.write(JSON.stringify(error));
  });
