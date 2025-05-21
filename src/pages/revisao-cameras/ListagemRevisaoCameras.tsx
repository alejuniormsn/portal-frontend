import {
  IconButton,
  LinearProgress,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ValidatedInterval,
  isRowOld,
  keepDate,
  keepDateHour,
  payloadSearch,
  validatedDate,
} from "../../shared/utils/workingWithDates";
import {
  ICameraReview,
  RevisaoCameraService,
} from "../../services/revisao-camera/RevisaoCameraService";
import searchIcon from "../../assets/icons/search.svg";
import editIcon from "../../assets/icons/edit.svg";
import deleteIcon from "../../assets/icons/delete_gray.svg";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FerramentasDaListagem } from "../../shared/components";
import { LayoutBaseDePagina } from "../../shared/layouts";
import { useDebounce } from "../../shared/hooks";
import { useAppThemeContext, useAuthContext } from "../../contexts";
import { canDo } from "../../shared/utils/canDo";
import { doNotDelete, doNotRun } from "../../shared/utils/messages/doNotRun";
import { confirmDialog } from "../../shared/utils/messages/confirmDialog";
import { messageError } from "../../shared/utils/messages/messageError";
import { messageSuccess } from "../../shared/utils/messages/messageSuccess";
import { messageWarning } from "../../shared/utils/messages/messageWarning";
import { Environment } from "../../environment";
import { handleErrorMessage } from "../../shared/error/handleErrorMessage";

