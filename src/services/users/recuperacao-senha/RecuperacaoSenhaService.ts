import { handleAxiosError } from "../../../shared/error/handleAxiosError";
import { Api } from "../../api/axios-config";

export interface IUser {
  id: number;
  registration: number;
  cpf: string;
  name: string;
  mother_name: string;
  email: string;
  occurrence: string;
  phone: string;
  updated_at: string;
  password?: string;
  last_modified_by?: number;
}

export interface IUserPasswdForm {
  password: string;
  occurrence: string | null;
  last_modified_by: number;
  updated_at: string;
  email: string | null;
  phone: string;
}

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

const updatePassword = async (
  id: string,
  payload: IUserPasswdForm,
  accessToken?: string
): Promise<void | Error> => {
  try {
    await Api.patch(`/user-registration/${id}`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

export const RecuperacaoSenhaService = {
  getByRegistration,
  updatePassword,
};
