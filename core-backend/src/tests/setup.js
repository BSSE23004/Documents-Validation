import dotenv from 'dotenv';
import { jest } from '@jest/globals';

dotenv.config({
  path: '.env.test',
  override: true,
});

jest.setTimeout(30000);