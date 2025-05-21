export const canRegister = (
  loggedUser_registration: number,
  registration_source: number
): boolean => {
  return loggedUser_registration === registration_source;
};
