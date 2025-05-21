// Expressão regular para validar números de telefone celular brasileiros
export const validatedPhone = (telefone: string): boolean => {
  const regex = /^\(?\d{2}\)?[-. ]?\d{5}[-. ]?\d{4}$/;
  return regex.test(telefone);
};
