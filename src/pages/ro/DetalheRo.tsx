import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  dateNow,
  keepDateHour,
  keepDateHourToIso,
} from "../../shared/utils/workingWithDates";
import {
  ILineBus,
  LineBusService,
} from "../../services/line-bus/LineBusService";
import {
  IVehicle,
  VehicleService,
} from "../../services/vehicle/VehicleService";
import {
  IUser,
  RegistroUsuarioService,
} from "../../services/users/registro-usuario/RegistroUsuarioService";
import {
  IAuditLog,
  IRoForm,
  IRoFormDelay,
  IRoFormDeviation,
  IRoFormDeviationByLine,
  IRoFormFailure,
  IRoNonOccurrence,
  ISelect,
  RoService,
} from "../../services/ro/RoService";
import checkCircleIcon from "../../assets/icons/check_circle.svg";
import checkCircleRedIcon from "../../assets/icons/check_circle_red.svg";
import InputMask from "react-input-mask";
import * as yup from "yup";
import { VTextField, VForm, useVForm, VSelect } from "../../shared/forms";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { FerramentasDeDetalhe } from "../../shared/components";
import { LayoutBaseDePagina } from "../../shared/layouts";
import { useDebounce } from "../../shared/hooks/UseDebounce";
import { messageError } from "../../shared/utils/messages/messageError";
import { messageSuccess } from "../../shared/utils/messages/messageSuccess";
import { useAuthContext } from "../../contexts";
import { goBack } from "../../shared/utils/goBack";
import { CityService } from "../../services/city/CityService";
import { canDo } from "../../shared/utils/canDo";
import { confirmDialog } from "../../shared/utils/messages/confirmDialog";
import { messageWarning } from "../../shared/utils/messages/messageWarning";
import { usedName } from "../../shared/utils/usedName";
import { handleErrorMessage } from "../../shared/error/handleErrorMessage";
import { handleValidationFormErrors } from "../../shared/error/handleValidationFormErrors";
import { generateNewNumber } from "../../shared/utils/generateNewNumber";
import { canAccess } from "../../shared/utils/canAccess";
import { doNotRun } from "../../shared/utils/messages/doNotRun";

// Esquema base com campos comuns
const baseValidationSchema = yup.object().shape({
  id: yup.number(),
  occurrence_number: yup.string(),
  occurrence_date: yup.string().required("Data da ocorrência é obrigatória"),
  created_at: yup.string(),
  updated_at: yup.string().nullable(),
  monitor_registration: yup.number(),
  ro_status: yup.number().required(),
  ro_occurrence_type: yup.number(),
  ro_bus_line: yup.number().required("Linha do ônibus é obrigatória"),
  location: yup
    .string()
    .min(10, "Localização da ocorrência deve ter no mínimo 10 caracteres")
    .required("Localização é obrigatória"),
  ro_city: yup.number().required("Município é obrigatório"),
  ro_sector: yup.number().required("Setor afetado é obrigatório"),
  observation: yup.string().nullable(),
});

const formValidationCancelSchema = baseValidationSchema.shape({
  ro_car: yup.number().required("Veículo é obrigatório"),
  vehicle_kilometer: yup.number().when("ro_occurrence_type", {
    is: (value: number) => value !== 3,
    then: yup.number().required("Quilometragem do veículo é obrigatória"),
    otherwise: yup.number().nullable(),
  }),
  employee_involved: yup.number().required("Motorista envolvido é obrigatório"),
  sos: yup.number().required("S.O.S. é obrigatório"),
  collected: yup.number().required("Recolhe é obrigatório"),
  substitution: yup.number().required("Substituição é obrigatória"),
  occurrence_detail: yup
    .string()
    .min(5, "Detalhe da ocorrência deve ter no mínimo 5 caracteres")
    .required("Detalhe da ocorrência é obrigatório"),
  ro_occurrence: yup.number().required("Ocorrência é obrigatória"),
  departure_canceled_go_1: yup.string().nullable(),
  departure_canceled_go_2: yup.string().nullable(),
  departure_canceled_return_1: yup.string().nullable(),
  departure_canceled_return_2: yup.string().nullable(),
  interrupted_output: yup.string().nullable(),
  ro_motive: yup.number().required("Motivo da ocorrência é obrigatório"),
  substitute_vehicle: yup.number().nullable(),
});

const formValidationDelaySchema = baseValidationSchema.shape({
  ro_car: yup.number().required("Veículo é obrigatório"),
  vehicle_kilometer: yup.number().when("ro_occurrence_type", {
    is: (value: number) => value !== 3,
    then: yup.number().required("Quilometragem do veículo é obrigatória"),
    otherwise: yup.number().nullable(),
  }),
  employee_involved: yup.number().required("Motorista envolvido é obrigatório"),
  direction: yup.number().required("Sentido é obrigatório"),
  ro_motive: yup.number().required("Motivo da ocorrência é obrigatório"),
});

const formValidationFailureSchema = baseValidationSchema.shape({
  ro_car: yup.number().required("Veículo é obrigatório"),
  vehicle_kilometer: yup.number().when("ro_occurrence_type", {
    is: (value: number) => value !== 3,
    then: yup.number().required("Quilometragem do veículo é obrigatória"),
    otherwise: yup.number().nullable(),
  }),
  employee_involved: yup.number().required("Motorista envolvido é obrigatório"),
  date_restore: yup
    .string()
    .required("Data para restabelecer transmissão é obrigatória"),
  direction: yup.number().required("Sentido é obrigatório"),
});

