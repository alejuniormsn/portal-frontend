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
  IUser,
  RegistroUsuarioService,
} from "../../services/users/registro-usuario/RegistroUsuarioService";
import {
  ISacFormTreatment,
  ITreatment,
  SacService,
} from "../../services/sac/SacService";
import saveIcon from "../../assets/icons/save_red.svg";
import addIcon from "../../assets/icons/add_gray.svg";
import deleteIcon from "../../assets/icons/delete.svg";
import * as yup from "yup";
import { VTextField, VForm, useVForm, VSelect } from "../../shared/forms";
import { ISelectMonitoring } from "../../services/monitoramento/MonitoramentoService";
import { dateNow, keepDateHour } from "../../shared/utils/workingWithDates";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FerramentasDeDetalhe } from "../../shared/components";
import { LayoutBaseDePagina } from "../../shared/layouts";
import { useDebounce } from "../../shared/hooks/UseDebounce";
import { messageError } from "../../shared/utils/messages/messageError";
import { messageSuccess } from "../../shared/utils/messages/messageSuccess";
import { confirmDialog } from "../../shared/utils/messages/confirmDialog";
import { useAuthContext } from "../../contexts";
import { strName, usedName } from "../../shared/utils/usedName";
import { messageWarning } from "../../shared/utils/messages/messageWarning";
import { doNotRun } from "../../shared/utils/messages/doNotRun";
import { canAccess } from "../../shared/utils/canAccess";
import { goBack } from "../../shared/utils/goBack";
import { handleErrorMessage } from "../../shared/error/handleErrorMessage";
import { handleValidationFormErrors } from "../../shared/error/handleValidationFormErrors";

const formValidationSchema: yup.SchemaOf<ISacFormTreatment> = yup
  .object()
  .shape({
    sac_group: yup.number().required("Grupo de reclamação é obrigatório"),
    sac_priority: yup.number().required("Prioridade é obrigatória"),
    employee_involved: yup.number().nullable(),
    proceeding: yup.number().required("Campo procedente é obrigatório"),
    video_path: yup.string().nullable(),
    updated_at: yup.string().nullable(),
  });

