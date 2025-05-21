import {
  IconButton,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  Pagination,
  TableFooter,
  Typography,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import {
  IMonitoringCar,
  ISelectMonitoring,
  MonitoramentoService,
} from "../../services/monitoramento/MonitoramentoService";
import {
  ValidatedInterval,
  isRowOld,
  keepDate,
  payloadSearch,
  validatedDate,
} from "../../shared/utils/workingWithDates";
import searchIcon from "../../assets/icons/search.svg";
import editIcon from "../../assets/icons/edit.svg";
import deleteIcon from "../../assets/icons/delete_gray.svg";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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

export const ListagemDeMonitoramento: React.FC = () => {
  const { loggedUser } = useAuthContext();
  const { accessToken } = useAuthContext();
  const { themeName } = useAppThemeContext();
  const { debounce } = useDebounce();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [occurrenceList, setOccurrenceList] = useState<ISelectMonitoring[]>([]);
  const [monitoringList, setMonitoringList] = useState<IMonitoringCar[]>([]);
  const [completedList, setCompletedList] = useState<IMonitoringCar[]>([]);
  const [pagination, setPagination] = useState<number>(1);

  const AGUARDANDO = 1;
  const MONITORAMENTO = 10;
  const FINALIZADO = 3;

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

  const consolidatedList = (result: IMonitoringCar[]) => {
    const summaryQtde = {
      ItemOne: result.length,
      ItemTwo: 0,
      ItemThree: 0,
    };

    result.map((e) => {
      switch (e.type_occurrence[0].id) {
        case 14:
          summaryQtde.ItemTwo++;
          break;
        default:
          summaryQtde.ItemThree++;
          break;
      }
    });

    const newResult: ISelectMonitoring[] = [
      {
        id: 1,
        name: "TOTAL DE CARROS MONITORADOS NO PERÍODO",
        qtde: summaryQtde.ItemOne,
      },
      {
        id: 14,
        name: "SEM OCORRÊNCIA",
        qtde: summaryQtde.ItemTwo,
      },
      {
        id: 99,
        name: "OCORRÊNCIAS ENCONTRADAS",
        qtde: summaryQtde.ItemThree,
      },
    ];
    return newResult;
  };

  const handleChange = (id: number, cod_department: number) => {
    if (!canDo(loggedUser.department, cod_department)) return doNotRun();

    navigate(`/monitoring-car/details/${id}?change=true`);
  };

  const handleDelete = async (
    id: number,
    status: number,
    cod_department: number
  ) => {
    if (!canDo(loggedUser.department, cod_department)) {
      return doNotDelete(
        "Exclusão permitida apenas pelo Monitoramento",
        "Ação não permitida"
      );
    }

    if (status > AGUARDANDO) return doNotRun();

    try {
      setIsLoading(true);
      if (await confirmDialog()) {
        await MonitoramentoService.deleteMonitoringCar(id, accessToken);
        messageSuccess("Registro apagado com sucesso!");
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

  const handleNewMonitoring = () => {
    if (!canDo(loggedUser.department, MONITORAMENTO)) {
      return doNotRun(
        "Inclusão permitida apenas pelo Monitoramento",
        "Ação não permitida"
      );
    }

    navigate("/monitoring-car/details/nova");
  };

  const handleFilterPendingList = async () => {
    setPagination(1);
    setCompletedList(
      completedList.filter(
        (e) =>
          e.monitoring_status[0].cod_department === loggedUser.department[0]
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
          const result = await MonitoramentoService.getAllMonitoringCars(
            payloadSearch(busca, dataInicio, dataFim),
            accessToken
          );
          if (result instanceof Error) throw result;
          setPagination(1);
          setCompletedList(result);
          setOccurrenceList(consolidatedList(result));
        } catch (error: any) {
          messageError(handleErrorMessage(error));
          setCompletedList([]);
          setOccurrenceList([]);
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
      setMonitoringList(completedList.slice(0, Environment.LIMITE_DE_LINHAS));
    } else {
      setMonitoringList(
        completedList.slice(
          Environment.LIMITE_DE_LINHAS * (pagination - 1),
          Environment.LIMITE_DE_LINHAS * pagination
        )
      );
    }
  }, [completedList, pagination]);

  return (
    <LayoutBaseDePagina
      titulo="Monitoramento de Veículos"
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
          aoClicarEmNovo={handleNewMonitoring}
          mostrarBotaoLimpar
          mostrarBotaoPendencia
          aoClicarEmPendencia={handleFilterPendingList}
        />
      }
    >
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ ml: 2, mr: 2, mb: 2, width: "auto" }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Principais Ocorrências</TableCell>
              <TableCell align="center">Quantidade</TableCell>
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
            {occurrenceList.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell align="center">{row.qtde}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ ml: 2, mr: 2, width: "auto" }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código ID</TableCell>
              <TableCell>Matrícula Monitor</TableCell>
              <TableCell>Data Monitoramento</TableCell>
              <TableCell>Veículo</TableCell>
              <TableCell>Matrícula Motorista</TableCell>
              <TableCell>Data Ocorrência</TableCell>
              <TableCell>Ocorrência</TableCell>
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
            {monitoringList.map((row) => (
              <TableRow
                key={row.id}
                style={{
                  backgroundColor:
                    row.monitoring_status[0].id !== FINALIZADO &&
                    isRowOld(String(row.date_check))
                      ? themeName === "dark"
                        ? "#907f4c"
                        : "#ffe1e1"
                      : "transparent",
                }}
              >
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.monitor_registration}</TableCell>
                <TableCell>{keepDate(row.date_check)}</TableCell>
                <TableCell>{row.car}</TableCell>
                <TableCell>{row.driver_registration}</TableCell>
                <TableCell>{keepDate(row.date_occurrence)}</TableCell>
                <TableCell>{row.occurrence[0].name}</TableCell>
                <TableCell>{row.monitoring_status[0].name}</TableCell>
                <TableCell>
                  <Tooltip title="Visualização">
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(
                          `/monitoring-car/details/${row.id}?search=true`
                        )
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
                          Number(row.monitoring_status[0].cod_department)
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
                          row.monitoring_status[0].id,
                          Number(row.monitoring_status[0].cod_department)
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
            {monitoringList.length <= 0 && (
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