const formValidationDeviationSchema = baseValidationSchema.shape({
  ro_car: yup.number().required("Veículo é obrigatório"),
  vehicle_kilometer: yup.number().when("ro_occurrence_type", {
    is: (value: number) => value !== 3,
    then: yup.number().required("Quilometragem do veículo é obrigatória"),
    otherwise: yup.number().nullable(),
  }),
  employee_involved: yup.number().required("Motorista envolvido é obrigatório"),
  deviation_realized: yup.string().required("Desvio realizado é obrigatório"),
  direction: yup.number().required("Sentido é obrigatório"),
  ro_motive: yup.number().required("Motivo da ocorrência é obrigatório"),
});

const formValidationDeviationByLineSchema = baseValidationSchema.shape({
  deviation_realized: yup.string().required("Desvio realizado é obrigatório"),
  direction: yup.number().required("Sentido é obrigatório"),
  ro_motive: yup.number().required("Motivo da ocorrência é obrigatório"),
});

const formValidationNonOccurrenceSchema = baseValidationSchema.shape({
  ro_car: yup.number().required("Veículo é obrigatório"),
  vehicle_kilometer: yup.number().when("ro_occurrence_type", {
    is: (value: number) => value !== 3,
    then: yup.number().required("Quilometragem do veículo é obrigatória"),
    otherwise: yup.number().nullable(),
  }),
  employee_involved: yup.number().required("Motorista envolvido é obrigatório"),
  sos: yup.number().required("S.O.S. é obrigatório"),
  collected: yup.number().required("Recolhe é obrigatório"),
  substitution: yup.number().required("Substituição é obrigatória"),
  occurrence_detail: yup
    .string()
    .min(5, "Detalhe da ocorrência deve ter no mínimo 5 caracteres")
    .required("Detalhe da ocorrência é obrigatório"),
  ro_occurrence: yup.number().required("Ocorrência é obrigatória"),
  direction: yup.number().required("Sentido é obrigatório"),
  substitute_vehicle: yup.number().nullable(),
});

