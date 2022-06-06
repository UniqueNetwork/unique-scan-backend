export const retry = async (callback: () => Promise<any>, timeout = 3000) => {
  const now = Date.now();
  const repeat = async () => {
    try {
      return await callback();
    } catch (error) {
      if (Date.now() - now < timeout) {
        await repeat();
      } else {
        throw Error(
          `Repetition failed after ${timeout} seconds` +
            '\nCaused by: ' +
            error.message,
        );
      }
    }
  };

  return repeat();
};
