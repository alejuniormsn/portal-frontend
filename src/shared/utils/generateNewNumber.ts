export const generateNewNumber = () => {
  const now = new Date();
  // Converte para UTC e aplica o offset de -03 (3 horas atrás)
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const adjustedTime = new Date(utcTime - 3 * 3600000);

  const isoDate = adjustedTime.toISOString().split("T");
  const time = isoDate[1].split(".");
  const num = `${isoDate[0].slice(2)}${time[1]}`;
  return num.replace(/[^0-9]/g, "");
};