export const ListagemRevisaoCameras: React.FC = () => {
  const { accessToken } = useAuthContext();
  const { loggedUser } = useAuthContext();
  const { themeName } = useAppThemeContext();
  const { debounce } = useDebounce();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [cameraReviewList, setCameraReviewList] = useState<ICameraReview[]>([]);
  const [completedList, setCompletedList] = useState<ICameraReview[]>([]);
  const [pagination, setPagination] = useState<number>(1);

  const AWAITING_CAMERA_REVIEW = 2;
  const MONITORING = 10;
  const FINALIZADO = 4;

  const busca = useMemo(() => {
    return searchParams.get("busca") || "";
  }, [searchParams]);

  const dataInicio = useMemo(() => {
    return searchParams.get("dataInicio") || "";
  }, [searchParams]);

  const dataFim = useMemo(() => {
    return searchParams.get("dataFim") || "";
  }, [searchParams]);

  const reload = useMemo(() => {
    return searchParams.get("reload") || "";
  }, [searchParams]);

  const handleChange = (id: number, cod_department: number) => {
    if (!canDo(loggedUser.department, cod_department)) return doNotRun();
    navigate(`/camera-review/details/${id}?change=true`);
  };

  const handleDelete = async (
    id: number,
    currentStatus: number,
    cod_department: number
  ) => {
    if (currentStatus >= AWAITING_CAMERA_REVIEW) return doNotDelete();

    if (!canDo(loggedUser.department, cod_department)) {
      return doNotDelete(
        "Exclusão permitida apenas pelo Monitoramento",
        "Ação não permitida"
      );
    }

    try {
      setIsLoading(true);
      if (await confirmDialog()) {
        await RevisaoCameraService.deleteCameraReview(id, accessToken);
        messageSuccess("Registro apagado com sucesso");
        setSearchParams(
          { reload: reload === "true" ? "false" : "true" },
          { replace: true }
        );
      } else {
        return messageWarning("Cancelado pelo usuário");
      }
    } catch (error: any) {
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewCameraReview = () => {
    if (!canDo(loggedUser.department, MONITORING)) {
      return doNotRun(
        "Inclusão permitida apenas pelo Monitoramento",
        "Ação não permitida"
      );
    }

    navigate("/camera-review/details/nova");
  };

  const handleFilterPendingList = async () => {
    setPagination(1);
    setCompletedList(
      completedList.filter(
        (e) => e.camera_status[0].cod_department === loggedUser.department[0]
      )
    );

    messageSuccess("Filtro aplicado.");
  };

  const handleFilterRA = async (busca: string) => {
    setPagination(1);
    setCompletedList(
      completedList.filter((e) =>
        e.ra_globus?.toLowerCase().includes(busca.toLowerCase())
      )
    );

    messageSuccess("Filtro aplicado.");
  };

  useEffect(() => {
    try {
      const validations = [
        {
          fn: () => validatedDate(dataInicio),
          message: "Data inicial inválida",
        },
        {
          fn: () => validatedDate(dataFim),
          message: "Data final inválida",
        },
        {
          fn: () => ValidatedInterval(dataInicio, dataFim),
          message: "Intervalo de datas inválido!",
        },
      ];
      for (const { fn, message } of validations) {
        if (!fn()) throw new Error(message);
      }

      debounce(async () => {
        try {
          setIsLoading(true);
          const result = await RevisaoCameraService.getAllCameraReview(
            payloadSearch(busca, dataInicio, dataFim),
            accessToken
          );
          if (result instanceof Error) throw result;
          setPagination(1);
          setCompletedList(result);
        } catch (error: any) {
          messageError(handleErrorMessage(error));
          setCompletedList([]);
        } finally {
          setIsLoading(false);
        }
      });
    } catch (error: any) {
      messageError(handleErrorMessage(error));
    }
  }, [busca, dataInicio, dataFim, reload]);

  useEffect(() => {
    if (pagination === 1) {
      setCameraReviewList(completedList.slice(0, Environment.LIMITE_DE_LINHAS));
    } else {
      setCameraReviewList(
        completedList.slice(
          Environment.LIMITE_DE_LINHAS * (pagination - 1),
          Environment.LIMITE_DE_LINHAS * pagination
        )
      );
    }
  }, [completedList, pagination]);

  return (
    <LayoutBaseDePagina
      titulo="Solicitação de Revisão de Câmeras"
      barraDeFerramentas={
        <FerramentasDaListagem
          mostrarInputBusca
          placeholderDaBusca="Busca por..."
          mostrarFiltrosDeData
          aoClicarEmFiltros={(busca, inicio, fim) =>
            setSearchParams(
              { busca: busca, dataInicio: inicio, dataFim: fim },
              { replace: true }
            )
          }
          mostrarBotaoNovo
          aoClicarEmNovo={handleNewCameraReview}
          mostrarBotaoLimpar
          mostrarBotaoPendencia
          aoClicarEmPendencia={handleFilterPendingList}
          mostrarFiltroRA
          aoClicarEmFiltroRA={(busca) => handleFilterRA(busca)}
        />
      }
    >
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ ml: 2, mr: 2, width: "auto" }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Veículo</TableCell>
              <TableCell>Matrícula Monitor</TableCell>
              <TableCell>Data Lançamento</TableCell>
              <TableCell>Matrícula Motorista</TableCell>
              <TableCell>Data Ocorrência</TableCell>
              <TableCell>Ocorrência</TableCell>
              <TableCell>N° RA Globus</TableCell>
              <TableCell>Data Revisão</TableCell>
              <TableCell>Revisado Por</TableCell>
              <TableCell>Status</TableCell>
              <TableCell width={105}>Ações</TableCell>
            </TableRow>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={12}>
                  <LinearProgress variant="indeterminate" />
                </TableCell>
              </TableRow>
            )}
          </TableHead>
          <TableBody>
            {cameraReviewList.map((row) => (
              <TableRow
                key={row.id}
                style={{
                  backgroundColor:
                    row.camera_status[0].id !== FINALIZADO &&
                    isRowOld(String(row.updated_at))
                      ? themeName === "dark"
                        ? "#907f4c"
                        : "#ffe1e1"
                      : "transparent",
                }}
              >
                <TableCell>{row.car}</TableCell>
                <TableCell>{row.monitor_registration}</TableCell>
                <TableCell>{keepDate(row.date_camera)}</TableCell>
                <TableCell>{row.driver_registration}</TableCell>
                <TableCell>{keepDate(row.date_occurrence)}</TableCell>
                <TableCell>{row.camera_occurrence[0].name}</TableCell>
                <TableCell>{row.ra_globus}</TableCell>
                <TableCell>{keepDateHour(row.date_review)}</TableCell>
                <TableCell>{row.reviewed_by}</TableCell>
                <TableCell>{row.camera_status[0].name}</TableCell>
                <TableCell>
                  <Tooltip title="Visualização">
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(`/camera-review/details/${row.id}?search=true`)
                      }
                      disabled={false}
                    >
                      <img src={searchIcon} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Alteração / Aprovação">
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleChange(
                          Number(row.id),
                          Number(row.camera_status[0].cod_department)
                        )
                      }
                      disabled={false}
                    >
                      <img src={editIcon} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleDelete(
                          Number(row.id),
                          row.camera_status[0].id,
                          Number(row.camera_status[0].cod_department)
                        )
                      }
                      disabled={false}
                    >
                      <img src={deleteIcon} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            {completedList.length > 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Pagination
                    page={pagination}
                    count={Math.ceil(
                      completedList.length / Environment.LIMITE_DE_LINHAS
                    )}
                    onChange={(_, newPage) => setPagination(newPage)}
                  />
                </TableCell>
              </TableRow>
            )}
            {cameraReviewList.length <= 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography fontSize={16}>
                    {Environment.LISTAGEM_VAZIA}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableFooter>
        </Table>
      </TableContainer>
    </LayoutBaseDePagina>
  );
};
