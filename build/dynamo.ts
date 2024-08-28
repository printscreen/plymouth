import {
  DynamoDBClient,
  CreateTableCommand,
  DeleteTableCommand,
  CreateTableCommandInput,
  DeleteTableCommandInput,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

export async function createDynamo(
  config: DynamoDBClientConfig,
): Promise<void> {
  const dynamodb = new DynamoDBClient(config);
  const tables: CreateTableCommandInput[] = [
    {
      TableName: 'account.email_verify',
      AttributeDefinitions: [
        {
          AttributeName: 'email',
          AttributeType: 'S',
        },
        {
          AttributeName: 'emailId',
          AttributeType: 'S',
        },
        {
          AttributeName: 'createdAt',
          AttributeType: 'N',
        },
      ],
      LocalSecondaryIndexes: [
        {
          IndexName: 'createdAtIndex',
          KeySchema: [
            {
              AttributeName: 'email',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'createdAt',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'KEYS_ONLY',
          },
        },
      ],
      KeySchema: [
        {
          AttributeName: 'email',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'emailId',
          KeyType: 'RANGE',
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
      },
    },
    {
      TableName: 'account.attributes',
      AttributeDefinitions: [
        {
          AttributeName: 'accountId',
          AttributeType: 'S',
        },
        {
          AttributeName: 'attribute',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'accountId',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'attribute',
          KeyType: 'RANGE',
        },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'attribute',
          KeySchema: [
            {
              AttributeName: 'attribute',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'accountId',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
      },
    },
  ];

  for await (const table of tables) {
    const createTableCommand = new CreateTableCommand(table);
    await dynamodb.send(createTableCommand);
  }
}

export async function destroyDynamo(
  config: DynamoDBClientConfig,
): Promise<void> {
  const dynamodb = new DynamoDBClient(config);
  const tables: DeleteTableCommandInput[] = [
    { TableName: 'account.email_verify' },
    { TableName: 'account.attributes' },
  ];

  for (const table of tables) {
    const deleteTableCommand = new DeleteTableCommand({
      TableName: table.TableName,
    });
    await dynamodb.send(deleteTableCommand);
  }
}
