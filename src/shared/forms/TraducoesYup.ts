import { setLocale } from "yup";

setLocale({
  mixed: {
    default: () => "Campo não é válido",
    required: () => "O campo é obrigatório",
    oneOf: () => "deve ser um dos seguintes valores: ${values}",
    notOneOf: () => "não pode ser um dos seguintes valores: ${values}",
    defined: () => "Selecione uma das opções",
    notType: ({ type }) =>
      type === "number" ? "Valor inválido ou não preenchido" : "Valor inválido",
  },
  string: {
    email: () => "O campo precisa conter um email válido",
    max: ({ max }) => `O campo pode ter no máximo ${max} caracteres`,
    min: ({ min }) => `O campo precisa ter pelo menos ${min} caracteres`,
    url: () => "deve ter um formato de URL válida",
    trim: () => "não deve conter espaços no início ou no fim",
    lowercase: () => "deve estar em maiúsculo",
    uppercase: () => "deve estar em minúsculo",
    length: ({ length }) =>
      `O campo precisa ter exatamente ${length} caracteres`,
  },
  date: {
    max: ({ max }) => `A data deve ser menor que ${max}`,
    min: ({ min }) => `A data deve ser maior que ${min}`,
  },
  number: {
    integer: () => "O campo precisa ter um valor inteiro",
    negative: () => "O campo precisa ter um valor negativo",
    positive: () => "O campo precisa ter um valor positivo",
    moreThan: ({ more }) => `O campo precisa ter um valor maior que ${more}`,
    lessThan: ({ less }) => `O campo precisa ter um valor menor que ${less}`,
    min: ({ min }) =>
      `O campo precisa ter um valor com mais de ${min} caracteres`,
    max: ({ max }) =>
      `O campo precisa ter um valor com menos de ${max} caracteres`,
  },
  boolean: {},
  object: {},
  array: {
    max: ({ max }) => `deve ter no máximo ${max} itens`,
    min: ({ min }) => `deve ter no mínimo ${min} itens`,
  },
});
