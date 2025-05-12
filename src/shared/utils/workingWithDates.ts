import { parseISO, addDays } from "date-fns";
import { messageError } from "./messages/messageError";

export const transformStr = (date: string) => {
  if (date) {
    const str = date.split("/");
    return `${str[2]}-${str[1]}-${str[0]}`;
  } else {
    return "";
  }
};

export const keepStr = (date: string) => {
  if (date) {
    const str = date.split("-");
    return `${str[2]}/${str[1]}/${str[0]}`;
  } else {
    return "";
  }
};

const keepStrWithHour = (date: string) => {
  if (date) {
    const str = date.split("-");
    const day = str[2].slice(0, 2);
    const hour = str[2].slice(3);
    return `${day}/${str[1]}/${str[0]} ${hour}`;
  } else {
    return "";
  }
};

export const payloadSearch = (
  busca: string,
  dataInicio: string,
  dataFim: string
) => {
  return {
    search: Number(busca),
    startedDate: dataInicio ? transformStr(dataInicio) + "T00:00:00.000Z" : "0",
    endDate: dataFim ? transformStr(dataFim) + "T23:59:59.000Z" : "0",
  };
};

// Função para obter o offset em horas de um fuso específico
const getTimezone = (): number => {
  const date = new Date();
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(
    date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  return (utcDate.getTime() - tzDate.getTime()) / 60000 / 60;
};

export const dateNow = () => {
  const date = new Date();
  date.setHours(date.getUTCHours() - getTimezone());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // +1 porque getMonth começa em 0
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
};

const todayZonedTime = () => {
  return new Date(
    new Date().setHours(new Date().getUTCHours() - getTimezone())
  );
};

export const transformDate = (dt: string | undefined) => {
  if (dt) {
    const date = transformStr(dt);
    return new Date(date).toISOString();
  } else {
    return "";
  }
};

// Função para verificar se um dia é útil (segunda a sexta-feira)
const isWeekday = (date: Date): boolean => {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 é domingo e 6 é sábado
};

// Função para calcular a diferença em dias úteis entre duas datas
const differenceInBusinessDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  let currentDate = startDate;
  while (currentDate <= endDate) {
    if (isWeekday(currentDate)) {
      count++;
    }
    currentDate = addDays(currentDate, 1);
  }
  return count;
};

// Função principal para validar se a diferença em dias úteis é maior que 3
export const isRowOld = (date: string): boolean => {
  try {
    const today = todayZonedTime();
    const convertedDate = parseISO(date);
    if (convertedDate > today) {
      messageError("A data não pode ser futura.", date);
      return false;
    }
    const daysDifference = differenceInBusinessDays(convertedDate, today);
    return daysDifference > 3;
  } catch (error) {
    messageError("Erro ao validar a data.", date);
    return false;
  }
};

export const transformDateHour = (dt: string | undefined) => {
  if (dt) {
    const date = transformStr(dt);
    const hour = dateNow();
    return date + hour.slice(10);
  } else {
    return "";
  }
};

export const keepDate = (dt: string | undefined | null) => {
  if (dt) {
    const date = dt.slice(0, 10);
    return keepStr(date);
  } else {
    return "";
  }
};

export const keepDateHour = (dt: string | undefined | null) => {
  if (dt) {
    const date = dt.slice(0, 19);
    return keepStrWithHour(date);
  } else {
    return "";
  }
};

export const keepDateMinute = (dt: string | undefined | null) => {
  if (dt) {
    const date = dt.slice(0, 16);
    return keepStrWithHour(date);
  } else {
    return "";
  }
};

export const keepDateCustom = (dt: string | undefined | null) => {
  if (dt) {
    const str = dt.split("/");
    const year = str[2].slice(0, 2);
    const hour = str[2].slice(3);
    return `${str[0]}/${str[1]}/20${year} ${hour}`;
  } else {
    return "";
  }
};

export const keepDateHourToIso = (dt: string | undefined | null) => {
  if (dt) {
    const str = dt.split("/");
    const year = str[2].slice(0, 4);
    const hour = str[2].slice(3);
    const splitHour = hour.split(":");
    return `${year}-${str[1]}-${str[0]}T${splitHour[0].slice(2)}:${
      splitHour[1]
    }:${splitHour[2] ? splitHour[2] : "00"}Z`;
  } else {
    return "";
  }
};

export const validatedDate = (dt: string) => {
  const reGoodDate =
    /^(((0[1-9]|[12]\d|3[01])\/(0[13578]|1[02])\/((19|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\/(0[13456789]|1[012])\/((19|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\/02\/((19|[2-9]\d)\d{2}))|(29\/02\/((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|(([1][26]|[2468][048]|[3579][26])00))))$/g;
  return dt ? reGoodDate.test(dt) : true;
};

export const isValidatedIntervalDates = (
  startDate: string,
  endDate: string
): boolean => {
  const start = new Date(startDate.split("/").reverse().join("-"));
  const end = new Date(endDate.split("/").reverse().join("-"));
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }
  if (start > end) {
    return false;
  }
  return true;
};

export const ValidatedInterval = (data1: string, data2: string): boolean => {
  let dt1 = 0;
  let dt2 = 0;
  if (data1 !== "") {
    dt1 = new Date(transformStr(data1)).getTime();
  } else {
    dt1 = new Date().getTime();
  }
  if (data2 !== "") {
    dt2 = new Date(transformStr(data2)).getTime();
  } else {
    dt2 = new Date().getTime();
  }
  return dt2 - dt1 >= 0 ? true : false;
};
