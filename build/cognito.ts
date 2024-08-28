import {
  CognitoIdentityProvider,
  CognitoIdentityProviderClientConfig,
  CreateUserPoolCommand,
  CreateUserPoolCommandOutput,
  CreateUserPoolCommandInput,
  CreateUserPoolClientCommandInput,
  CreateUserPoolClientCommand,
  CreateGroupCommand,
  CreateGroupCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import fs from 'fs';
import path from 'path';

export const createCognito = async (
  config: CognitoIdentityProviderClientConfig,
): Promise<void> => {
  const cognito = new CognitoIdentityProvider(config);
  try {
    const file: string = path.resolve(
      `${__dirname}/../src/config/cognito/db/clients.json`,
    );
    await fs.promises.access(file, fs.constants.F_OK);
    const clientsFile = await import(file);
    const clients = Object.keys(clientsFile.Clients);

    if (clients.length) {
      return;
    }
  } catch (e) {
    process.stdout.write('No clients found. Making a cognito db');
    process.stdout.write(e);
    process.exit(1);
  }

  const pool: CreateUserPoolCommandInput = {
    PoolName: 'plymouth',
    Policies: {
      PasswordPolicy: {
        MinimumLength: 8, // Note: Changed from string to number
      },
    },
    UsernameAttributes: ['phone_number', 'email'],
    UsernameConfiguration: {
      CaseSensitive: false,
    },
    AliasAttributes: ['phone_number', 'email', 'preferred_username'],
    Schema: [
      {
        AttributeDataType: 'String',
        Mutable: true,
        Name: 'email',
        Required: true,
      },
      {
        AttributeDataType: 'String',
        Mutable: true,
        Name: 'phone_number',
        Required: false,
      },
      {
        AttributeDataType: 'String',
        Mutable: false,
        Name: 'preferred_username',
        Required: true,
        StringAttributeConstraints: {
          MaxLength: '20',
          MinLength: '2',
        },
      },
      {
        AttributeDataType: 'String',
        Mutable: true,
        Name: 'given_name',
        Required: false,
      },
      {
        AttributeDataType: 'String',
        Mutable: true,
        Name: 'family_name',
        Required: false,
      },
      {
        AttributeDataType: 'String',
        Mutable: true,
        Name: 'birthdate',
        Required: false,
      },
      {
        AttributeDataType: 'String',
        Mutable: true,
        Name: 'locale',
        Required: false,
      },
    ],
  };

  const poolCommand: CreateUserPoolCommand = new CreateUserPoolCommand(pool);
  const response: CreateUserPoolCommandOutput = await cognito.send(poolCommand);

  const client: CreateUserPoolClientCommandInput = {
    UserPoolId: response.UserPool.Id,
    ClientName: 'plymouth',
    GenerateSecret: true,
    EnableTokenRevocation: true,
    AllowedOAuthFlows: ['code', 'implicit', 'client_credentials'],
    SupportedIdentityProviders: [
      'COGNITO',
      'Facebook',
      'Google',
      'SignInWithApple',
    ],
    AllowedOAuthScopes: ['phone', 'email', 'openid', 'profile'],
  };

  const clientCommand: CreateUserPoolClientCommand =
    new CreateUserPoolClientCommand(client);
  await cognito.send(clientCommand);

  const consumerUserGroupParams: CreateGroupCommandInput = {
    UserPoolId: response.UserPool.Id,
    GroupName: 'CONSUMER_BASIC',
  };

  const plymouthAdminGroupParams: CreateGroupCommandInput = {
    UserPoolId: response.UserPool.Id,
    GroupName: 'PLYMOUTH_ADMIN',
  };

  const consumerUserGroupCommand: CreateGroupCommand = new CreateGroupCommand(
    consumerUserGroupParams,
  );
  await cognito.send(consumerUserGroupCommand);

  const plymouthAdminGroupCommand: CreateGroupCommand = new CreateGroupCommand(
    plymouthAdminGroupParams,
  );
  await cognito.send(plymouthAdminGroupCommand);

  const servicePool: CreateUserPoolCommandInput = {
    PoolName: 'plymouthservicepool',
    UsernameConfiguration: {
      CaseSensitive: false,
    },
  };

  const servicePoolCommand: CreateUserPoolCommand = new CreateUserPoolCommand(
    servicePool,
  );
  const serviceResponse: CreateUserPoolCommandOutput =
    await cognito.send(servicePoolCommand);

  const serviceClient: CreateUserPoolClientCommandInput = {
    UserPoolId: serviceResponse.UserPool.Id,
    ClientName: 'plymouthservicepoolclient',
    GenerateSecret: true,
    EnableTokenRevocation: true,
    AllowedOAuthFlows: ['client_credentials'],
    AllowedOAuthFlowsUserPoolClient: true,
    AllowedOAuthScopes: ['email:send'],
  };

  const serviceClientCommand: CreateUserPoolClientCommand =
    new CreateUserPoolClientCommand(serviceClient);
  await cognito.send(serviceClientCommand);

  const serviceUserGroupParams: CreateGroupCommandInput = {
    UserPoolId: serviceResponse.UserPool.Id,
    GroupName: 'SERVICE',
  };

  const serviceUserGroupCommand: CreateGroupCommand = new CreateGroupCommand(
    serviceUserGroupParams,
  );
  await cognito.send(serviceUserGroupCommand);
};
