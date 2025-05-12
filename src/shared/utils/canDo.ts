export const canDo = (array: number[], code: number): boolean => {
  const hasItTrue: boolean[] = array.map((e) => {
    return e === code;
  });

  return hasItTrue.some((valor) => valor === true);
};
