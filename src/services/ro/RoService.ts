import { Api } from "../api/axios-config";
import { handleAxiosError } from "../../shared/error/handleAxiosError";

export interface ISelect {
  id: number;
  name?: string;
  car?: number;
  registration?: number;
  occurrence_type?: number[];
  sector_affected?: number[];
}

export interface IAuditLog {
  id: number;
  action: string;
  user_id: number;
  user_name: string;
  ro_id: number;
  created_at: string;
}

export interface IRo {
  id?: number;
  occurrence_number: string;
  occurrence_date: string;
  created_at: string;
  updated_at?: string | null;
  monitor_registration: number;
  vehicle_kilometer: number;
  employee_involved: number;
  location: string;
  occurrence_detail: string;
  direction: number;
  sos: number;
  collected: number;
  substitution: number;
  occurrence_response: string;
  observation: string | null;
  date_restore: string;
  deviation_realized: string;
  departure_canceled_go_1: string;
  departure_canceled_go_2: string;
  departure_canceled_return_1: string;
  departure_canceled_return_2: string;
  interrupted_output: string;
  ro_car: ISelect[];
  ro_user: ISelect[];
  ro_city: ISelect[];
  ro_motive: ISelect[];
  ro_status: ISelect[];
  ro_sector: ISelect[];
  ro_bus_line: ISelect[];
  ro_occurrence: ISelect[];
  ro_department: ISelect[];
  ro_occurrence_type: ISelect[];
  ro_audit_log: IAuditLog[];
}

interface IResult {
  success: boolean;
  statusCode: number;
  message: IRo | { error: string };
}

export interface IRoFormBase {
  id?: number;
  occurrence_number: string;
  occurrence_date: string;
  created_at?: string;
  updated_at?: string | null;
  monitor_registration: number;
  ro_status: number;
  ro_occurrence_type: number;
  ro_bus_line: number;
  ro_city: number;
  location: string;
  ro_sector: number;
  occurrence_response?: string | null;
  observation?: string | null;
}

export interface IRoForm extends IRoFormBase {
  sos: number;
  collected: number;
  substitution: number;
  occurrence_detail: string;
  ro_occurrence: number;
  ro_motive: number;
  departure_canceled_go_1: string | null;
  departure_canceled_go_2: string | null;
  departure_canceled_return_1: string | null;
  departure_canceled_return_2: string | null;
  interrupted_output: string | null;
  activeUserId: number;
  activeUser: string;
  ro_car: number | null;
  employee_involved: number;
  vehicle_kilometer: number;
}

export interface IRoNonOccurrence extends IRoFormBase {
  sos: number;
  collected: number;
  substitution: number;
  occurrence_detail: string;
  ro_occurrence: number;
  direction: number;
  ro_car: number;
  employee_involved: number;
  vehicle_kilometer: number;
}

export interface IRoFormFailure extends IRoFormBase {
  date_restore: string;
  direction: number;
  ro_car: number;
  employee_involved: number;
  vehicle_kilometer: number;
}

export interface IRoFormDeviation extends IRoFormBase {
  deviation_realized: string;
  ro_motive: number;
  direction: number;
  ro_car: number;
  employee_involved: number;
  vehicle_kilometer: number | null;
}

export interface IRoFormDeviationByLine extends IRoFormBase {
  deviation_realized: string;
  ro_motive: number;
  direction: number;
}

export interface IRoFormDelay extends IRoFormBase {
  ro_motive: number;
  direction: number;
  ro_car: number;
  employee_involved: number;
  vehicle_kilometer: number;
}

export interface IChangeStatusRo {
  ro_user: number;
  ro_status: number;
  ro_department: number;
  updated_at: string;
}

interface IChangeAssignToRo {
  updated_at: string;
  ro_user: number;
  ro_department: number;
  occurrence_response: string | null;
  username: string;
  username_old: string;
  activeUserId: number;
  activeUser: string;
}

interface IFilter {
  search?: number;
  startedDate: string;
  endDate: string;
}

const getAllRo = async (
  filter: IFilter,
  accessToken?: string
): Promise<IRo[] | Error> => {
  try {
    const { data } = await Api.get(
      `/ro?busca=${filter.search}&dataInicio=${filter.startedDate}&dataFim=${filter.endDate}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error) {
    throw handleAxiosError(error);
  }
};

const getRo = async (
  id: number,
  accessToken?: string
): Promise<IRo | Error> => {
  try {
    const { data } = await Api.get(`/ro/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error) {
    throw handleAxiosError(error);
  }
};

const createdRo = async (
  payload: IRoForm,
  accessToken?: string
): Promise<IResult | Error> => {
  try {
    const { data } = await Api.post("/ro", payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const updateRo = async (
  id: number,
  payload: IRoForm,
  accessToken?: string
): Promise<IRo | Error> => {
  try {
    const { data } = await Api.put(`/ro/${id}`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

type ChangeOccurrenceType = {
  occurrenceTypeId: number;
  occurrenceType: string;
  oldOccurrenceType: string;
  activeUserId: number;
  activeUser: string;
};

const changeOccurrenceTypeRo = async (
  id: number,
  payload: ChangeOccurrenceType,
  accessToken?: string
): Promise<string | Error> => {
  try {
    const { data } = await Api.put(
      `/change-occurrence-type-ro/${id}`,
      payload,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const updateRoAssignTo = async (
  id: number,
  payload: IChangeAssignToRo,
  accessToken?: string
): Promise<string | Error> => {
  try {
    const { data } = await Api.put(`/ro-assign/${id}`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const deleteRo = async (
  id: number,
  accessToken?: string
): Promise<string | Error> => {
  try {
    const { data } = await Api.delete(`/ro/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

//-----------------------------
const getAllRoOccurrenceType = async (
  accessToken?: string
): Promise<ISelect[] | Error> => {
  try {
    const { data } = await Api.get("/ro-occurrence-type", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllRoSector = async (
  accessToken?: string
): Promise<ISelect[] | Error> => {
  try {
    const { data } = await Api.get("/ro-sector", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllRoOccurrence = async (
  accessToken?: string
): Promise<ISelect[] | Error> => {
  try {
    const { data } = await Api.get("/ro-occurrence", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllRoStatus = async (
  accessToken?: string
): Promise<ISelect[] | Error> => {
  try {
    const { data } = await Api.get("/ro-status", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllRoMotive = async (
  accessToken?: string
): Promise<ISelect[] | Error> => {
  try {
    const { data } = await Api.get("/ro-motive", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

export const RoService = {
  getAllRo,
  getRo,
  createdRo,
  updateRo,
  updateRoAssignTo,
  deleteRo,
  getAllRoStatus,
  getAllRoOccurrenceType,
  getAllRoSector,
  getAllRoOccurrence,
  getAllRoMotive,
  changeOccurrenceTypeRo,
};
