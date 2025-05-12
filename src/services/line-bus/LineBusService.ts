import { handleAxiosError } from "../../shared/error/handleAxiosError";
import { Api } from "../api/axios-config";

export interface ILineBus {
  id?: number;
  name: number;
  description?: string;
}

const getAllLineBus = async (
  accessToken?: string
): Promise<ILineBus[] | Error> => {
  try {
    const { data } = await Api.get("/line-bus", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

export const LineBusService = {
  getAllLineBus,
};
