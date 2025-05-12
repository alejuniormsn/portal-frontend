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
  isRowOld,
  keepDateHour,
  payloadSearch,
  validatedDate,
  ValidatedInterval,
} from "../../shared/utils/workingWithDates";
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
import { messageError } from "../../shared/utils/messages/messageError";
import { messageWarning } from "../../shared/utils/messages/messageWarning";
import { Environment } from "../../environment";
import { IRo, ISelect, RoService } from "../../services/ro/RoService";
import { confirmDialog } from "../../shared/utils/messages/confirmDialog";
import { messageSuccess } from "../../shared/utils/messages/messageSuccess";
import { usedName } from "../../shared/utils/usedName";
import { handleErrorMessage } from "../../shared/error/handleErrorMessage";
import { canAccess } from "../../shared/utils/canAccess";
import { removeAccents } from "../../shared/utils/removeAccents";

export const ListagemRo: React.FC = () => {
  const { accessToken } = useAuthContext();
  const { loggedUser } = useAuthContext();
  const { themeName } = useAppThemeContext();
  const { debounce } = useDebounce();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [RoList, setRoList] = useState<IRo[]>([]);
  const [completedList, setCompletedList] = useState<IRo[]>([]);
  const [pagination, setPagination] = useState<number>(1);
  const [roOccurrenceType, setRoOccurrenceType] = useState<ISelect[]>([]);

  const FECHADO = 2;
  const GPS = 15;

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

  const handleChange = (
    id: number,
    currentStatus: number,
    ro_department: number,
    ro_occurrence_type: number
  ) => {
    if (currentStatus === FECHADO) return doNotRun();

    if (!canDo(loggedUser.department, ro_department)) {
      return doNotRun(
        "Registro só pode ser alterado pelo departamento proprietário",
        "Ação não permitida"
      );
    }

    navigate(`/ro/details/${id}?param=${ro_occurrence_type}&reload=false`);
  };

  const handleDelete = async (
    id: number,
    currentStatus: number,
    department: number
  ) => {
    const validations = [
      {
        condition: currentStatus === FECHADO,
        action: () => doNotDelete(),
      },
      {
        condition: !canAccess(loggedUser.access_level, department),
        action: () =>
          messageWarning(
            "Você precisa de privilégios elevados para executar está ação"
          ),
      },
      {
        condition: !canDo(loggedUser.department, GPS),
        action: () =>
          doNotDelete(
            "Exclusão permitida apenas pelo GPS se não estiver finalizados",
            "Ação não permitida."
          ),
      },
      {
        condition: !canDo(loggedUser.department, department),
        action: () =>
          doNotDelete(
            "Exclusão permitida apenas pelo GPS quando este for o proprietário",
            "Ação não permitida."
          ),
      },
    ];
    for (const { condition, action } of validations) {
      if (condition) return action();
    }

    try {
      setIsLoading(true);

      if (await confirmDialog()) {
        await RoService.deleteRo(id, accessToken);
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

  const handleNewRo = (param: number) => {
    if (!canDo(loggedUser.department, GPS)) {
      return doNotRun(
        "Ação permitida apenas pelo setor responsável",
        "Ação não permitida"
      );
    }

    if (!param) return messageWarning("Selecione um tipo de ocorrência.");

    navigate(`/ro/details/nova?param=${param}`);
  };

  const handleFilterPendingList = async () => {
    setPagination(1);
    setCompletedList(
      completedList.filter((e) => e.ro_status[0].id !== FECHADO)
    );

    messageSuccess("Filtro 'Pendência' aplicado.");
  };

  const handleFilterOccurrenceType = async (busca: string) => {
    if (busca === "")
      return messageWarning("Insira um tipo de ocorrência no campo de busca.");

    const normalizedBusca = removeAccents(busca.toLowerCase());

    setPagination(1);
    setCompletedList(
      completedList.filter(
        (e) =>
          e.ro_occurrence_type[0].name &&
          removeAccents(e.ro_occurrence_type[0].name.toLowerCase()).includes(
            normalizedBusca
          )
      )
    );

    messageSuccess("Filtro 'Tipo de Ocorrência' aplicado.");
  };

  const handleFilterResponsible = async (busca: string) => {
    if (busca === "")
      return messageWarning(
        "Insira um responsável pela ocorrência no campo de busca."
      );

    const normalizedBusca = removeAccents(busca.toLowerCase());

    setPagination(1);
    setCompletedList(
      completedList.filter(
        (e) =>
          e.ro_user[0].name &&
          removeAccents(e.ro_user[0].name.toLowerCase()).includes(
            normalizedBusca
          )
      )
    );

    messageSuccess("Filtro 'Responsável pela Ocorrência' aplicado.");
  };

  const handleFilterCar = async (busca: string) => {
    if (busca === "")
      return messageWarning("Insira o número de um carro no campo de busca.");

    setPagination(1);
    setCompletedList(
      completedList.filter(
        (e) => e.ro_car[0].car && e.ro_car[0].car === Number(busca)
      )
    );

    messageSuccess("Filtro 'por Carro' aplicado.");
  };

  const handleFilterLine = async (busca: string) => {
    if (busca === "")
      return messageWarning("Insira uma linha no campo de busca.");

    setPagination(1);
    setCompletedList(
      completedList.filter(
        (e) =>
          e.ro_bus_line[0].name &&
          e.ro_bus_line[0].name.toLowerCase().includes(busca.toLowerCase())
      )
    );

    messageSuccess("Filtro 'por Linha' aplicado.");
  };

  const countFilledFields = (ro: IRo): string => {
    if (!ro.ro_occurrence_type || ro.ro_occurrence_type[0]?.id !== 2) {
      return "";
    }
    const fields = [
      ro.departure_canceled_go_1,
      ro.departure_canceled_go_2,
      ro.departure_canceled_return_1,
      ro.departure_canceled_return_2,
    ];
    const count = fields.filter(
      (field) => typeof field === "string" && field !== null && field !== ""
    ).length;
    return count > 0 ? ` - Cancelamentos: ${count}` : "";
  };

  useEffect(() => {
    debounce(async () => {
      try {
        setIsLoading(true);

        const result = await RoService.getAllRoOccurrenceType(accessToken);

        if (result instanceof Error) throw result;
        setRoOccurrenceType(result);
      } catch (error: any) {
        messageError(handleErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

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
          const result = await RoService.getAllRo(
            payloadSearch(busca, dataInicio, dataFim),
            accessToken
          );

          if (result instanceof Error) throw result;
          setCompletedList(result);

          setPagination(1);
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
    if (pagination === 1)
      setRoList(completedList.slice(0, Environment.LIMITE_DE_LINHAS));
    else
      setRoList(
        completedList.slice(
          Environment.LIMITE_DE_LINHAS * (pagination - 1),
          Environment.LIMITE_DE_LINHAS * pagination
        )
      );
  }, [completedList, pagination]);

  return (
    <LayoutBaseDePagina
      titulo="R.O. - Registro de Ocorrência Operacional"
      barraDeFerramentas={
        <FerramentasDaListagem
          mostrarInputBusca
          mostrarFiltrosDeData
          aoClicarEmFiltros={(busca, inicio, fim) => {
            setSearchParams(
              { busca: busca, dataInicio: inicio, dataFim: fim },
              { replace: true }
            );
          }}
          textoDoBotaoDeBusca="Ocorrência"
          mostrarFiltroTipoOcorrencia
          aoClicarEmFiltroTipoOcorrencia={(busca) =>
            handleFilterOccurrenceType(busca)
          }
          mostrarFiltroResponsavel
          aoClicarEmFiltroResponsavel={(busca) =>
            handleFilterResponsible(busca)
          }
          mostrarFiltroCarro
          aoClicarEmFiltroCarro={(busca) => handleFilterCar(busca)}
          mostrarFiltroLinha
          aoClicarEmFiltroLinha={(busca) => handleFilterLine(busca)}
          mostrarBotaoLimpar
          mostrarBotaoPendencia
          aoClicarEmPendencia={handleFilterPendingList}
          mostrarInputNovoSelect
          arrayNovoSelect={roOccurrenceType}
          aoClicarEmNovoSelect={(e) => handleNewRo(Number(e))}
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
              <TableCell>Número Ocorrência</TableCell>
              <TableCell>Tipo Ocorrencia</TableCell>
              <TableCell>Data Ocorrência</TableCell>
              <TableCell>Data Início</TableCell>
              <TableCell>Última Alteração / Fechamento</TableCell>
              <TableCell>Linha</TableCell>
              <TableCell>Carro</TableCell>
              <TableCell>Responsável</TableCell>
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
            {RoList.map((row) => (
              <TableRow
                key={row.id}
                style={{
                  backgroundColor:
                    row.ro_status[0].id !== FECHADO &&
                    isRowOld(String(row.created_at))
                      ? themeName === "dark"
                        ? "#907f4c"
                        : "#ffe1e1"
                      : "transparent",
                }}
              >
                <TableCell>{row.occurrence_number}</TableCell>
                <TableCell>
                  {row.ro_occurrence_type[0].name}
                  {countFilledFields(row)}
                </TableCell>
                <TableCell>{keepDateHour(row.occurrence_date)}</TableCell>
                <TableCell>{keepDateHour(row.created_at)}</TableCell>
                <TableCell>{keepDateHour(row.updated_at)}</TableCell>
                <TableCell>{row.ro_bus_line[0].name}</TableCell>
                <TableCell>{row.ro_car?.[0]?.car ?? ""}</TableCell>
                <TableCell>
                  {`${usedName(
                    row.ro_user[0].name,
                    row.ro_user[0].registration
                  )} - ${row.ro_department[0].name}`}
                </TableCell>
                <TableCell>{row.ro_status[0].name}</TableCell>
                <TableCell>
                  <Tooltip title="Visualização">
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(
                          `/ro/details/${row.id}?param=${row.ro_occurrence_type[0].id}&search=true`
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
                          row.ro_status[0].id,
                          row.ro_department[0].id,
                          row.ro_occurrence_type[0].id
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
                          row.ro_status[0].id,
                          row.ro_department[0].id
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
            {RoList.length <= 0 && (
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
