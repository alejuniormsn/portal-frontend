import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  MenuItem,
  OutlinedInput,
  Paper,
  Typography,
} from "@mui/material";
import {
  dateNow,
  keepDateHour,
  keepDateHourToIso,
} from "../../shared/utils/workingWithDates";
import {
  IUser,
  RegistroUsuarioService,
} from "../../services/users/registro-usuario/RegistroUsuarioService";
import {
  IRelatedTicket,
  ISacForm,
  ISacFormUpdate,
  ITreatment,
  SacService,
} from "../../services/sac/SacService";
import {
  formatPhone,
  formatRg,
  onlyNumbers,
} from "../../shared/utils/formatStrings";
import {
  ILineBus,
  LineBusService,
} from "../../services/line-bus/LineBusService";
import {
  IVehicle,
  VehicleService,
} from "../../services/vehicle/VehicleService";
import checkCircleRedIcon from "../../assets/icons/check_circle_red.svg";
import checkCircleIcon from "../../assets/icons/check_circle.svg";
import InputMask from "react-input-mask";
import * as yup from "yup";
import { VTextField, VForm, useVForm, VSelect } from "../../shared/forms";
import { ISelectMonitoring } from "../../services/monitoramento/MonitoramentoService";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { FerramentasDeDetalhe } from "../../shared/components";
import { LayoutBaseDePagina } from "../../shared/layouts";
import { useDebounce } from "../../shared/hooks/UseDebounce";
import { messageError } from "../../shared/utils/messages/messageError";
import { messageSuccess } from "../../shared/utils/messages/messageSuccess";
import { confirmDialog } from "../../shared/utils/messages/confirmDialog";
import { useAuthContext } from "../../contexts";
import { canDo } from "../../shared/utils/canDo";
import { messageWarning } from "../../shared/utils/messages/messageWarning";
import { canAccess } from "../../shared/utils/canAccess";
import { doNotDelete } from "../../shared/utils/messages/doNotRun";
import { strName, usedName } from "../../shared/utils/usedName";
import { GenderService, IGender } from "../../services/gender/GenderService";
import { goBack } from "../../shared/utils/goBack";
import { handleErrorMessage } from "../../shared/error/handleErrorMessage";
import { generateNewNumber } from "../../shared/utils/generateNewNumber";
import { handleValidationFormErrors } from "../../shared/error/handleValidationFormErrors";

const validationSchema = {
  title: yup.string().required("Título é obrigatório"),
  history: yup.string().required("História é obrigatória"),
  name_cli: yup.string().required("Nome do cliente é obrigatório"),
  phone: yup.string().nullable(),
  email: yup.string().nullable().email("Email inválido"),
  rg_cli: yup.string().nullable(),
  sac_gender: yup.number().required("Gênero é obrigatório"),
  sac_occurrence_type: yup
    .number()
    .required("Tipo de ocorrência é obrigatório"),
  sac_source_channel: yup.number().required("Canal de origem é obrigatório"),
  sac_status: yup.number().required("Status do chamado é obrigatório"),
  monitor_registration: yup
    .string()
    .required("Registro do monitor é obrigatório"),
  created_at: yup.string().required("Data de criação é obrigatória"),
  updated_at: yup.string().nullable(),
  date_occurrence: yup.string().required("Data da ocorrência é obrigatória"),
  ticket_number: yup.string().required("Número do chamado é obrigatório"),
};

const formValidationSchema: yup.SchemaOf<ISacForm> = yup
  .object()
  .shape(validationSchema);

const formUpdateValidationSchema: yup.SchemaOf<ISacFormUpdate> = yup
  .object()
  .shape({
    ...validationSchema,
    sac_group: yup.number().required("Grupo do SAC é obrigatório"),
    sac_priority: yup.number().required("Prioridade é obrigatória"),
    proceeding: yup.number().required("Procedência é obrigatória"),
    employee_involved: yup.number().nullable(),
    car: yup.number().required("Veículo é obrigatório"),
    line_bus: yup.number().required("Linha de ônibus é obrigatória"),
    video_path: yup.string().nullable(),
    updated_at: yup.string().required("Data de atualização é obrigatória"),
  });

