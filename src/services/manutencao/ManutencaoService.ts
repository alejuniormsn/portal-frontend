import { handleAxiosError } from "../../shared/error/handleAxiosError";
import { Api } from "../api/axios-config";

export interface ISelectMaintenance {
  id: number;
  name?: string;
  qtde?: number;
}

export interface ISelectStatus {
  id: number;
  name?: string;
  cod_department: number;
}

export interface IMaintenanceCarBase {
  car: number;
  date_maintenance: string;
  comments?: string | null;
  approver?: number | null;
}

export interface IMaintenanceCar extends IMaintenanceCarBase {
  id?: number;
  updated_at?: string;
  created_at?: string;
  types: ISelectMaintenance[];
  details: ISelectMaintenance[];
  status: ISelectStatus[];
  registration_source: number;
}

export interface IMaintenanceCarForm extends IMaintenanceCarBase {
  types: number;
  details: number;
  status: number;
}

type resultMaintenanceCars = {
  data: {
    success: boolean;
    statusCode: number;
    message: IMaintenanceCar[];
  };
};

type resultMaintenanceCar = {
  data: {
    success: boolean;
    statusCode: number;
    message: IMaintenanceCar;
  };
};

type resultSelects = {
  data: {
    success: boolean;
    statusCode: number;
    message: ISelectMaintenance[];
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

interface IFilter {
  search?: number;
  startedDate: string;
  endDate: string;
}

const getAllMaintenanceCars = async (
  filter: IFilter,
  accessToken?: string
): Promise<IMaintenanceCar[] | Error> => {
  try {
    const { data }: resultMaintenanceCars = await Api.get(
      `/maintenance-cars/?busca=${filter.search}&dataInicio=${filter.startedDate}&dataFim=${filter.endDate}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getMaintenanceCar = async (
  id: number,
  accessToken?: string
): Promise<IMaintenanceCar | Error> => {
  try {
    const { data }: resultMaintenanceCar = await Api.get(
      `/maintenance-car/${id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllMaintenanceTypes = async (
  accessToken?: string
): Promise<ISelectMaintenance[] | Error> => {
  try {
    const { data }: resultSelects = await Api.get("/maintenance-types", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllMaintenanceStatus = async (
  accessToken?: string
): Promise<ISelectStatus[] | Error> => {
  try {
    const { data }: resultSelectsStatus = await Api.get("/maintenance-status", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllMaintenanceDetails = async (
  accessToken?: string
): Promise<ISelectMaintenance[] | Error> => {
  try {
    const { data }: resultSelects = await Api.get("/maintenance-details", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const createMaintenanceCar = async (
  payload: IMaintenanceCarForm,
  accessToken?: string
): Promise<IMaintenanceCar | Error> => {
  try {
    const { data }: resultMaintenanceCar = await Api.post(
      "/maintenance-car",
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const updateMaintenanceCar = async (
  id: number,
  payload: IMaintenanceCarForm,
  accessToken?: string
): Promise<IMaintenanceCar | Error> => {
  try {
    const { data }: resultMaintenanceCar = await Api.put(
      `/maintenance-car/${id}`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const updateStatusMaintenanceCar = async (
  id: number,
  payload: { updated_at: string; status: number; approver: number },
  accessToken?: string
): Promise<IMaintenanceCar | Error> => {
  try {
    const { data }: resultMaintenanceCar = await Api.patch(
      `/maintenance-car/${id}`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const deleteMaintenanceCar = async (
  id: number,
  accessToken?: string
): Promise<string | Error> => {
  try {
    const { data }: resultDelete = await Api.delete(`/maintenance-car/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

export const ManutencaoService = {
  getAllMaintenanceCars,
  getMaintenanceCar,
  getAllMaintenanceTypes,
  getAllMaintenanceStatus,
  getAllMaintenanceDetails,
  createMaintenanceCar,
  updateMaintenanceCar,
  deleteMaintenanceCar,
  updateStatusMaintenanceCar,
};
