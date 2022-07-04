export const handleResponse = (response) => {
  if (response.data.errors) {
    throw Error(response.data.errors.map((e) => e.message).join());
  }
  return response.data;
};
