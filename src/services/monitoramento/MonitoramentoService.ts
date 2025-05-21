import { handleAxiosError } from "../../shared/error/handleAxiosError";
import { Api } from "../api/axios-config";
import { ISelectStatus } from "../manutencao/ManutencaoService";

export interface ISelectMonitoring {
  id: number;
  name?: string;
  f23?: boolean;
  cod_department?: number;
  qtde?: number;
}

export interface IMonitoringCar {
  id?: number;
  monitor_registration: number;
  date_check: string;
  car: number;
  driver_registration: number;
  date_occurrence: string;
  ra_globus?: string;
  video_path?: string;
  comment?: string;
  treatment?: string;
  inspector_registration?: number;
  date_inspector?: string;
  created_at: string;
  updated_at?: string;
  type_occurrence: ISelectMonitoring[];
  occurrence: ISelectMonitoring[];
  monitoring_status: ISelectMonitoring[];
}

type resultMonitoringCars = {
  data: {
    success: boolean;
    statusCode: number;
    message: IMonitoringCar[];
  };
};

type resultMonitoringCar = {
  data: {
    success: boolean;
    statusCode: number;
    message: IMonitoringCar;
  };
};

type resultSelects = {
  data: {
    success: boolean;
    statusCode: number;
    message: ISelectMonitoring[];
  };
};

type resultSelectsStatus = {
  data: {
    success: boolean;
    statusCode: number;
    message: ISelectStatus[];
  };
};

type resultDelete = {
  data: {
    success: boolean;
    statusCode: number;
    message: string;
  };
};

export type driverScale = {
  id: string;
  dtsaida: string;
  prefixoveic: string;
  nomefunc: string;
  chapafunc: string;
  descfuncao: string;
  nroficiallinha: string;
  horasaidagaragem: string;
  horarecolhida: string;
};

type resultDriverScale = {
  data: {
    success: boolean;
    statusCode: number;
    message: driverScale[];
  };
};

export interface IMonitoringCarBase {
  monitoring_status: number;
  date_inspector?: string | null;
  inspector_registration?: number | null;
  treatment?: string | null;
}

export interface IMonitoringCarForm extends IMonitoringCarBase {
  monitor_registration: number;
  date_check: string;
  car: number;
  driver_registration: number;
  date_occurrence: string;
  ra_globus?: string | null;
  video_path?: string | null;
  comment?: string | null;
  type_occurrence: number;
  occurrence: number;
}

export interface IMonitoringCarUpdate extends IMonitoringCarBase {
  updated_at: string;
}

interface IFilter {
  search?: number;
  startedDate: string;
  endDate: string;
}

const getAllMonitoringCars = async (
  filter: IFilter,
  accessToken?: string
): Promise<IMonitoringCar[] | Error> => {
  try {
    const { data }: resultMonitoringCars = await Api.get(
      `/monitoring-cars/?busca=${filter.search}&dataInicio=${filter.startedDate}&dataFim=${filter.endDate}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getMonitoringCar = async (
  id: number,
  accessToken?: string
): Promise<IMonitoringCar | Error> => {
  try {
    const { data }: resultMonitoringCar = await Api.get(
      `/monitoring-car/${id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error) {
    throw handleAxiosError(error);
  }
};

const getAllOccurrenceTypes = async (
  accessToken?: string
): Promise<ISelectMonitoring[] | Error> => {
  try {
    const { data }: resultSelects = await Api.get(
      "/monitoring-occurrence-types",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllMonitoringStatus = async (
  accessToken?: string
): Promise<ISelectStatus[] | Error> => {
  try {
    const { data }: resultSelectsStatus = await Api.get("/monitoring-status", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllOccurrence = async (
  accessToken?: string
): Promise<ISelectMonitoring[] | Error> => {
  try {
    const { data }: resultSelects = await Api.get("/monitoring-occurrence", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const createMonitoringCar = async (
  payload: IMonitoringCarForm,
  accessToken?: string
): Promise<IMonitoringCar | Error> => {
  try {
    const { data }: resultMonitoringCar = await Api.post(
      "/monitoring-car",
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const updateMonitoringCar = async (
  id: number,
  payload: IMonitoringCarForm,
  accessToken?: string
): Promise<IMonitoringCar | Error> => {
  try {
    const { data }: resultMonitoringCar = await Api.put(
      `/monitoring-car/${id}`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const updateStatusMonitoringCar = async (
  id: number,
  payload: IMonitoringCarUpdate,
  accessToken?: string
): Promise<IMonitoringCar | Error> => {
  try {
    const { data }: resultMonitoringCar = await Api.patch(
      `/monitoring-car/${id}`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const deleteMonitoringCar = async (
  id: number,
  accessToken?: string
): Promise<string | Error> => {
  try {
    const { data }: resultDelete = await Api.delete(`/monitoring-car/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getDriver = async (
  dtsaida: string,
  prefixoveic: string,
  accessToken?: string
): Promise<driverScale[] | Error> => {
  try {
    const { data }: resultDriverScale = await Api.get(
      `/driver-scale/${dtsaida}/${prefixoveic}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

export const MonitoramentoService = {
  getAllMonitoringCars,
  getMonitoringCar,
  getAllOccurrenceTypes,
  getAllMonitoringStatus,
  getAllOccurrence,
  createMonitoringCar,
  updateMonitoringCar,
  deleteMonitoringCar,
  updateStatusMonitoringCar,
  getDriver,
};
