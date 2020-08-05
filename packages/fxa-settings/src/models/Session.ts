import type { hexstring } from '../lib/types';

export interface Session {
  verified: boolean;
  token: hexstring;
}
