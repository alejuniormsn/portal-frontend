import { handleAxiosError } from "../../shared/error/handleAxiosError";
import { Api } from "../api/axios-config";

export interface ISelectCity {
  id: number;
  name?: string;
}

const getAllCity = async (
  accessToken?: string
): Promise<ISelectCity[] | Error> => {
  try {
    const { data } = await Api.get("/cities", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

export const CityService = {
  getAllCity,
};