export const DetalheSac: React.FC = () => {
  const { formRef, save, saveAndClose, isSaveAndClose } = useVForm();
  const { accessToken } = useAuthContext();
  const { loggedUser } = useAuthContext();
  const { id = "nova" } = useParams<"id">();
  const { debounce } = useDebounce();
  const [isLoading, setIsLoading] = useState(false);
  const [sacStatus, setSacStatus] = useState<ISelectMonitoring[]>([]);
  const [sacGender, setSacGender] = useState<IGender[]>([]);
  const [sacPriority, setSacPriority] = useState<ISelectMonitoring[]>([]);
  const [sacGroup, setSacGroup] = useState<ISelectMonitoring[]>([]);
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [busLine, setBusLine] = useState<ILineBus[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [relatedTicketList, setRelatedTicketList] = useState<string | null>("");
  const [sacTreatment, setSacTreatment] = useState<ITreatment[]>([]);
  const [currentStatus, setCurrentStatus] = useState<number>(1);
  const [currentDepartment, setCurrentDepartment] = useState<number>(23);
  const [changeForm, setChangeForm] = useState(false);
  const [searchParams] = useSearchParams();
  const [sacRelatedTicket, setSacRelatedTicket] = useState<IRelatedTicket[]>(
    []
  );
  const [sacOccurrenceType, setSacOccurrenceType] = useState<
    ISelectMonitoring[]
  >([]);
  const [sacSourceChannel, setSacSourceChannel] = useState<ISelectMonitoring[]>(
    []
  );

  const NEW = 1;
  const YES = 1;
  const IN_ATTENTION = 2;
  const RESOLVED = 3;
  const PRIORITY_MEDIUM = 3;

  const search = useMemo(() => {
    return searchParams.get("search") || "";
  }, [searchParams]);

  const reload = useMemo(() => {
    return searchParams.get("reload") || "";
  }, [searchParams]);

  const cleanForm = {
    ticket_number: generateNewNumber(),
    created_at: keepDateHour(dateNow()),
    updated_at: "",
    monitor_registration: loggedUser.registration,
    sac_status: 1,
    title: "",
    history: "",
    name_cli: "",
    phone: "",
    email: "",
    rg_cli: "",
    sac_gender: NaN,
    sac_occurrence_type: NaN,
    sac_source_channel: NaN,
    date_occurrence: "",
    id: "",
  };

  const payload = (data: ISacForm) => {
    return {
      ...data,
      phone: data.phone ? onlyNumbers(data.phone) : null,
      email: data.email ? data.email : null,
      rg_cli: data.rg_cli ? onlyNumbers(data.rg_cli) : null,
      name_cli: data.name_cli.toUpperCase(),
      created_at: keepDateHourToIso(data.created_at),
      date_occurrence: keepDateHourToIso(data.date_occurrence),
      sac_department: loggedUser.department[0],
      sac_priority: PRIORITY_MEDIUM,
      sac_user: loggedUser.id,
      updated_at: dateNow(),
      id: undefined,
    };
  };

  const payloadUpdate = (data: ISacFormUpdate) => {
    return {
      ...data,
      updated_at: dateNow(),
      date_occurrence: keepDateHourToIso(data.date_occurrence),
      phone: data.phone ? onlyNumbers(data.phone) : null,
      email: data.email ? data.email : null,
      video_path: data.video_path ? data.video_path : null,
      rg_cli: data.rg_cli ? onlyNumbers(data.rg_cli) : null,
      related_ticket_list: relatedTicketList ? relatedTicketList : null,
      created_at: undefined,
      assign_to: undefined,
      tickets: undefined,
      id: undefined,
    };
  };

  const handleSave = async (dados: ISacForm) => {
    if (!canAccess(loggedUser.access_level, currentDepartment)) {
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );
    }

    try {
      setIsLoading(true);
      if (id === "nova") {
        const validatedData = await formValidationSchema.validate(dados, {
          abortEarly: false,
        });
        await SacService.createdSac(payload(validatedData), accessToken);
      } else {
        const validatedData = await formUpdateValidationSchema.validate(dados, {
          abortEarly: false,
        });

        await SacService.updateSac(
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

  const handleDelete = async (id: number) => {
    if (currentStatus !== NEW) return doNotDelete();

    if (!canAccess(loggedUser.access_level, currentDepartment)) {
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );
    }

    try {
      setIsLoading(true);

      if (await confirmDialog()) {
        await SacService.deleteSac(id, accessToken);
        messageSuccess("Registro excluído com sucesso!");
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

  const handleRelatedTicket = () => {
    const selectTicket = formRef.current?.getData().tickets;

    if (!selectTicket) return messageWarning("Selecione um chamado.");

    if (relatedTicketList) {
      const hasTicket =
        relatedTicketList.toString().indexOf(selectTicket) != -1;
      if (hasTicket) {
        messageWarning("Chamado já relacionado.");
      } else {
        setRelatedTicketList(relatedTicketList + ", " + selectTicket);
        setChangeForm(true);
      }
    } else {
      setRelatedTicketList(selectTicket);
      setChangeForm(true);
    }

    formRef.current?.setFieldValue("tickets", "");
  };

  const payloadApproved = (data: string, status: number) => {
    const arrayData = data.split(",");
    return {
      updated_at: dateNow(),
      sac_status: status,
      sac_department: arrayData[1],
      sac_user: arrayData[0],
    };
  };

  const handleApprove = async (id: number) => {
    try {
      const validations = [
        {
          fn: () => canDo(loggedUser.department, currentDepartment),
          message:
            "Registro só pode ser alterado pelo departamento proprietário",
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
        {
          fn: () => formRef.current?.getData().assign_to !== undefined,
          message: "Você precisa selecionar um item",
        },
      ];
      for (const { fn, message } of validations) {
        if (!fn()) throw new Error(message);
      }

      setIsLoading(true);

      const data = formRef.current?.getData() as ISacFormUpdate;
      await formUpdateValidationSchema.validate(data, {
        abortEarly: false,
      });

      await SacService.updateStatusSac(
        id,
        payloadApproved(formRef.current?.getData().assign_to, IN_ATTENTION),
        accessToken
      );

      messageSuccess("Enviado com sucesso");

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

  useEffect(() => {
    debounce(async () => {
      if (id === "nova") return formRef.current?.setData(cleanForm);

      try {
        setIsLoading(true);

        const result = await SacService.getSac(Number(id), accessToken);

        if (result instanceof Error) throw result;

        const transformResult = {
          ...result,
          created_at: keepDateHour(result.created_at),
          updated_at: keepDateHour(result.updated_at),
          date_occurrence: keepDateHour(result.date_occurrence),
          sac_status: result.sac_status[0].id,
          phone: formatPhone(result.phone),
          rg_cli: formatRg(result.rg_cli),
          sac_gender: result.sac_gender[0].id,
          sac_occurrence_type: result.sac_occurrence_type[0].id,
          sac_source_channel: result.sac_source_channel[0].id,
          sac_department: result.sac_department[0].id,
          sac_priority: result.sac_priority[0].id,
          ticket_number_integration: result.ticket_number,
          proceeding: result.proceeding ? result.proceeding : YES,
        };
        formRef.current?.setData(transformResult);
        setCurrentStatus(transformResult.sac_status);
        setCurrentDepartment(transformResult.sac_department);
        setRelatedTicketList(transformResult.related_ticket_list);

        if (search) {
          try {
            const result = await SacService.getBySacIdTreatment(
              Number(id),
              accessToken
            );

            if (result instanceof Error) throw result;

            setSacTreatment(result);
          } catch (error: any) {
            setSacTreatment([]);
          }
        }
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

        if (localStorage.getItem("sacUsers")) {
          setUsers(JSON.parse(localStorage.getItem("sacUsers") || "[]"));
          setSacStatus(JSON.parse(localStorage.getItem("sacStatus") || "[]"));
          setSacGender(JSON.parse(localStorage.getItem("sacGender") || "[]"));
          setSacOccurrenceType(
            JSON.parse(localStorage.getItem("sacOccurrenceType") || "[]")
          );
          setSacSourceChannel(
            JSON.parse(localStorage.getItem("sacSourceChannel") || "[]")
          );
          setSacGroup(JSON.parse(localStorage.getItem("sacGroup") || "[]"));
          setSacPriority(
            JSON.parse(localStorage.getItem("sacPriority") || "[]")
          );
          setSacRelatedTicket(
            JSON.parse(localStorage.getItem("sacRelatedTicket") || "[]")
          );
          setVehicles(JSON.parse(localStorage.getItem("vehicles") || "[]"));
          setBusLine(JSON.parse(localStorage.getItem("busLine") || "[]"));
          return;
        }

        const [
          sacUsers,
          sacStatus,
          sacGender,
          sacOccurrenceType,
          sacSourceChannel,
          sacGroup,
          sacPriority,
          sacRelatedTicket,
          sacVehicles,
          sacBusLine,
        ] = await Promise.all([
          RegistroUsuarioService.getAllUsers(accessToken),
          SacService.getAllSacStatus(accessToken),
          GenderService.getAllGender(accessToken),
          SacService.getAllSacOccurrenceType(accessToken),
          SacService.getAllSacSourceChannel(accessToken),
          SacService.getAllSacGroup(accessToken),
          SacService.getAllPriority(accessToken),
          SacService.getAllRelatedTicket(accessToken),
          VehicleService.getAllVehicles(accessToken),
          LineBusService.getAllLineBus(accessToken),
        ]);

        if (sacUsers instanceof Error) throw sacUsers;
        setUsers(sacUsers);
        localStorage.setItem("sacUsers", JSON.stringify(sacUsers));

        if (sacStatus instanceof Error) throw sacStatus;
        setSacStatus(sacStatus);
        localStorage.setItem("sacStatus", JSON.stringify(sacStatus));

        if (sacGender instanceof Error) throw sacGender;
        setSacGender(sacGender);
        localStorage.setItem("sacGender", JSON.stringify(sacGender));

        if (sacOccurrenceType instanceof Error) throw sacOccurrenceType;
        setSacOccurrenceType(sacOccurrenceType);
        localStorage.setItem(
          "sacOccurrenceType",
          JSON.stringify(sacOccurrenceType)
        );

        if (sacSourceChannel instanceof Error) throw sacSourceChannel;
        setSacSourceChannel(sacSourceChannel);
        localStorage.setItem(
          "sacSourceChannel",
          JSON.stringify(sacSourceChannel)
        );

        if (sacGroup instanceof Error) throw sacGroup;
        setSacGroup(sacGroup);
        localStorage.setItem("sacGroup", JSON.stringify(sacGroup));

        if (sacPriority instanceof Error) throw sacPriority;
        setSacPriority(sacPriority);
        localStorage.setItem("sacPriority", JSON.stringify(sacPriority));

        if (sacRelatedTicket instanceof Error) throw sacRelatedTicket;
        setSacRelatedTicket(sacRelatedTicket);
        localStorage.setItem(
          "sacRelatedTicket",
          JSON.stringify(sacRelatedTicket)
        );

        if (sacVehicles instanceof Error) throw sacVehicles;
        setVehicles(sacVehicles);
        localStorage.setItem("vehicles", JSON.stringify(sacVehicles));

        if (sacBusLine instanceof Error) throw sacBusLine;
        setBusLine(sacBusLine);
        localStorage.setItem("busLine", JSON.stringify(sacBusLine));
      } catch (error: any) {
        messageError(handleErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  return (
    <LayoutBaseDePagina
      titulo={
        id === "nova"
          ? `SAC - Inclusão do Chamado`
          : search
          ? `SAC - Chamado: ${formRef.current?.getData().ticket_number}`
          : `SAC - Alteração do Chamado: ${
              formRef.current?.getData().ticket_number
            }`
      }
      barraDeFerramentas={
        <FerramentasDeDetalhe
          mostrarBotaoSalvar={!search && currentStatus !== RESOLVED}
          aoClicarEmSalvar={save}
          mostrarBotaoSalvarEFechar={!search && currentStatus !== RESOLVED}
          aoClicarEmSalvarEFechar={saveAndClose}
          mostrarBotaoLimpar={id === "nova" && !search}
          mostrarBotaoApagar={
            id !== "nova" && !search && currentStatus !== RESOLVED
          }
          aoClicarEmApagar={() => handleDelete(Number(id))}
          mostrarBotaoVoltar
          aoClicarEmVoltar={() => goBack()}
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
              flexDirection="row"
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
                  {isLoading && (
                    <Grid item>
                      <LinearProgress variant="indeterminate" />
                    </Grid>
                  )}
                  <Grid
                    container
                    direction="row"
                    spacing={2}
                  >
                    <Grid item>
                      <Typography variant="h6">
                        {search
                          ? "Detalhes da ocorrência"
                          : "Descreva a ocorrência com a empresa"}
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
                          name="ticket_number"
                          label="N° Chamado"
                          disabled
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={2.5}
                        lg={2.5}
                        xl={2.5}
                      >
                        <VTextField
                          fullWidth
                          name="created_at"
                          label="Data de Abertura"
                          disabled
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={2.5}
                        lg={2.5}
                        xl={2.5}
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
                        md={2}
                        lg={2}
                        xl={2}
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
                          name="sac_status"
                          label="Status do Chamado"
                          disabled
                        >
                          {sacStatus.map((item) => (
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
                        md={9}
                        lg={9}
                        xl={9}
                      >
                        <VTextField
                          fullWidth
                          name="title"
                          label="Título da História"
                          placeholder="Resuma em poucas palavras a ocorrência"
                          disabled={!!search || currentStatus !== NEW}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={3}
                        lg={3}
                        xl={3}
                      >
                        <VTextField
                          fullWidth
                          name="date_occurrence"
                          label="Data e Hora da ocorrência"
                          placeholder="DD/MM/YYYY HH:MM:SS"
                          disabled={!!search || currentStatus !== NEW}
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
                        md={12}
                        lg={12}
                        xl={12}
                      >
                        <VTextField
                          fullWidth
                          name="history"
                          label="História do Cliente"
                          placeholder="Escreva aqui detalhes da ocorrência"
                          multiline
                          maxRows={7}
                          disabled={!!search || currentStatus !== NEW}
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
                          name="name_cli"
                          label="Nome do Cliente"
                          placeholder="Digite o nome completo"
                          disabled={!!search || currentStatus !== NEW}
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
                          name="phone"
                          label="Telefone"
                          placeholder="Telefone com 11 dígitos"
                          disabled={!!search}
                          InputProps={{
                            inputComponent: InputMask as any,
                            inputProps: {
                              mask: "(99) 99999-9999",
                              maskChar: null,
                            },
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
                          name="email"
                          type="email"
                          label="E-Mail"
                          placeholder="email@address.com"
                          disabled={!!search}
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
                          name="rg_cli"
                          label="RG ou CPF"
                          placeholder="Digite o RG ou CPF do cliente"
                          disabled={!!search || currentStatus !== NEW}
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
                        <VSelect
                          fullWidth
                          name="sac_gender"
                          label="Gênero"
                          disabled={!!search || currentStatus !== NEW}
                        >
                          {sacGender.map((item) => (
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
                        md={4}
                        lg={4}
                        xl={4}
                      >
                        <VSelect
                          fullWidth
                          name="sac_occurrence_type"
                          label="Tipo de Ocorrência"
                          disabled={!!search}
                        >
                          {sacOccurrenceType.map((item) => (
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
                        md={4}
                        lg={4}
                        xl={4}
                      >
                        <VSelect
                          fullWidth
                          name="sac_source_channel"
                          label="Canal de Origem"
                          disabled={!!search || currentStatus !== NEW}
                        >
                          {sacSourceChannel.map((item) => (
                            <MenuItem
                              key={item.id}
                              value={item.id}
                            >
                              {item.name}
                            </MenuItem>
                          ))}
                        </VSelect>
                      </Grid>
                      {id !== "nova" && (
                        <>
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
                              name="car"
                              label="Veículo"
                              disabled={!!search}
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
                            md={4}
                            lg={4}
                            xl={4}
                          >
                            <VSelect
                              fullWidth
                              name="line_bus"
                              label="Linha"
                              disabled={!!search}
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
                            md={4}
                            lg={4}
                            xl={4}
                          >
                            <VTextField
                              fullWidth
                              name="employee_involved"
                              label="Colaborador Envolvido"
                              placeholder="Colaborador envolvido"
                              disabled={!!search}
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
                            <VSelect
                              fullWidth
                              name="sac_group"
                              label="Grupo Reclamação"
                              disabled={!!search}
                              onChange={() => setChangeForm(true)}
                            >
                              {sacGroup.map((item) => (
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
                            md={4}
                            lg={4}
                            xl={4}
                          >
                            <VSelect
                              fullWidth
                              name="sac_priority"
                              label="Prioridade"
                              disabled={!!search}
                              onChange={() => setChangeForm(true)}
                            >
                              {sacPriority.map((item) => (
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
                            md={4}
                            lg={4}
                            xl={4}
                          >
                            <VSelect
                              fullWidth
                              name="proceeding"
                              label="Procedente ?"
                              disabled={!!search}
                              onChange={() => setChangeForm(true)}
                            >
                              <MenuItem value={1}>SIM</MenuItem>
                              <MenuItem value={2}>NÃO</MenuItem>
                            </VSelect>
                          </Grid>
                          <Grid
                            container
                            item
                            direction="row"
                            spacing={2}
                            justifyContent="left"
                          >
                            <Grid
                              item
                              xs={12}
                              sm={12}
                              md={4}
                              lg={4}
                              xl={4}
                            >
                              <OutlinedInput
                                fullWidth
                                name="related_ticket_list"
                                value={relatedTicketList}
                                placeholder="Número dos chamados relacionados"
                                disabled
                              />
                            </Grid>
                            {!search && (
                              <>
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
                                    name="tickets"
                                    label="Lista de chamados a serem relacionados"
                                    disabled={currentStatus === RESOLVED}
                                  >
                                    {sacRelatedTicket.map((item) => (
                                      <MenuItem
                                        key={item.id}
                                        value={item.ticket_number}
                                      >
                                        {`${item.ticket_number} - ${item.title}`}
                                      </MenuItem>
                                    ))}
                                  </VSelect>
                                </Grid>
                                <Grid
                                  item
                                  display={"flex"}
                                  flexDirection={"row"}
                                  gap={2}
                                >
                                  <Box>
                                    <Button
                                      color="primary"
                                      variant="outlined"
                                      onClick={() => handleRelatedTicket()}
                                      startIcon={
                                        <img src={checkCircleRedIcon} />
                                      }
                                      disabled={currentStatus === RESOLVED}
                                      style={{ border: "3px solid" }}
                                    >
                                      <Typography
                                        variant="button"
                                        whiteSpace="nowrap"
                                        textOverflow="ellipsis"
                                        overflow="hidden"
                                      >
                                        Relacionar Chamados
                                      </Typography>
                                    </Button>
                                  </Box>
                                  <Box>
                                    <Button
                                      color="primary"
                                      variant="outlined"
                                      onClick={() => setRelatedTicketList("")}
                                      startIcon={
                                        <img src={checkCircleRedIcon} />
                                      }
                                      disabled={currentStatus === RESOLVED}
                                      style={{ border: "3px solid" }}
                                    >
                                      <Typography
                                        variant="button"
                                        whiteSpace="nowrap"
                                        textOverflow="ellipsis"
                                        overflow="hidden"
                                      >
                                        Limpar
                                      </Typography>
                                    </Button>
                                  </Box>
                                </Grid>
                              </>
                            )}
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
                              name="video_path"
                              label="Endereço da evidência (caso haja)"
                              placeholder="Endereço da rede para acesso ao vídeo"
                              multiline
                              rows={3}
                              disabled={!!search}
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                    {/* --------------------- */}
                    {!!search &&
                      sacTreatment.map((item) => (
                        <>
                          <Grid
                            container
                            direction="row"
                            ml={2}
                            mt={2}
                            border={1}
                            borderRadius={1}
                            padding={2}
                            borderColor="#c1c1c1"
                            key={item.id}
                          >
                            <Grid item>
                              <Typography fontSize={14}>
                                Tratativa: {item.department_name}
                              </Typography>
                              <Typography fontSize={14}>
                                Criada por: {strName(item.user_name)} em{" "}
                                {keepDateHour(item.created_at)}
                              </Typography>
                              <Typography
                                fontSize={14}
                                mb={1}
                              >
                                Atualizado em: {keepDateHour(item.updated_at)}{" "}
                                por: {item.update_user_name}
                              </Typography>
                            </Grid>
                            <Grid
                              item
                              mb={1}
                              xs={12}
                              sm={12}
                              md={12}
                              lg={12}
                              xl={12}
                            >
                              <OutlinedInput
                                fullWidth
                                id="sac_treatment"
                                placeholder="Digite sua tratativa..."
                                value={item.treatment}
                                multiline
                                maxRows={6}
                                minRows={2}
                                disabled
                              />
                            </Grid>
                          </Grid>
                        </>
                      ))}
                    {/* --------------------- */}

                    {!search && id !== "nova" ? (
                      <Grid
                        container
                        item
                        direction="row"
                        spacing={2}
                        justifyContent="right"
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
                            disabled={currentStatus === RESOLVED}
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
                            variant="contained"
                            onClick={() => handleApprove(Number(id))}
                            startIcon={<img src={checkCircleIcon} />}
                            disabled={currentStatus === RESOLVED || isLoading}
                          >
                            <Typography
                              variant="button"
                              whiteSpace="nowrap"
                              textOverflow="ellipsis"
                              overflow="hidden"
                            >
                              Atribuir Chamado
                            </Typography>
                          </Button>
                        </Grid>
                      </Grid>
                    ) : null}
                  </Grid>
                </CardContent>
                {isLoading && (
                  <Grid item>
                    <LinearProgress variant="indeterminate" />
                  </Grid>
                )}
              </Box>
            </Box>
          </VForm>
        </Card>
      </Box>
    </LayoutBaseDePagina>
  );
};
