type access = {
  dpto: number;
  level: number;
};

export const canAccess = (
  access: access[],
  cod_department: number
): boolean => {
  const hasItTrue: number[] = access.map((e) => {
    if (e.dpto === cod_department) {
      return e.level;
    } else {
      return 0;
    }
  });

  return hasItTrue.some((valor) => valor === 1);
};