export const TratativaSac: React.FC = () => {
  const { formRef, save, saveAndClose } = useVForm();
  const { accessToken } = useAuthContext();
  const { loggedUser } = useAuthContext();
  const { id = "nova" } = useParams<"id">();
  const { debounce } = useDebounce();
  const [isLoading, setIsLoading] = useState(false);
  const [sacStatus, setSacStatus] = useState<ISelectMonitoring[]>([]);
  const [sac_priority, setPriority] = useState<ISelectMonitoring[]>([]);
  const [sacGroup, setSacGroup] = useState<ISelectMonitoring[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [sacTreatment, setSacTreatment] = useState<ITreatment[]>([]);
  const [isNewTreatment, setIsNewTreatment] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<number>(0);
  const [currentSacId, setCurrentSacId] = useState<number>(0);
  const [currentDepartment, setCurrentDepartment] = useState<number>(23);
  const [sacOccurrenceType, setSacOccurrenceType] = useState<
    ISelectMonitoring[]
  >([]);
  const [sacSourceChannel, setSacSourceChannel] = useState<ISelectMonitoring[]>(
    []
  );

  const RESOLVED = 3;

  const changeSacTreatment = (id: number | undefined, data: string) => {
    const newTreatment = sacTreatment.map((e) => {
      if (e.id === id) return { ...e, treatment: data };
      else return e;
    });

    setSacTreatment(newTreatment);
    setIsNewTreatment(true);
  };

  const checksBlankTreatment = (dados: ITreatment[]): boolean => {
    const hasItTrue = dados.map((e) => {
      if (e.treatment === null) return true;
      else return false;
    });

    return hasItTrue.some((valor) => valor === true);
  };

  const payload = (data: ISacFormTreatment) => {
    return {
      sac_group: data.sac_group,
      sac_priority: data.sac_priority,
      employee_involved: data.employee_involved ? data.employee_involved : null,
      proceeding: data.proceeding,
      video_path: data.video_path,
      updated_at: dateNow(),
    };
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

  const handleSave = async (dados: ISacFormTreatment) => {
    if (!canAccess(loggedUser.access_level, currentDepartment)) {
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );
    }

    try {
      setIsLoading(true);

      const validatedData = await formValidationSchema.validate(dados, {
        abortEarly: false,
      });

      await SacService.updateSacTreatment(
        Number(id),
        payload(validatedData),
        accessToken
      );

      messageSuccess("Registro salvo com sucesso!");

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

  const handleEndCall = async (id: number) => {
    try {
      const validations = [
        {
          fn: () => currentStatus !== RESOLVED,
          message: "O status não permite está ação",
        },
        {
          fn: () => canAccess(loggedUser.access_level, currentDepartment),
          message:
            "Você precisa de privilégios elevados para executar está ação",
        },
        {
          fn: () => formRef.current?.getData().sac_user === loggedUser.id,
          message:
            "Chamado só pode ser finalizado pelo proprietário. Caso precise finalizá-lo, atribua-o a você!",
        },
        {
          fn: () =>
            sacTreatment.length > 0 && !checksBlankTreatment(sacTreatment),
          message: "Não há tratativas cadastradas ou tratativas em branco.",
        },
        {
          fn: () => !isNewTreatment,
          message: "Tratativa alterada e não salva. Salve-a, por favor.",
        },
      ];
      for (const { fn, message } of validations) {
        if (!fn()) throw new Error(message);
      }

      setIsLoading(true);

      if (await confirmDialog("Deseja finalizar este chamado?")) {
        await SacService.updateStatusSac(
          id,
          payloadApproved(
            `${loggedUser.id},${loggedUser.department}`,
            RESOLVED
          ),
          accessToken
        );

        messageSuccess("Registro salvo com sucesso");

        goBack();
      }
    } catch (error: any) {
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewTreatment = async () => {
    if (isNewTreatment)
      return doNotRun(
        "Tratativa alterada e não salva. Salve-a, por favor.",
        "Ação não permitida"
      );

    try {
      setIsLoading(true);
      const payload = {
        sac_id: currentSacId,
        department_id: loggedUser.department[0],
        department_name: loggedUser.name_main_department,
        user_name: strName(loggedUser.name),
        user_id: loggedUser.id,
        update_user_name: null,
        update_user_id: null,
        treatment: null,
        created_at: dateNow(),
        updated_at: null,
      };

      const result = await SacService.createdSacTreatment(payload, accessToken);

      if (result instanceof Error) throw result;

      setSacTreatment(sacTreatment.concat(result));
    } catch (error: any) {
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTreatment = async (id: number, dados: ITreatment) => {
    if (!dados.treatment) {
      const errorMessage = "Campo de tratativa é de preenchimento obrigatório.";

      formRef.current?.setFieldError("treatment", errorMessage);

      return messageWarning(errorMessage);
    }

    try {
      setIsLoading(true);

      const payload: ITreatment = {
        ...dados,
        update_user_name: strName(loggedUser.name),
        update_user_id: loggedUser.id,
        created_at: undefined,
        updated_at: dateNow(),
      };

      await SacService.updateTreatment(id, payload, accessToken);

      const newTreatments = sacTreatment.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            update_user_name: strName(loggedUser.name),
            update_user_id: loggedUser.id,
            updated_at: dateNow(),
          };
        } else {
          return e;
        }
      });

      setSacTreatment(newTreatments);
      setIsNewTreatment(false);

      messageSuccess("Registro salvo com sucesso");
    } catch (error: any) {
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTreatment = async (id: number) => {
    if (!canAccess(loggedUser.access_level, currentDepartment)) {
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );
    }

    try {
      setIsLoading(true);

      if (await confirmDialog()) {
        await SacService.deleteSacTreatment(id, accessToken);
        const newTreatments = sacTreatment.filter((e) => e.id !== id);
        setIsNewTreatment(false);
        setSacTreatment(newTreatments);
        messageSuccess("Tratativa excluída com sucesso!");
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
      try {
        setIsLoading(true);
        const result = await SacService.getSac(Number(id), accessToken);
        if (result instanceof Error) throw result;

        const transformResult = {
          ...result,
          created_at: keepDateHour(result.created_at),
          updated_at: keepDateHour(result.updated_at),
          sac_status: result.sac_status[0].id,
          sac_gender: result.sac_gender[0].id,
          sac_occurrence_type: result.sac_occurrence_type[0].id,
          sac_source_channel: result.sac_source_channel[0].id,
          sac_priority: result.sac_priority[0].id,
          sac_user: result.sac_user[0].id,
        };

        formRef.current?.setData(transformResult);

        setCurrentStatus(transformResult.sac_status);
        setCurrentSacId(Number(transformResult.id));
        setCurrentDepartment(transformResult.sac_department[0].id);
      } catch (error: any) {
        messageError(handleErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    });
  }, [id]);

  useEffect(() => {
    debounce(async () => {
      try {
        setIsLoading(true);
        const results = await Promise.allSettled([
          SacService.getAllSacStatus(accessToken),
          SacService.getAllSacOccurrenceType(accessToken),
          SacService.getAllSacSourceChannel(accessToken),
          SacService.getAllSacGroup(accessToken),
          SacService.getAllPriority(accessToken),
          SacService.getBySacIdTreatment(Number(id), accessToken),
          RegistroUsuarioService.getAllUsers(accessToken),
        ]);

        const [
          sacStatusResult,
          sacOccurrenceTypeResult,
          sacSourceChannelResult,
          sacGroupResult,
          priorityResult,
          sacTreatmentResult,
          usersResult,
        ] = results;

        setSacStatus(
          sacStatusResult.status === "fulfilled" &&
            !(sacStatusResult.value instanceof Error)
            ? sacStatusResult.value
            : []
        );
        setSacOccurrenceType(
          sacOccurrenceTypeResult.status === "fulfilled" &&
            !(sacOccurrenceTypeResult.value instanceof Error)
            ? sacOccurrenceTypeResult.value
            : []
        );
        setSacSourceChannel(
          sacSourceChannelResult.status === "fulfilled" &&
            !(sacSourceChannelResult.value instanceof Error)
            ? sacSourceChannelResult.value
            : []
        );
        setSacGroup(
          sacGroupResult.status === "fulfilled" &&
            !(sacGroupResult.value instanceof Error)
            ? sacGroupResult.value
            : []
        );
        setPriority(
          priorityResult.status === "fulfilled" &&
            !(priorityResult.value instanceof Error)
            ? priorityResult.value
            : []
        );
        setSacTreatment(
          sacTreatmentResult.status === "fulfilled" &&
            !(sacTreatmentResult.value instanceof Error)
            ? sacTreatmentResult.value
            : []
        );
        setUsers(
          usersResult.status === "fulfilled" &&
            !(usersResult.value instanceof Error)
            ? usersResult.value
            : []
        );
      } catch (error: any) {
        messageError(handleErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    });
  }, [id]);

  return (
    <LayoutBaseDePagina
      titulo={`SAC - Tratativas do Chamado: ${
        formRef.current?.getData().ticket_number
      }`}
      barraDeFerramentas={
        <FerramentasDeDetalhe
          mostrarBotaoSalvar={id === "nova"}
          aoClicarEmSalvar={save}
          mostrarBotaoSalvarEFechar={currentStatus !== RESOLVED}
          aoClicarEmSalvarEFechar={saveAndClose}
          mostrarBotaoFinalizarChamado
          aoClicarEmBotaoFinalizarChamado={() => handleEndCall(Number(id))}
          mostrarBotaoVoltar
          aoClicarEmVoltar={() => window.history.back()}
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
                width="340%"
              >
                <CardContent>
                  {isLoading && <LinearProgress variant="indeterminate" />}
                  <Grid
                    container
                    direction="row"
                    spacing={2}
                  >
                    <Grid item>
                      <Typography variant="h6">Tratativas...</Typography>
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
                        md={6}
                        lg={6}
                        xl={6}
                      >
                        <VTextField
                          fullWidth
                          name="title"
                          label="Título da História"
                          placeholder="Resuma em poucas palavras a ocorrência"
                          disabled
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={6}
                        lg={6}
                        xl={6}
                      >
                        <VTextField
                          fullWidth
                          name="name_cli"
                          label="Nome do Cliente"
                          placeholder="Digite o nome completo"
                          disabled
                        />
                      </Grid>
                      {/* --------------------- Bloco de código das Tratativas do SAC --------------------- */}
                      {sacTreatment.map((item) => (
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
                              <Typography
                                fontSize={14}
                              >{`Tratativa criada: ${strName(
                                item.user_name
                              )} em ${keepDateHour(item.created_at)} ( ${
                                item.department_name
                              } )`}</Typography>
                              {item.update_user_id !== null && (
                                <Typography fontSize={14}>
                                  {`Atualizada: ${
                                    item.update_user_name
                                  } em ${keepDateHour(item.updated_at)}`}
                                </Typography>
                              )}
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
                                minRows={3}
                                disabled={
                                  item.department_id !==
                                  loggedUser.department[0]
                                }
                                onChange={(e) =>
                                  changeSacTreatment(item.id, e.target.value)
                                }
                              />
                            </Grid>
                            {item.department_id ===
                              loggedUser.department[0] && (
                              <Grid
                                container
                                item
                                direction="row"
                                justifyContent="right"
                                gap={2}
                              >
                                <Grid
                                  item
                                  alignContent="center"
                                >
                                  <Button
                                    onClick={() =>
                                      handleDeleteTreatment(item.id)
                                    }
                                    startIcon={<img src={deleteIcon} />}
                                    disabled={false}
                                  >
                                    <Typography
                                      variant="button"
                                      whiteSpace="nowrap"
                                      textOverflow="ellipsis"
                                      overflow="hidden"
                                    >
                                      Excluir
                                    </Typography>
                                  </Button>
                                </Grid>
                                <Grid
                                  item
                                  alignContent="center"
                                >
                                  <Button
                                    onClick={() =>
                                      handleSaveTreatment(item.id, item)
                                    }
                                    startIcon={<img src={saveIcon} />}
                                    disabled={false}
                                  >
                                    <Typography
                                      variant="button"
                                      whiteSpace="nowrap"
                                      textOverflow="ellipsis"
                                      overflow="hidden"
                                    >
                                      Salvar
                                    </Typography>
                                  </Button>
                                </Grid>
                              </Grid>
                            )}
                          </Grid>
                        </>
                      ))}
                      {/* --------------------- */}
                      <Grid
                        container
                        item
                        direction="row"
                        spacing={2}
                        justifyContent="right"
                      >
                        <Grid item>
                          <Button
                            color="primary"
                            variant="contained"
                            onClick={() => handleNewTreatment()}
                            startIcon={<img src={addIcon} />}
                            disabled={currentStatus === RESOLVED}
                          >
                            <Typography
                              variant="button"
                              whiteSpace="nowrap"
                              textOverflow="ellipsis"
                              overflow="hidden"
                            >
                              Adicionar Nova Tratativa
                            </Typography>
                          </Button>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Box>
              <Box
                display="flex"
                flexDirection="column"
                variant="outlined"
                component={Paper}
              >
                <CardContent>
                  <Grid
                    container
                    direction="column"
                    spacing={2}
                  >
                    {isLoading && (
                      <Grid item>
                        <LinearProgress variant="indeterminate" />
                      </Grid>
                    )}
                    <Grid item>
                      <Typography variant="h6">
                        Detalhamento do chamado
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
                        md={6}
                        lg={6}
                        xl={6}
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
                        md={6}
                        lg={6}
                        xl={6}
                      >
                        <VSelect
                          fullWidth
                          name="sac_status"
                          label="Status do Chamado"
                          // disabled
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
                        md={6}
                        lg={6}
                        xl={6}
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
                        md={6}
                        lg={6}
                        xl={6}
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
                        md={6}
                        lg={6}
                        xl={6}
                      >
                        <VSelect
                          fullWidth
                          name="sac_occurrence_type"
                          label="Tipo de Ocorrência"
                          disabled
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
                        md={6}
                        lg={6}
                        xl={6}
                      >
                        <VSelect
                          fullWidth
                          name="sac_source_channel"
                          label="Canal de Origem"
                          disabled
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
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={12}
                        lg={12}
                        xl={12}
                      >
                        <VSelect
                          fullWidth
                          name="sac_user"
                          label="Atribuído a:"
                          disabled
                        >
                          {users.map((item) => (
                            <MenuItem
                              key={item.id}
                              value={item.id}
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
                        xs={12}
                        sm={12}
                        md={6}
                        lg={6}
                        xl={6}
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
                        md={6}
                        lg={6}
                        xl={6}
                      >
                        <VSelect
                          fullWidth
                          name="sac_group"
                          label="Grupo Reclamação"
                          disabled={false}
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
                        md={6}
                        lg={6}
                        xl={6}
                      >
                        <VSelect
                          fullWidth
                          name="sac_priority"
                          label="Prioridade"
                          disabled={false}
                        >
                          {sac_priority.map((item) => (
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
                        md={6}
                        lg={6}
                        xl={6}
                      >
                        <VTextField
                          fullWidth
                          name="employee_involved"
                          label="Colaborador Envolvido"
                          placeholder="Colaborador envolvido"
                          disabled={false}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={6}
                        lg={6}
                        xl={6}
                      >
                        <VSelect
                          fullWidth
                          name="proceeding"
                          label="Procedente ?"
                          disabled={false}
                        >
                          <MenuItem value={1}>SIM</MenuItem>
                          <MenuItem value={2}>NÃO</MenuItem>
                        </VSelect>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={6}
                        lg={6}
                        xl={6}
                      >
                        <VTextField
                          fullWidth
                          name="related_ticket_list"
                          label="Chamados relacionados"
                          placeholder="Chamados relacionados"
                          disabled
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
                          name="video_path"
                          label="Endereço da evidência (caso haja)"
                          placeholder="Endereço da rede para acesso ao vídeo"
                          multiline
                          rows={3}
                          disabled={false}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Box>
            </Box>
          </VForm>
        </Card>
      </Box>
    </LayoutBaseDePagina>
  );
};
