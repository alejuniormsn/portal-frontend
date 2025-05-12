export const formatCpf = (cpf: string | number | null): string => {
  if (cpf) {
    return cpf
      .toString()
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return "";
};

export const formatRg = (rg: string | number | null): string => {
  if (rg) {
    return rg.toString().replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return "";
};

export const formatPhone = (phone: string | number | null): string => {
  if (phone) {
    const regex = /^([0-9]{2})([0-9]{4,5})([0-9]{4})$/;
    const result = phone
      .toString()
      .replace(/[^0-9]/g, "")
      .slice(0, 11);
    return result.replace(regex, "($1) $2-$3");
  }
  return "";
};

export const onlyNumbers = (data: string | null | undefined): string => {
  if (data) {
    return data.replace(/[^0-9]/g, "");
  }
  return "";
};
