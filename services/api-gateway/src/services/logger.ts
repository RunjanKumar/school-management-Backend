import { createLogger } from '@school/common';

export const logger: ReturnType<typeof createLogger> = createLogger('api-gateway');
