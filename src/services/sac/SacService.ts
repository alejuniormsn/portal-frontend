import { handleAxiosError } from "../../shared/error/handleAxiosError";
import { Api } from "../api/axios-config";

export interface ISelect {
  id: number;
  name?: string;
  registration?: number | null;
}

export interface IRelatedTicket {
  id: number;
  ticket_number: string;
  title: string;
}

export interface ISac {
  id?: number;
  email: string | null;
  employee_involved: number | null;
  history: string;
  monitor_registration: string;
  name_cli: string;
  phone: string | null;
  proceeding: number | null;
  rg_cli: string | null;
  sac_department: ISelect[];
  sac_gender: ISelect[];
  sac_occurrence_type: ISelect[];
  sac_priority: ISelect[];
  sac_source_channel: ISelect[];
  sac_status: ISelect[];
  sac_user: ISelect[];
  sac_vehicle: ISelect[];
  sac_bus_line: ISelect[];
  ticket_number: string;
  sac_group: number | null;
  car: number | null;
  line_bus: number | null;
  title: string;
  video_path: string | null;
  created_at: string;
  updated_at: string | null;
  date_occurrence: string | null;
  related_ticket_list: string | null;
}

export interface ISacBase {
  history: string;
  name_cli: string;
  phone?: string | null;
  rg_cli?: string | null;
  email?: string | null;
  sac_gender: number;
  sac_occurrence_type: number;
  sac_source_channel: number;
  sac_status: number;
  title: string;
  created_at?: string | null;
  updated_at?: string | null;
  date_occurrence?: string | null;
}

export interface ISacForm extends ISacBase {
  monitor_registration?: string;
  ticket_number?: string;
}

export interface ISacFormUpdate extends ISacBase {
  monitor_registration: string;
  ticket_number: string;
  sac_group: number;
  sac_priority: number;
  proceeding: number;
  employee_involved?: number | null;
  car: number;
  line_bus: number;
  video_path?: string | null;
}

export interface ISacFormTreatment {
  sac_group: number;
  sac_priority: number;
  employee_involved?: number | null;
  proceeding: number;
  video_path?: string | null;
  updated_at?: string | null;
}

export interface ITreatmentBase {
  sac_id: number;
  department_id: number;
  department_name: string;
  user_name: string;
  user_id: number;
  update_user_name: string | null;
  update_user_id: number | null;
  treatment?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface ITreatment extends ITreatmentBase {
  id: number;
}

export interface ITreatmentForm extends ITreatmentBase {
  created_at: string; // Observação: esse campo é obrigatório em ITreatmentForm
}

export interface IChangeStatusSac {
  sac_user: string;
  sac_status: number;
  sac_department: string;
  updated_at: string;
}

interface IFilter {
  search?: number;
  startedDate: string;
  endDate: string;
}

const getAllSacs = async (
  filter: IFilter,
  accessToken?: string
): Promise<ISac[] | Error> => {
  try {
    const { data } = await Api.get(
      `/sacs/?busca=${filter.search}&dataInicio=${filter.startedDate}&dataFim=${filter.endDate}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getSac = async (
  id: number,
  accessToken?: string
): Promise<ISac | Error> => {
  try {
    const { data } = await Api.get(`/sac/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error) {
    throw handleAxiosError(error);
  }
};

const createdSac = async (
  payload: ISacForm,
  accessToken?: string
): Promise<ISac | Error> => {
  try {
    const { data } = await Api.post("/sac", payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const updateSac = async (
  id: number,
  payload: ISacFormUpdate,
  accessToken?: string
): Promise<ISac | Error> => {
  try {
    const { data } = await Api.put(`/sac/${id}`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const updateStatusSac = async (
  id: number,
  payload: IChangeStatusSac,
  accessToken?: string
): Promise<ISac | Error> => {
  try {
    const { data } = await Api.patch(`/sac/${id}`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const deleteSac = async (
  id: number,
  accessToken?: string
): Promise<string | Error> => {
  try {
    const { data } = await Api.delete(`/sac/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getBySacIdTreatment = async (
  id: number,
  accessToken?: string
): Promise<ITreatment[] | Error> => {
  try {
    const { data } = await Api.get(`/sac-treatment/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const createdSacTreatment = async (
  payload: ITreatmentForm,
  accessToken?: string
): Promise<ITreatment | Error> => {
  try {
    const { data } = await Api.post("/sac-treatment", payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const updateTreatment = async (
  id: number,
  payload: ITreatment,
  accessToken?: string
): Promise<ISac | Error> => {
  try {
    const { data } = await Api.put(`/sac-treatment/${id}`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const updateSacTreatment = async (
  id: number,
  payload: ISacFormTreatment,
  accessToken?: string
): Promise<ISac | Error> => {
  try {
    const { data } = await Api.patch(`/sac-treatment/${id}`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const deleteSacTreatment = async (
  id: number,
  accessToken?: string
): Promise<string | Error> => {
  try {
    const { data } = await Api.delete(`/sac-treatment/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

//-----------------------------
const getAllSacOccurrenceType = async (
  accessToken?: string
): Promise<ISelect[] | Error> => {
  try {
    const { data } = await Api.get("/sac-occurrence-type", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllSacSourceChannel = async (
  accessToken?: string
): Promise<ISelect[] | Error> => {
  try {
    const { data } = await Api.get("/sac-source-channel", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllSacGroup = async (
  accessToken?: string
): Promise<ISelect[] | Error> => {
  try {
    const { data } = await Api.get("/sac-group", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllPriority = async (
  accessToken?: string
): Promise<ISelect[] | Error> => {
  try {
    const { data } = await Api.get("/priority", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllRelatedTicket = async (
  accessToken?: string
): Promise<IRelatedTicket[] | Error> => {
  try {
    const { data } = await Api.get("/sac-tickets", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllSacStatus = async (
  accessToken?: string
): Promise<ISelect[] | Error> => {
  try {
    const { data } = await Api.get("/sac-status", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

export const SacService = {
  getAllSacs,
  getSac,
  createdSac,
  updateStatusSac,
  updateSac,
  deleteSac,
  getAllSacStatus,
  getAllSacOccurrenceType,
  getAllSacSourceChannel,
  getAllSacGroup,
  getAllPriority,
  getBySacIdTreatment,
  createdSacTreatment,
  updateTreatment,
  deleteSacTreatment,
  updateSacTreatment,
  getAllRelatedTicket,
};
