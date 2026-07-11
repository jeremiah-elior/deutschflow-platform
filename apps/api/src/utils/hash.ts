import { createHash } from 'node:crypto';

export function sha256Buffer(input: Buffer | string) {
  return createHash('sha256').update(input).digest('hex');
}
