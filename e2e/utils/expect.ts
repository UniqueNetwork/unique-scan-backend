import { retry } from './retry';
import { expect } from 'chai';

export const expectResponseContains = (
  request,
  objContains,
  timeout?: number,
) => {
  return retry(
    async () => {
      const response = await request();
      return expect(response).to.equals(objContains);
    },
    timeout ? timeout : 5000,
  );
};
