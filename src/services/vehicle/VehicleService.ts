import { handleAxiosError } from "../../shared/error/handleAxiosError";
import { Api } from "../api/axios-config";

export interface IVehicle {
  id?: number;
  car: number;
  updated_at?: string;
  disabled?: boolean;
}

type resultVehicles = {
  data: {
    success: boolean;
    statusCode: number;
    message: IVehicle[];
  };
};

type resultVehicle = {
  data: {
    success: boolean;
    statusCode: number;
    message: IVehicle;
  };
};

const getAllVehicles = async (
  accessToken?: string
): Promise<IVehicle[] | Error> => {
  try {
    const { data }: resultVehicles = await Api.get("/vehicles", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getVehicle = async (
  id: number,
  accessToken?: string
): Promise<IVehicle | Error> => {
  try {
    const { data }: resultVehicle = await Api.get(`/vehicles/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error) {
    throw handleAxiosError(error);
  }
};

export const VehicleService = {
  getAllVehicles,
  getVehicle,
};
