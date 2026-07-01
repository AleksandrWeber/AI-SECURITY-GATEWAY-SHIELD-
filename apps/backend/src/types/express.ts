import type { TeamRecord } from '@shield/types';

declare global {
  namespace Express {
    interface Request {
      team?: Pick<TeamRecord, 'id' | 'name' | 'slug'>;
      teamApiKeyId?: string;
    }
  }
}

export {};
