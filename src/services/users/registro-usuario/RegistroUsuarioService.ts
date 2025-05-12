import { Api } from "../../api/axios-config";
import { handleAxiosError } from "../../../shared/error/handleAxiosError";

export interface ISelectUser {
  id: number;
  name?: string;
}

interface ISubItem {
  to: string;
  icon: string;
  label: string;
}

interface IAccess {
  icon: string;
  path: string | null;
  label: string;
  subItems?: ISubItem[];
}

export interface IDepartment {
  id: number;
  name: string;
  access: IAccess;
  created_at: Date;
  updated_at?: Date;
}

export interface IAccessLevel {
  dpto: number;
  level: number;
}

export interface IUserBase {
  id?: number;
  registration: number;
  cpf: string;
  email: string;
  name: string;
  mother_name: string;
  phone: string;
  password?: string;
  access_group: number;
  name_main_department: string;
  occurrence?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

export interface IUser extends IUserBase {
  department: number[];
  access_level: string[];
}

export interface IUserForm extends IUserBase {
  access_dpto: string;
  access_level: string;
  department: number;
}

export interface IUserApi {
  chapafunc: string;
  nome_func: string;
  nome_mae: string;
  telefone: string;
  cpf: string;
  email: string;
  nascimento: string;
  base64: string;
}

export interface TData {
  occurrence: string;
  password: string;
  updated_at: Date;
}

const getAllUsers = async (accessToken?: string): Promise<IUser[] | Error> => {
  try {
    const { data } = await Api.get("/users", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getByRegistration = async (
  busca: string,
  accessToken?: string
): Promise<IUser | Error> => {
  try {
    const { data } = await Api.get(`/user-registration/${busca}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getByRegistrationByName = async (
  busca: string,
  accessToken?: string
): Promise<IUser[] | Error> => {
  try {
    const { data } = await Api.get(`/user-name/${busca.toUpperCase()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const register = async (
  payload: IUser,
  accessToken?: string
): Promise<IUser | Error> => {
  try {
    const { data } = await Api.post("/register", payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const updateUser = async (
  id: number,
  payload: IUser,
  accessToken?: string
): Promise<IUser | Error> => {
  try {
    const { data } = await Api.put(`/user-registration/${id}`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllDepartments = async (
  accessToken?: string
): Promise<IDepartment[] | Error> => {
  try {
    const { data } = await Api.get("/departments", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getUserIntegration = async (
  chapafunc: string,
  accessToken?: string
): Promise<IUserApi | Error> => {
  try {
    const { data } = await Api.get(`/consulta-user/${chapafunc}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message[0];
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

export const RegistroUsuarioService = {
  getByRegistration,
  getAllUsers,
  getAllDepartments,
  register,
  updateUser,
  getUserIntegration,
  getByRegistrationByName,
};
