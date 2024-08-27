import { Schema } from 'dynamoose';

export const TABLE_NAME: string = 'account.email_verify';
export const CREATED_AT_LOCAL_SECONDARY_INDEX: string = 'createdAtIndex';
export const EMAIL_CREATION_WAIT_TIME: number = 2;
export const VerifyEmailSchema = new Schema({
  email: {
    type: String,
    hashKey: true,
  },
  emailId: {
    type: String,
    rangeKey: true,
  },
  code: {
    type: String,
  },
  verified: {
    type: Boolean,
  },
  // Epoch in milliseconds
  createdAt: {
    type: Number,
  },
  // Epoch in milliseconds
  updatedAt: {
    type: Number,
  },
  ttl: {
    type: Number,
  },
});

export interface VerifyEmailKey {
  email: string;
  emailId: string;
}

export interface VerifyEmail extends VerifyEmailKey {
  email: string;
  emailId: string;
  code: string;
  verified: boolean;
  // Epoch in milliseconds
  createdAt: number;
  // Epoch in milliseconds
  updatedAt: number;
  ttl: number;
}
