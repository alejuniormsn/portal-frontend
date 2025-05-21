import { useEffect, useMemo, useState } from "react";
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
  ISelectMaintenance,
  IMaintenanceCar,
  ManutencaoService,
} from "../../services/manutencao/ManutencaoService";
import {
  ValidatedInterval,
  isRowOld,
  keepDate,
  payloadSearch,
  validatedDate,
} from "../../shared/utils/workingWithDates";
import MaintenanceListPDF from "./report/ListagemManutencao";
import filterGrayIcon from "../../assets/icons/filter_gray.svg";
import searchIcon from "../../assets/icons/search.svg";
import editIcon from "../../assets/icons/edit.svg";
import deleteIcon from "../../assets/icons/delete_gray.svg";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FerramentasDaListagem } from "../../shared/components";
import { LayoutBaseDePagina } from "../../shared/layouts";
import { useDebounce } from "../../shared/hooks";
import { canDo } from "../../shared/utils/canDo";
import { useAuthContext } from "../../contexts";
import { doNotDelete, doNotRun } from "../../shared/utils/messages/doNotRun";
import { confirmDialog } from "../../shared/utils/messages/confirmDialog";
import { messageError } from "../../shared/utils/messages/messageError";
import { messageSuccess } from "../../shared/utils/messages/messageSuccess";
import { messageWarning } from "../../shared/utils/messages/messageWarning";
import { Environment } from "../../environment";
import { canRegister } from "../../shared/utils/canRegister";
import { handleErrorMessage } from "../../shared/error/handleErrorMessage";

