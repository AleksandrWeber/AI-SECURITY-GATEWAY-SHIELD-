import * as core from '@actions/core';
import { runAction } from './run.js';

runAction().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  core.setFailed(message);
});
