import { expect } from 'chai';

export const expectResponseContains = async (
  request,
  objContains,
  timeout = 30000,
) => {
  const now = Date.now();
  while (true) {
    try {
      const response = await request();
      return expect(response).to.include(objContains);
    } catch (error) {
      if (Date.now() - now >= timeout) {
        throw Error(
          `Repetition failed after ${timeout} seconds` +
            '\nCaused by: ' +
            error.message,
        );
      }
    }
  }
};
