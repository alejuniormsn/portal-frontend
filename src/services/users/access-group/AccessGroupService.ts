import { handleAxiosError } from "../../../shared/error/handleAxiosError";
import { Api } from "../../api/axios-config";

interface ISubItem {
  to: string;
  icon: string;
  label: string;
}

export interface IAccess {
  icon: string;
  path: string | null;
  label: string;
  subItems?: ISubItem[];
}

interface GroupItem extends IAccess {
  department_id: number;
}

export interface IAccessGroup {
  id?: number;
  access_group: number;
  group: GroupItem[];
  group_name: string;
  created_at?: string;
  updated_at?: string;
}

const getGroupsByGroup = async (
  access_group: number
): Promise<IAccessGroup | Error> => {
  try {
    const { data } = await Api.get(`/group/${access_group}`);
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const updateGroup = async (
  access_group: number,
  payload: IAccessGroup,
  accessToken?: string
): Promise<IAccessGroup | Error> => {
  try {
    const { data } = await Api.put(`/group/${access_group}`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const createGroup = async (
  payload: IAccessGroup,
  accessToken?: string
): Promise<IAccessGroup | Error> => {
  try {
    const { data } = await Api.post("/group", payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const deleteGroup = async (
  id: number,
  accessToken?: string
): Promise<void | Error> => {
  try {
    const { data } = await Api.delete(`/group/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

export const AccessGroupService = {
  getGroupsByGroup,
  updateGroup,
  createGroup,
  deleteGroup,
};
