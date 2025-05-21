import { handleAxiosError } from "../../shared/error/handleAxiosError";
import { Api } from "../api/axios-config";
import { IAccessLevel } from "../users/registro-usuario/RegistroUsuarioService";

export interface ILogin {
  registration: number;
  password: string;
}

export interface IUser {
  id: number;
  registration: number;
  name: string;
  access_group: number;
  department: Array<number>;
  name_main_department: string;
  access_level: Array<IAccessLevel>;
}

export interface IAuth {
  user: IUser;
  token: string;
}

const auth = async (login: ILogin) => {
  try {
    const { data } = await Api.post("/login", login);
    return data;
  } catch (error) {
    throw handleAxiosError(error);
  }
};

export const AuthService = {
  auth,
};
