export const usedName = (
  name: string | null | undefined,
  registration: number | null | undefined
) => {
  if (name && registration) {
    const split_str = name.split(" ");
    const strName = `${split_str[0]} ${
      split_str[split_str.length - 1]
    } (${registration})`;
    return strName;
  }
  return "";
};

export const strName = (name: string | null | undefined) => {
  if (name) {
    const split_str = name.split(" ");
    const strName = `${split_str[0]} ${split_str[split_str.length - 1]}`;
    return strName;
  }
  return "";
};