export const ListagemDeManutencao: React.FC = () => {
  const { loggedUser } = useAuthContext();
  const { accessToken } = useAuthContext();
  const { debounce } = useDebounce();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<number>(1);
  const [maintenanceTypes, setMaintenanceTypes] = useState<
    ISelectMaintenance[]
  >([]);
  const [completedList, setCompletedList] = useState<IMaintenanceCar[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<IMaintenanceCar[]>([]);
  const [filterApplied, setFilterApplied] = useState(false);

  const AGUARDANDO = 1;
  const MANUTENCAO = 14;
  const APROVADO = 4;
  const CANCELADO = 5;

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

  const consolidatedList = (
    result: IMaintenanceCar[],
    resultTypes: ISelectMaintenance[]
  ) => {
    const summary = {
      ItemOne: 0,
      ItemTwo: 0,
      ItemThree: 0,
      ItemFour: 0,
    };
    result.map((e) => {
      switch (e.types[0].id) {
        case 5:
          summary.ItemOne++;
          break;
        case 6:
          summary.ItemTwo++;
          break;
        case 7:
          summary.ItemThree++;
          break;
        default:
          summary.ItemFour++;
          break;
      }
    });

    const types = resultTypes.map((e) => ({
      id: e.id,
      name: e.name,
      qtde:
        e.id === 5
          ? summary.ItemOne
          : e.id === 6
          ? summary.ItemTwo
          : e.id === 7
          ? summary.ItemThree
          : summary.ItemFour,
    }));
    return types;
  };

  const handleChange = (
    id: number,
    status: number,
    cod_department: number,
    registration_source: number
  ) => {
    const validations = [
      {
        condition: status === APROVADO,
        action: () => doNotRun(),
      },
      {
        condition: !canDo(loggedUser.department, cod_department),
        action: () => doNotRun(),
      },
      {
        condition: !canRegister(loggedUser.registration, registration_source),
        action: () =>
          doNotRun(
            `Alteração permitida apenas para a chapa: ${registration_source}`,
            "Ação não permitida"
          ),
      },
    ];
    for (const { condition, action } of validations) {
      if (condition) return action();
    }
    navigate(`/maintenance-car/details/${id}?change=true`);
  };

  const handleDelete = async (
    id: number,
    status: number,
    cod_department: number,
    registration_source: number
  ) => {
    const validations = [
      {
        condition: status !== AGUARDANDO,
        action: () => doNotRun(),
      },
      {
        condition: !canDo(loggedUser.department, cod_department),
        action: () =>
          doNotDelete(
            "Exclusão permitida apenas pela Manutenção no status",
            "Ação não permitida"
          ),
      },
      {
        condition: !canRegister(loggedUser.registration, registration_source),
        action: () =>
          doNotRun(
            `Registro só pode ser deletado pela chapa ${registration_source}`,
            "Ação não permitida"
          ),
      },
    ];
    for (const { condition, action } of validations) {
      if (condition) return action();
    }

    try {
      setIsLoading(true);
      if (await confirmDialog()) {
        await ManutencaoService.deleteMaintenanceCar(id, accessToken);
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

  const handleNewMaintenance = () => {
    if (!canDo(loggedUser.department, MANUTENCAO)) {
      return doNotRun(
        "Inclusão permitida apenas pela Manutenção",
        "Ação não permitida"
      );
    }
    navigate("/maintenance-car/details/nova");
  };

  const handlePrintList = () => {
    const filterList = maintenanceList.filter(
      (e) => e.status[0].id !== CANCELADO
    );
    if (filterList.length === 0) {
      return messageWarning("Não há dados para impressão");
    } else {
      MaintenanceListPDF(filterList);
    }
  };

  const handleFilterPendingList = async () => {
    setPagination(1);
    setMaintenanceList(completedList.filter((e) => e.status[0].id < APROVADO));
    messageSuccess("Filtro aplicado.");
    setFilterApplied(true);
  };

  const handleFilterMaintenanceList = async (id: number) => {
    setPagination(1);
    setMaintenanceList(completedList.filter((e) => e.types[0].id === id));
    setFilterApplied(true);
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
          const [result, resultTypes] = await Promise.all([
            ManutencaoService.getAllMaintenanceCars(
              payloadSearch(busca, dataInicio, dataFim),
              accessToken
            ),
            ManutencaoService.getAllMaintenanceTypes(accessToken),
          ]);

          if (result instanceof Error) throw result;
          setCompletedList(result);

          if (resultTypes instanceof Error) throw resultTypes;
          setMaintenanceTypes(consolidatedList(result, resultTypes));
          setPagination(1);
          setFilterApplied(false);
        } catch (error: any) {
          messageError(handleErrorMessage(error));
          setCompletedList([]);
          setMaintenanceTypes([]);
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
      setMaintenanceList(completedList.slice(0, Environment.LIMITE_DE_LINHAS));
    } else {
      setMaintenanceList(
        completedList.slice(
          Environment.LIMITE_DE_LINHAS * (pagination - 1),
          Environment.LIMITE_DE_LINHAS * pagination
        )
      );
    }
  }, [completedList, pagination]);

  return (
    <LayoutBaseDePagina
      titulo="Pedido de Veículos para Manutenção"
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
          mostrarBotaoPendencia
          aoClicarEmPendencia={handleFilterPendingList}
          mostrarBotaoLimpar
          mostrarBotaoNovo
          aoClicarEmNovo={handleNewMaintenance}
          mostrarBotaoPDF
          aoClicarEmPDF={handlePrintList}
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
              <TableCell>Pedidos de Manutenção de Veículo</TableCell>
              <TableCell align="center">Quantidade</TableCell>
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
            {maintenanceTypes.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell align="center">{row.qtde}</TableCell>
                <TableCell>
                  <Tooltip title="Aplicar Filtro">
                    <IconButton
                      size="small"
                      onClick={() => handleFilterMaintenanceList(row.id)}
                      disabled={false}
                    >
                      <img src={filterGrayIcon} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
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
              <TableCell>Veículo</TableCell>
              <TableCell>Veículo pedido para:</TableCell>
              <TableCell>Tipo de manutenção</TableCell>
              <TableCell>Detalhamento da manutenção</TableCell>
              <TableCell>Lançado por:</TableCell>
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
            {maintenanceList.map((row) => (
              <TableRow
                key={row.id}
                style={{
                  backgroundColor:
                    row.status[0].id !== APROVADO &&
                    isRowOld(String(row.created_at))
                      ? "#ffcece"
                      : "transparent",
                }}
              >
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.car}</TableCell>
                <TableCell>{keepDate(row.date_maintenance)}</TableCell>
                <TableCell>{row.types[0].name}</TableCell>
                <TableCell>{row.details[0].name}</TableCell>
                <TableCell>{row.registration_source}</TableCell>
                <TableCell>{row.status[0].name}</TableCell>
                <TableCell>
                  <Tooltip title="Visualização">
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(
                          `/maintenance-car/details/${row.id}?search=true`
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
                          row.status[0].id,
                          row.status[0].cod_department,
                          row.registration_source
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
                          row.status[0].id,
                          row.status[0].cod_department,
                          row.registration_source
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
            {completedList.length > 0 && !filterApplied ? (
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
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography fontSize={16}>Filtro aplicado !</Typography>
                </TableCell>
              </TableRow>
            )}
            {maintenanceList.length <= 0 && (
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