export const DetalheRo: React.FC = () => {
  const { formRef, save, saveAndClose, isSaveAndClose } = useVForm();
  const { id } = useParams<"id">();
  const { accessToken } = useAuthContext();
  const { loggedUser } = useAuthContext();
  const { debounce } = useDebounce();
  const [isLoading, setIsLoading] = useState(false);
  const [roStatus, setRoStatus] = useState<ISelect[]>([]);
  const [city, setCity] = useState<ISelect[]>([]);
  const [occurrenceType, setOccurrenceType] = useState<ISelect[]>([]);
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [busLine, setBusLine] = useState<ILineBus[]>([]);
  const [sector, setSector] = useState<ISelect[]>([]);
  const [occurrenceList, setOccurrenceList] = useState<ISelect[]>([]);
  const [occurrence, setOccurrence] = useState<ISelect[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [motive, setMotive] = useState<ISelect[]>([]);
  const [changeForm, setChangeForm] = useState(false);
  const [searchParams] = useSearchParams();
  const [roAuditLog, setRoAuditLog] = useState<IAuditLog[]>([]);
  const [currentSector, setCurrentSector] = useState<number>();
  const [currentSubstitution, setCurrentSubstitution] = useState<boolean>(true);
  const [currentStatus, setCurrentStatus] = useState<number>(1);
  const [currentDepartment, setCurrentDepartment] = useState<number>(15);
  const [currentOccurrenceType, setCurrentOccurrenceType] = useState<number>(0);

  const reload = useMemo(() => {
    return searchParams.get("reload") || "";
  }, [searchParams]);

  const FECHADO = 2;
  const GPS = 15;
  const MAINTENANCE = 14;
  const INOCCURRENCE = 5;

  const search = useMemo(() => {
    return searchParams.get("search");
  }, [searchParams]);

  const param = useMemo(() => {
    return searchParams.get("param");
  }, [searchParams]);

  const cleanForm = {
    occurrence_number: generateNewNumber(),
    occurrence_date: null,
    created_at: keepDateHour(dateNow()),
    updated_at: null,
    date_restore: keepDateHour(dateNow()),
    monitor_registration: loggedUser.registration,
    ro_status: 1,
    ro_occurrence_type: param,
    ro_car: null,
    vehicle_kilometer: null,
    ro_bus_line: null,
    employee_involved: null,
    ro_city: null,
    location: null,
    ro_sector: null,
    ro_occurrence: null,
    ro_user: loggedUser.id,
    ro_motive: null,
    occurrence_detail: null,
    direction: null,
    sos: null,
    collected: null,
    occurrence_response: null,
    observation: null,
    deviation_realized: null,
    substitution: null,
    departure_canceled_go_1: null,
    departure_canceled_go_2: null,
    departure_canceled_return_1: null,
    departure_canceled_return_2: null,
    interrupted_output: null,
    substitute_vehicle: null,
  };

  // ---------- Validação dos dados do formulário -------------
  interface ValidationSchema {
    data: () => any;
    schema: any;
  }

  const validationMap: Record<string, ValidationSchema> = {
    "1": {
      data: () => formRef.current?.getData() as IRoFormDelay,
      schema: formValidationDelaySchema,
    },
    "2": {
      data: () => formRef.current?.getData() as IRoForm,
      schema: formValidationCancelSchema,
    },
    "3": {
      data: () => formRef.current?.getData() as IRoFormDeviation,
      schema: formValidationDeviationSchema,
    },
    "4": {
      data: () => formRef.current?.getData() as IRoFormFailure,
      schema: formValidationFailureSchema,
    },
    "5": {
      data: () => formRef.current?.getData() as IRoNonOccurrence,
      schema: formValidationNonOccurrenceSchema,
    },
    "6": {
      data: () => formRef.current?.getData() as IRoFormDeviationByLine,
      schema: formValidationDeviationByLineSchema,
    },
  };

  const validationData = async (param: string | null): Promise<any | Error> => {
    if (param === null)
      throw new Error("Invalid parameter: param cannot be null");

    const { data, schema } = validationMap[param];

    if (!data || !schema) throw new Error("Invalid parameter");

    const validatedData = await schema.validate(data(), {
      abortEarly: false,
    });

    return validatedData;
  };
  // -------------------------

  const commonPayloadFields = (data: any) => ({
    substitution: data.substitution || null,
    collected: data.collected || null,
    sos: data.sos || null,
    occurrence_detail: data.occurrence_detail || null,
    date_restore: keepDateHourToIso(data.date_restore) || null,
    deviation_realized: data.deviation_realized || null,
    occurrence_response: data.occurrence_response || null,
    direction: data.direction || 0,
    ro_occurrence: data.ro_occurrence || 1,
    ro_motive: data.ro_motive || 1,
    departure_canceled_go_1: data.departure_canceled_go_1 || null,
    departure_canceled_go_2: data.departure_canceled_go_2 || null,
    departure_canceled_return_1: data.departure_canceled_return_1 || null,
    departure_canceled_return_2: data.departure_canceled_return_2 || null,
    interrupted_output: data.interrupted_output || null,
    substitute_vehicle: data.substitute_vehicle || null,
    observation: data.observation || null,
    occurrence_date: keepDateHourToIso(data.occurrence_date) || null,
    ro_car: data.ro_car || null,
    employee_involved: data.employee_involved || null,
    vehicle_kilometer: data.vehicle_kilometer || null,
  });

  const payload = (data: any) => ({
    ...data,
    id: undefined,
    assign_to: undefined,
    ro_department: GPS,
    created_at: keepDateHourToIso(data.created_at),
    updated_at: null,
    activeUserId: loggedUser.id,
    activeUser: usedName(loggedUser.name, loggedUser.registration),
    ...commonPayloadFields(data),
  });

  const payloadUpdate = (data: any) => ({
    ...data,
    id: undefined,
    created_at: undefined,
    assign_to: undefined,
    updated_at: dateNow(),
    ro_department: data.ro_department || currentDepartment,
    activeUserId: loggedUser.id,
    activeUser: usedName(loggedUser.name, loggedUser.registration),
    ...commonPayloadFields(data),
  });

  const payloadUpdateWithStatus = (data: any) => ({
    ...data,
    id: undefined,
    created_at: undefined,
    assign_to: undefined,
    updated_at: dateNow(),
    ro_department: data.ro_department || currentDepartment,
    ro_status: FECHADO,
    activeUserId: loggedUser.id,
    activeUser: usedName(loggedUser.name, loggedUser.registration),
    ...commonPayloadFields(data),
  });

  const payloadUpdateAssign = (assign_to: string) => {
    const arrayDataUser = assign_to.split(",");
    const occurrence_response = formRef.current?.getData().occurrence_response;
    const ro_user = Number(formRef.current?.getData().ro_user);
    const user_old = users.filter((item) => item.id === ro_user);
    const user = users.filter((item) => item.id === Number(arrayDataUser[0]));
    return {
      updated_at: dateNow(),
      ro_user: Number(arrayDataUser[0]),
      ro_department: Number(arrayDataUser[1]),
      occurrence_response: occurrence_response || null,
      username_old: usedName(user_old[0].name, user_old[0].registration),
      username: usedName(user[0].name, user[0].registration),
      activeUserId: loggedUser.id,
      activeUser: usedName(loggedUser.name, loggedUser.registration),
    };
  };

  const handleAssign = async (id: number) => {
    const assign_to = formRef.current?.getData().assign_to;

    if (assign_to === undefined) {
      return messageWarning(
        "Você precisa selecionar uma pessoa para atribuir a ocorrência"
      );
    }

    if (currentDepartment === MAINTENANCE) {
      const field = formRef.current?.getData().occurrence_response;
      if (field == undefined || field == null || field == "") {
        const errorMessage =
          "É obrigatório responder a Ocorrência pela Manutenção";
        formRef.current?.setFieldError("occurrence_response", errorMessage);
        return messageWarning(errorMessage);
      }
    }

    try {
      setIsLoading(true);
      await validationData(param);
      await RoService.updateRoAssignTo(
        id,
        payloadUpdateAssign(assign_to),
        accessToken
      );
      messageSuccess("Registro atribuído com sucesso!");
      goBack();
    } catch (error: any) {
      if (error.inner) {
        handleValidationFormErrors(error, formRef);
        messageError(error.message);
      } else {
        messageError(handleErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const validations = [
        {
          fn: () => canDo(loggedUser.department, GPS),
          message: "Registro só pode ser finalizado pelo GPS",
        },
        {
          fn: () => canAccess(loggedUser.access_level, currentDepartment),
          message:
            "Você precisa de privilégios elevados para executar está ação",
        },
        {
          fn: () => !changeForm,
          message: "Salve suas alterações no formulário antes de seguir",
        },
      ];
      for (const { fn, message } of validations) {
        if (!fn()) throw new Error(message);
      }

      setIsLoading(true);

      const validatedData = await validationData(param);

      if (await confirmDialog("Realmente deseja finalizar ?")) {
        await RoService.updateRo(
          id,
          payloadUpdateWithStatus(validatedData),
          accessToken
        );
      } else {
        return messageWarning("Cancelado pelo usuário");
      }

      messageSuccess("Registro finalizado com sucesso!");

      goBack();
    } catch (error: any) {
      if (error.inner) {
        handleValidationFormErrors(error, formRef);
        messageError(error.message);
      } else {
        messageError(handleErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const validatedData = await validationData(param);

      if (id === "nova") {
        await RoService.createdRo(payload(validatedData), accessToken);
      } else {
        await RoService.updateRo(
          Number(id),
          payloadUpdate(validatedData),
          accessToken
        );
      }

      setChangeForm(false);

      messageSuccess("Registro salvo com sucesso!");

      if (isSaveAndClose()) {
        goBack();
      } else {
        if (id === "nova") formRef.current?.setData(cleanForm);
      }
    } catch (error: any) {
      if (error.inner) {
        handleValidationFormErrors(error, formRef);
        messageError(error.message);
      } else {
        messageError(handleErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeOccurrenceTypeRo = async (param: number | undefined) => {
    if (!canDo(loggedUser.department, GPS)) {
      return doNotRun(
        "Ação permitida apenas pelo setor responsável",
        "Ação não permitida"
      );
    }

    if (param === undefined || param === null)
      return messageWarning("Selecione um tipo de ocorrência.");

    try {
      setIsLoading(true);
      const newOccurrenceType = occurrenceType.find(
        (item) => item.id === param
      );
      const oldOccurrenceType = occurrenceType.find(
        (item) => item.id === currentOccurrenceType
      );
      if (!newOccurrenceType || !oldOccurrenceType)
        throw new Error("Tipo de ocorrência não encontrado");
      const payload = {
        occurrenceTypeId: param,
        occurrenceType: newOccurrenceType.name || "",
        oldOccurrenceType: oldOccurrenceType.name || "",
        activeUserId: loggedUser.id,
        activeUser: usedName(loggedUser.name, loggedUser.registration),
      };
      if (await confirmDialog()) {
        await RoService.changeOccurrenceTypeRo(
          Number(id),
          payload,
          accessToken
        );
        messageSuccess("Registro alterado com sucesso!");
        goBack();
      } else {
        return messageWarning("Cancelado pelo usuário");
      }
    } catch (error: any) {
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    debounce(async () => {
      if (id === "nova") return formRef.current?.setData(cleanForm);

      try {
        setIsLoading(true);

        const result = await RoService.getRo(Number(id), accessToken);

        if (result instanceof Error) throw result;

        const transformResult = {
          ...result,
          occurrence_date: keepDateHour(result.occurrence_date),
          created_at: keepDateHour(result.created_at),
          updated_at: keepDateHour(result.updated_at),
          date_restore: keepDateHour(result.date_restore),
          ro_car: result.ro_car.length > 0 ? result.ro_car[0].id : null,
          ro_city: result.ro_city[0].id,
          ro_user: result.ro_user[0].id,
          ro_motive: result.ro_motive[0].id,
          ro_status: result.ro_status[0].id,
          ro_sector: result.ro_sector[0].id,
          ro_bus_line: result.ro_bus_line[0].id,
          ro_department: result.ro_department[0].id,
          ro_occurrence: result.ro_occurrence[0].id,
          ro_occurrence_type: result.ro_occurrence_type[0].id,
        };
        formRef.current?.setData(transformResult);
        setCurrentStatus(transformResult.ro_status);
        setCurrentDepartment(transformResult.ro_department);
        setCurrentOccurrenceType(transformResult.ro_occurrence_type);
        setRoAuditLog(result.ro_audit_log);
      } catch (error: any) {
        messageError(handleErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    });
  }, [id, reload]);

  useEffect(() => {
    debounce(async () => {
      try {
        setIsLoading(true);

        if (
          localStorage.getItem("roUsers") &&
          localStorage.getItem("roMotive") &&
          localStorage.getItem("roStatus") &&
          localStorage.getItem("city") &&
          localStorage.getItem("roOccurrenceType") &&
          localStorage.getItem("roSector") &&
          localStorage.getItem("roOccurrenceList") &&
          localStorage.getItem("vehicles") &&
          localStorage.getItem("busLine")
        ) {
          setUsers(JSON.parse(localStorage.getItem("roUsers") || "[]"));
          setMotive(JSON.parse(localStorage.getItem("roMotive") || "[]"));
          setRoStatus(JSON.parse(localStorage.getItem("roStatus") || "[]"));
          setCity(JSON.parse(localStorage.getItem("city") || "[]"));
          setOccurrenceType(
            JSON.parse(localStorage.getItem("roOccurrenceType") || "[]")
          );
          setSector(JSON.parse(localStorage.getItem("roSector") || "[]"));
          setOccurrence(
            JSON.parse(localStorage.getItem("roOccurrenceList") || "[]")
          );
          setVehicles(JSON.parse(localStorage.getItem("vehicles") || "[]"));
          setBusLine(JSON.parse(localStorage.getItem("busLine") || "[]"));
          return;
        }

        const [
          roUsers,
          roMotive,
          roStatus,
          roCity,
          roOccurrenceType,
          roSector,
          roOccurrenceList,
          roVehicles,
          roBusLine,
        ] = await Promise.all([
          RegistroUsuarioService.getAllUsers(accessToken),
          param === "1" || param === "2" || param === "3" || param === "6"
            ? RoService.getAllRoMotive(accessToken)
            : Promise.resolve([]),

          RoService.getAllRoStatus(accessToken),

          CityService.getAllCity(accessToken),

          RoService.getAllRoOccurrenceType(accessToken),

          RoService.getAllRoSector(accessToken),

          param === "2" || param === "5"
            ? RoService.getAllRoOccurrence(accessToken)
            : Promise.resolve([]),

          param !== "6"
            ? VehicleService.getAllVehicles(accessToken)
            : Promise.resolve([]),

          LineBusService.getAllLineBus(accessToken),
        ]);

        if (roUsers instanceof Error) throw roUsers;
        const usersFilter = roUsers.length
          ? roUsers.filter(
              (item) =>
                (item.department ?? []).includes(MAINTENANCE) ||
                (item.department ?? []).includes(GPS)
            )
          : [];
        setUsers(usersFilter);
        if (usersFilter.length)
          localStorage.setItem("roUsers", JSON.stringify(usersFilter));

        if (roMotive instanceof Error) throw roMotive;
        const motiveFilter = roMotive.filter((item) =>
          (item.occurrence_type ?? []).includes(Number(param))
        );
        setMotive(motiveFilter);
        if (motiveFilter.length)
          localStorage.setItem("roMotive", JSON.stringify(motiveFilter));

        if (roStatus instanceof Error) throw roStatus;
        setRoStatus(roStatus);
        if (roStatus.length)
          localStorage.setItem("roStatus", JSON.stringify(roStatus));

        if (roCity instanceof Error) throw roCity;
        setCity(roCity);
        if (roCity.length) localStorage.setItem("city", JSON.stringify(roCity));

        if (roOccurrenceType instanceof Error) throw roOccurrenceType;
        setOccurrenceType(roOccurrenceType);
        if (roOccurrenceType.length)
          localStorage.setItem(
            "roOccurrenceType",
            JSON.stringify(roOccurrenceType)
          );

        if (roSector instanceof Error) throw roSector;
        setSector(roSector);
        if (roSector.length)
          localStorage.setItem("roSector", JSON.stringify(roSector));

        if (roOccurrenceList instanceof Error) throw roOccurrenceList;
        setOccurrenceList(roOccurrenceList);
        if (roOccurrenceList.length)
          localStorage.setItem(
            "roOccurrenceList",
            JSON.stringify(roOccurrenceList)
          );
        if (currentSector !== undefined) {
          const occurrenceFilter = roOccurrenceList.filter((item) => {
            return (item.sector_affected ?? []).includes(
              formRef.current?.getData().ro_sector
            );
          });
          setOccurrence(occurrenceFilter);
        }

        if (roVehicles instanceof Error) throw roVehicles;
        setVehicles(roVehicles);
        if (roVehicles.length)
          localStorage.setItem("vehicles", JSON.stringify(roVehicles));

        if (roBusLine instanceof Error) throw roBusLine;
        setBusLine(roBusLine);
        if (roBusLine.length)
          localStorage.setItem("busLine", JSON.stringify(roBusLine));
      } catch (error: any) {
        messageError(handleErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    const occurrenceFilter =
      currentSector !== undefined
        ? occurrenceList.filter((item) => {
            return (item.sector_affected ?? []).includes(currentSector);
          })
        : [];
    setOccurrence(occurrenceFilter);
  }, [currentSector]);

  return (
    <LayoutBaseDePagina
      titulo={
        id === "nova"
          ? `R.O. - Inclusão de Registro de Ocorrência`
          : search
          ? `R.O. - Consulta de Registro de Ocorrência: ${
              formRef.current?.getData().occurrence_number
            }`
          : `R.O. - Alteração da Ocorrência: ${
              formRef.current?.getData().occurrence_number
            }`
      }
      barraDeFerramentas={
        <FerramentasDeDetalhe
          mostrarBotaoSalvar={!search && currentStatus !== FECHADO}
          aoClicarEmSalvar={save}
          mostrarBotaoSalvarEFechar={!search && currentStatus !== FECHADO}
          aoClicarEmSalvarEFechar={saveAndClose}
          mostrarBotaoLimpar={id === "nova" && !search}
          mostrarBotaoVoltar
          aoClicarEmVoltar={() => goBack()}
          mostrarInputNovoSelect={
            !search && currentOccurrenceType === INOCCURRENCE
          }
          arrayNovoSelect={occurrenceType}
          aoClicarEmNovoSelect={(e) => handleChangeOccurrenceTypeRo(Number(e))}
        />
      }
    >
      <Box ml={2}>
        <Card>
          <VForm
            ref={formRef}
            onSubmit={handleSave}
          >
            <Box
              display="flex"
              flexDirection="column"
              variant="outlined"
              component={Paper}
              gap={2}
              padding={2}
            >
              <Box
                display="flex"
                flexDirection="column"
                variant="outlined"
                component={Paper}
              >
                <CardContent>
                  <Grid
                    container
                    direction="row"
                    spacing={2}
                  >
                    {isLoading && (
                      <Grid item>
                        <LinearProgress variant="indeterminate" />
                      </Grid>
                    )}
                    <Grid item>
                      <Typography variant="h6">
                        Detalhes da Ocorrência
                      </Typography>
                    </Grid>
                    <Grid
                      container
                      item
                      direction="row"
                      spacing={2}
                    >
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={1}
                        lg={1}
                        xl={1}
                      >
                        <VTextField
                          fullWidth
                          name="id"
                          label="Cod. ID"
                          disabled
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={2}
                        lg={2}
                        xl={2}
                      >
                        <VTextField
                          fullWidth
                          name="occurrence_number"
                          label="N° Ocorrência"
                          disabled
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={2}
                        lg={2}
                        xl={2}
                      >
                        <VTextField
                          fullWidth
                          name="created_at"
                          label="Data Início"
                          disabled
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={2}
                        lg={2}
                        xl={2}
                      >
                        <VTextField
                          fullWidth
                          name="occurrence_date"
                          label="Data Ocorrência"
                          placeholder="DD/MM/YYYY HH:MM:SS"
                          disabled={
                            !!search || currentDepartment == MAINTENANCE
                          }
                          onChange={() => setChangeForm(true)}
                          InputProps={{
                            inputComponent: InputMask as any,
                            inputProps: {
                              mask: "99/99/9999 99:99:99",
                              maskChar: null,
                            },
                          }}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={2}
                        lg={2}
                        xl={2}
                      >
                        <VTextField
                          fullWidth
                          name="updated_at"
                          label="Última Alteração"
                          disabled
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={1}
                        lg={1}
                        xl={1}
                      >
                        <VTextField
                          fullWidth
                          name="monitor_registration"
                          label="Registrado por:"
                          placeholder="Matrícula do monitor"
                          disabled
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={2}
                        lg={2}
                        xl={2}
                      >
                        <VSelect
                          fullWidth
                          name="ro_status"
                          label="Status da Ocorrência"
                          disabled
                        >
                          {roStatus.map((item) => (
                            <MenuItem
                              key={item.id}
                              value={item.id}
                            >
                              {item.name}
                            </MenuItem>
                          ))}
                        </VSelect>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={3}
                        lg={3}
                        xl={3}
                      >
                        <VSelect
                          fullWidth
                          name="ro_occurrence_type"
                          label="Tipo de Ocorrência"
                          disabled
                        >
                          {occurrenceType.map((item) => (
                            <MenuItem
                              key={item.id}
                              value={item.id}
                            >
                              {item.name}
                            </MenuItem>
                          ))}
                        </VSelect>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={3}
                        lg={3}
                        xl={3}
                      >
                        <VSelect
                          fullWidth
                          name="ro_user"
                          label="Atribuído a"
                          disabled
                        >
                          {users.map((item) => (
                            <MenuItem
                              key={item.id}
                              value={item.id}
                            >
                              {usedName(item.name, item.registration)}
                            </MenuItem>
                          ))}
                        </VSelect>
                      </Grid>
                      {param !== "6" && (
                        <>
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={2}
                            lg={2}
                            xl={2}
                          >
                            <VSelect
                              fullWidth
                              name="ro_car"
                              label="Veículo"
                              disabled={
                                !!search || currentDepartment == MAINTENANCE
                              }
                              onChange={() => setChangeForm(true)}
                            >
                              {vehicles.map((item) => (
                                <MenuItem
                                  key={item.id}
                                  value={item.id}
                                >
                                  {item.car}
                                </MenuItem>
                              ))}
                            </VSelect>
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={2}
                            lg={2}
                            xl={2}
                          >
                            <VTextField
                              fullWidth
                              name="vehicle_kilometer"
                              label="km do Veículo"
                              placeholder="somente números"
                              disabled={
                                !!search || currentDepartment == MAINTENANCE
                              }
                              onChange={() => setChangeForm(true)}
                            />
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={2}
                            lg={2}
                            xl={2}
                          >
                            <VTextField
                              fullWidth
                              name="employee_involved"
                              label="Motorista Envolvido"
                              placeholder="Chapa MOTORISTA"
                              disabled={
                                !!search || currentDepartment == MAINTENANCE
                              }
                              onChange={() => setChangeForm(true)}
                            />
                          </Grid>
                        </>
                      )}
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={2}
                        lg={2}
                        xl={2}
                      >
                        <VSelect
                          fullWidth
                          name="ro_bus_line"
                          label="Linha"
                          disabled={
                            !!search || currentDepartment == MAINTENANCE
                          }
                          onChange={() => setChangeForm(true)}
                        >
                          {busLine.map((item) => (
                            <MenuItem
                              key={item.id}
                              value={item.id}
                            >
                              {item.name}
                            </MenuItem>
                          ))}
                        </VSelect>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={2}
                        lg={2}
                        xl={2}
                      >
                        <VSelect
                          fullWidth
                          name="ro_city"
                          label="Município"
                          disabled={
                            !!search || currentDepartment == MAINTENANCE
                          }
                          onChange={() => setChangeForm(true)}
                        >
                          {city.map((item) => (
                            <MenuItem
                              key={item.id}
                              value={item.id}
                            >
                              {item.name?.toUpperCase()}
                            </MenuItem>
                          ))}
                        </VSelect>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={8}
                        lg={8}
                        xl={8}
                      >
                        <VTextField
                          fullWidth
                          multiline
                          maxRows={5}
                          name="location"
                          label="Localização da ocorrência"
                          placeholder="Endereço detalhado da ocorrência"
                          disabled={
                            !!search || currentDepartment == MAINTENANCE
                          }
                          onChange={() => setChangeForm(true)}
                        />
                      </Grid>
                      {(param === "1" ||
                        param === "2" ||
                        param === "3" ||
                        param === "6") && (
                        <Grid
                          item
                          xs={12}
                          sm={12}
                          md={3}
                          lg={3}
                          xl={3}
                        >
                          <VSelect
                            fullWidth
                            name="ro_motive"
                            label="Motivo da ocorrência"
                            disabled={
                              !!search || currentDepartment == MAINTENANCE
                            }
                            onChange={() => setChangeForm(true)}
                          >
                            {motive.map((item) => (
                              <MenuItem
                                key={item.id}
                                value={item.id}
                              >
                                {item.name}
                              </MenuItem>
                            ))}
                          </VSelect>
                        </Grid>
                      )}
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={2}
                        lg={2}
                        xl={2}
                      >
                        <VSelect
                          name="ro_sector"
                          fullWidth
                          label="Setor Afetado"
                          disabled={
                            !!search || currentDepartment == MAINTENANCE
                          }
                          onChange={(event) => {
                            setCurrentSector(Number(event.target.value));
                            setChangeForm(true);
                          }}
                        >
                          {sector.map((item) => (
                            <MenuItem
                              key={item.id}
                              value={item.id}
                            >
                              {item.name}
                            </MenuItem>
                          ))}
                        </VSelect>
                      </Grid>
                      {(param === "2" || param === "5") && (
                        <>
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={7}
                            lg={7}
                            xl={7}
                          >
                            <VSelect
                              fullWidth
                              name="ro_occurrence"
                              label="Ocorrência"
                              disabled={
                                !!search || currentDepartment == MAINTENANCE
                              }
                              onChange={() => setChangeForm(true)}
                            >
                              {occurrence.map((item) => (
                                <MenuItem
                                  key={item.id}
                                  value={item.id}
                                >
                                  {item.name}
                                </MenuItem>
                              ))}
                            </VSelect>
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={12}
                            lg={12}
                            xl={12}
                          >
                            <VTextField
                              fullWidth
                              multiline
                              maxRows={5}
                              name="occurrence_detail"
                              label="Detalhe da Ocorrência"
                              placeholder="Detalhe a ocorrência (especificar falha do veículo, se for o caso)"
                              disabled={
                                !!search || currentDepartment == MAINTENANCE
                              }
                              onChange={() => setChangeForm(true)}
                            />
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={2}
                            lg={2}
                            xl={2}
                          >
                            <VSelect
                              fullWidth
                              name="sos"
                              label="S.O.S."
                              disabled={
                                !!search || currentDepartment == MAINTENANCE
                              }
                              onChange={() => setChangeForm(true)}
                            >
                              <MenuItem value={1}>1- SIM</MenuItem>
                              <MenuItem value={2}>2- NÃO</MenuItem>
                            </VSelect>
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={2}
                            lg={2}
                            xl={2}
                          >
                            <VSelect
                              fullWidth
                              name="collected"
                              label="Recolhe"
                              disabled={
                                !!search || currentDepartment == MAINTENANCE
                              }
                              onChange={() => setChangeForm(true)}
                            >
                              <MenuItem value={1}>1- SIM</MenuItem>
                              <MenuItem value={2}>2- NÃO</MenuItem>
                            </VSelect>
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={4}
                            lg={4}
                            xl={4}
                          >
                            <VSelect
                              fullWidth
                              name="substitution"
                              label="Gerou Substituição ?"
                              disabled={
                                !!search || currentDepartment == MAINTENANCE
                              }
                              onChange={(event) => {
                                setChangeForm(true);
                                setCurrentSubstitution(
                                  Number(event.target.value) === 3
                                    ? false
                                    : true
                                );
                              }}
                            >
                              <MenuItem value={1}>
                                1- NÃO HOUVE, TÉRMINO DE TABELA
                              </MenuItem>
                              <MenuItem value={2}>2- REASSUMIU</MenuItem>
                              <MenuItem value={3}>3- SUBSTITUÍDO</MenuItem>
                            </VSelect>
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={2}
                            lg={2}
                            xl={2}
                          >
                            <VTextField
                              fullWidth
                              name="substitute_vehicle"
                              label="Veículo Substituto"
                              placeholder="Digite o veículo substituto"
                              disabled={
                                !!search ||
                                currentSubstitution ||
                                currentDepartment == MAINTENANCE
                              }
                              onChange={() => setChangeForm(true)}
                            />
                          </Grid>
                        </>
                      )}
                      {param !== "2" && (
                        <Grid
                          item
                          xs={12}
                          sm={12}
                          md={2}
                          lg={2}
                          xl={2}
                        >
                          <VSelect
                            fullWidth
                            name="direction"
                            label="Sentido"
                            disabled={
                              !!search || currentDepartment == MAINTENANCE
                            }
                            onChange={() => setChangeForm(true)}
                          >
                            <MenuItem value={1}>1- IDA</MenuItem>
                            <MenuItem value={2}>2- VOLTA</MenuItem>
                            <MenuItem value={3}>3- AMBOS</MenuItem>
                          </VSelect>
                        </Grid>
                      )}
                      {param === "2" && (
                        <>
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={4}
                            lg={4}
                            xl={4}
                          >
                            <VTextField
                              fullWidth
                              name="departure_canceled_go_1"
                              label="Partida Cancelada - Ida"
                              placeholder="Utilizar o formato 00:00"
                              disabled={!!search}
                              InputProps={{
                                inputComponent: InputMask as any,
                                inputProps: {
                                  mask: "99:99",
                                  maskChar: null,
                                },
                                endAdornment: (
                                  <InputAdornment position="end">
                                    HH:MM
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={4}
                            lg={4}
                            xl={4}
                          >
                            <VTextField
                              fullWidth
                              name="departure_canceled_return_1"
                              label="Partida Cancelada - Volta"
                              placeholder="Utilizar o formato 00:00"
                              disabled={!!search}
                              InputProps={{
                                inputComponent: InputMask as any,
                                inputProps: {
                                  mask: "99:99",
                                  maskChar: null,
                                },
                                endAdornment: (
                                  <InputAdornment position="end">
                                    HH:MM
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={4}
                            lg={4}
                            xl={4}
                          >
                            <VTextField
                              fullWidth
                              name="interrupted_output"
                              label="Partida Interrompida"
                              placeholder="Utilizar o formato 00:00"
                              disabled={!!search}
                              InputProps={{
                                inputComponent: InputMask as any,
                                inputProps: {
                                  mask: "99:99",
                                  maskChar: null,
                                },
                                endAdornment: (
                                  <InputAdornment position="end">
                                    HH:MM
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={4}
                            lg={4}
                            xl={4}
                          >
                            <VTextField
                              fullWidth
                              name="departure_canceled_go_2"
                              label="Partida Cancelada - Ida"
                              placeholder="Utilizar o formato 00:00"
                              disabled={!!search}
                              InputProps={{
                                inputComponent: InputMask as any,
                                inputProps: {
                                  mask: "99:99",
                                  maskChar: null,
                                },
                                endAdornment: (
                                  <InputAdornment position="end">
                                    HH:MM
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={4}
                            lg={4}
                            xl={4}
                          >
                            <VTextField
                              fullWidth
                              name="departure_canceled_return_2"
                              label="Partida Cancelada - Volta"
                              placeholder="Utilizar o formato 00:00"
                              disabled={!!search}
                              InputProps={{
                                inputComponent: InputMask as any,
                                inputProps: {
                                  mask: "99:99",
                                  maskChar: null,
                                },
                                endAdornment: (
                                  <InputAdornment position="end">
                                    HH:MM
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                        </>
                      )}
                      {param === "4" && (
                        <Grid
                          item
                          xs={12}
                          sm={12}
                          md={4}
                          lg={4}
                          xl={4}
                        >
                          <VTextField
                            fullWidth
                            name="date_restore"
                            label="Data para Restabelecer Transmissão"
                            placeholder="DD/MM/YYYY HH:MM:SS"
                            disabled={
                              !!search || currentDepartment == MAINTENANCE
                            }
                            onChange={() => setChangeForm(true)}
                            InputProps={{
                              inputComponent: InputMask as any,
                              inputProps: {
                                mask: "99/99/9999 99:99:99",
                                maskChar: null,
                              },
                            }}
                          />
                        </Grid>
                      )}
                      {(param === "3" || param === "6") && (
                        <Grid
                          item
                          xs={12}
                          sm={12}
                          md={12}
                          lg={12}
                          xl={12}
                        >
                          <VTextField
                            fullWidth
                            name="deviation_realized"
                            label="Desvio Realizado"
                            placeholder="Insira aqui desvio realizado pelo veículo"
                            multiline
                            maxRows={5}
                            disabled={
                              !!search || currentDepartment == MAINTENANCE
                            }
                            onChange={() => setChangeForm(true)}
                          />
                        </Grid>
                      )}
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={12}
                        lg={12}
                        xl={12}
                      >
                        <VTextField
                          fullWidth
                          multiline
                          rows={3}
                          name="occurrence_response"
                          label="Resposta da Ocorrência pela Manutenção"
                          placeholder="Detalhe o tratamento dado"
                          disabled={
                            !!search ||
                            id === "nova" ||
                            currentDepartment !== MAINTENANCE
                          }
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={12}
                        lg={12}
                        xl={12}
                      >
                        <VTextField
                          fullWidth
                          name="observation"
                          label="Observação"
                          placeholder="Insira aqui observações gerais (se necessário)"
                          multiline
                          rows={3}
                          disabled={!!search}
                        />
                      </Grid>
                    </Grid>
                    {!search && id !== "nova" && (
                      <Grid
                        container
                        item
                        spacing={2}
                        display="flex"
                        direction="row"
                        justifyContent="end"
                      >
                        <Grid
                          item
                          xs={12}
                          sm={12}
                          md={5}
                          lg={5}
                          xl={5}
                        >
                          <VSelect
                            fullWidth
                            name="assign_to"
                            label="Atribuir a..."
                            disabled={currentStatus === FECHADO}
                          >
                            {users.map((item) => (
                              <MenuItem
                                key={item.id}
                                value={`${item.id},${item.department}`}
                              >
                                {`${usedName(item.name, item.registration)} - ${
                                  item.name_main_department
                                }`}
                              </MenuItem>
                            ))}
                          </VSelect>
                        </Grid>
                        <Grid
                          item
                          alignContent="center"
                        >
                          <Button
                            color="primary"
                            variant="outlined"
                            onClick={() => handleAssign(Number(id))}
                            startIcon={<img src={checkCircleRedIcon} />}
                            disabled={currentStatus === FECHADO}
                            style={{ border: "3px solid" }}
                          >
                            <Typography
                              variant="button"
                              whiteSpace="nowrap"
                              textOverflow="ellipsis"
                              overflow="hidden"
                            >
                              Atribuir Ocorrência
                            </Typography>
                          </Button>
                        </Grid>
                        <Grid
                          item
                          alignContent="center"
                        >
                          <Button
                            color="primary"
                            variant="contained"
                            onClick={() => handleApprove(Number(id))}
                            startIcon={<img src={checkCircleIcon} />}
                            disabled={
                              currentStatus === FECHADO ||
                              currentDepartment !== GPS
                            }
                          >
                            <Typography
                              variant="button"
                              whiteSpace="nowrap"
                              textOverflow="ellipsis"
                              overflow="hidden"
                            >
                              Finalizar Ocorrência
                            </Typography>
                          </Button>
                        </Grid>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
                {isLoading && (
                  <Grid item>
                    <LinearProgress variant="indeterminate" />
                  </Grid>
                )}
              </Box>
              {roAuditLog.length > 0 && (
                <Box
                  display="flex"
                  flexDirection="column"
                  variant="outlined"
                  component={Paper}
                >
                  <Box
                    ml={2}
                    mt={2}
                  >
                    <Typography variant="h6">
                      Histórico de Alterações da Ocorrência
                    </Typography>
                  </Box>
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ mt: 2, ml: 2, mr: 2, mb: 2, width: "auto" }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ação Efetuada</TableCell>
                          <TableCell>Quem executou</TableCell>
                          <TableCell>Data</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {roAuditLog.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.action}</TableCell>
                            <TableCell>{row.user_name}</TableCell>
                            <TableCell>
                              {keepDateHour(row.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          </VForm>
        </Card>
      </Box>
    </LayoutBaseDePagina>
  );
};
