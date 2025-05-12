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
import gavelIcon from "../../assets/icons/gavel.svg";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FerramentasDaListagem } from "../../shared/components";
import { LayoutBaseDePagina } from "../../shared/layouts";
import { useDebounce } from "../../shared/hooks";
import { useAppThemeContext, useAuthContext } from "../../contexts";
import { canDo } from "../../shared/utils/canDo";
import { useEffect, useMemo, useState } from "react";
import { doNotDelete, doNotRun } from "../../shared/utils/messages/doNotRun";
import { messageError } from "../../shared/utils/messages/messageError";
import { Environment } from "../../environment";
import { ISac, SacService } from "../../services/sac/SacService";
import { usedName } from "../../shared/utils/usedName";
import { Circle } from "@mui/icons-material";
import { handleErrorMessage } from "../../shared/error/handleErrorMessage";

export const ListagemSac: React.FC = () => {
  const { debounce } = useDebounce();
  const { accessToken } = useAuthContext();
  const { loggedUser } = useAuthContext();
  const { themeName } = useAppThemeContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [SacList, setSacList] = useState<ISac[]>([]);
  const [completedList, setCompletedList] = useState<ISac[]>([]);
  const [pagination, setPagination] = useState<number>(1);

  const NOVO = 1;
  const ATENDIMENTO = 2;
  const SOLUCIONADO = 3;
  const MONITORAMENTO = 10;

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
    cod_department: number,
    currentStatus: number
  ) => {
    const validations = [
      {
        condition: currentStatus === SOLUCIONADO,
        action: () => {
          doNotRun("Status não permite esta ação", "Ação não permitida");
          return doNotDelete(" ");
        },
      },
      {
        condition: !canDo(loggedUser.department, cod_department),
        action: () =>
          doNotRun(
            "Registro só pode ser alterado pelo departamento proprietário",
            "Ação não permitida"
          ),
      },
    ];
    for (const { condition, action } of validations) {
      if (condition) return action();
    }

    navigate(`/sac/details/${id}?change=true`);
  };

  const handleTreatment = async (
    id: number,
    cod_department: number,
    currentStatus: number
  ) => {
    const validations = [
      {
        condition: currentStatus === SOLUCIONADO,
        action: () => doNotRun("O status não permite está ação"),
      },
      {
        condition: !canDo(loggedUser.department, cod_department),
        action: () =>
          doNotRun(
            "Tratativa só pode ser executada pelo departamento proprietário",
            "Ação não permitida"
          ),
      },
      {
        condition: currentStatus === SOLUCIONADO,
        action: () => doNotDelete(" "),
      },
    ];
    for (const { condition, action } of validations) {
      if (condition) return action();
    }

    navigate(`/sac/treatment/${id}`);
  };

  const handleNewSac = () => {
    if (!canDo(loggedUser.department, MONITORAMENTO)) {
      return doNotRun(
        "Inclusão permitida apenas pelo Monitoramento",
        "Ação não permitida"
      );
    }

    navigate("/sac/details/nova");
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

          const result = await SacService.getAllSacs(
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
      setSacList(completedList.slice(0, Environment.LIMITE_DE_LINHAS));
    } else {
      setSacList(
        completedList.slice(
          Environment.LIMITE_DE_LINHAS * (pagination - 1),
          Environment.LIMITE_DE_LINHAS * pagination
        )
      );
    }
  }, [completedList, pagination]);

  return (
    <LayoutBaseDePagina
      titulo="SAC - Serviço de Atendimento ao Cliente"
      barraDeFerramentas={
        <FerramentasDaListagem
          mostrarInputBusca
          textoDoBotaoDeBusca="Chamado"
          placeholderDaBusca="Busca chamado..."
          mostrarFiltrosDeData
          aoClicarEmFiltros={(busca, inicio, fim) => {
            setSearchParams(
              { busca: busca, dataInicio: inicio, dataFim: fim },
              { replace: true }
            );
          }}
          mostrarBotaoNovo
          aoClicarEmNovo={handleNewSac}
          mostrarBotaoLimpar
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
              <TableCell>Número Chamado</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Abertura</TableCell>
              <TableCell>Última Alteração</TableCell>
              <TableCell>Prioridade</TableCell>
              <TableCell>Departamento</TableCell>
              <TableCell>Atribuído a</TableCell>
              <TableCell>Tipo Ocorrencia</TableCell>
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
            {SacList.map((row) => (
              <TableRow
                key={row.id}
                style={{
                  backgroundColor:
                    row.sac_status[0].id !== SOLUCIONADO &&
                    isRowOld(String(row.updated_at))
                      ? themeName === "dark"
                        ? "#907f4c"
                        : "#ffe1e1"
                      : "transparent",
                }}
              >
                <TableCell>{row.ticket_number}</TableCell>
                <TableCell>{row.title}</TableCell>
                <TableCell>
                  {row.sac_status[0].id === NOVO ? (
                    <Circle htmlColor="#E53935" />
                  ) : row.sac_status[0].id === ATENDIMENTO ? (
                    <Circle htmlColor="#F4B700" />
                  ) : (
                    <Circle htmlColor="#00ff00" />
                  )}
                  {row.sac_status[0].name}
                </TableCell>
                <TableCell>{keepDateHour(row.created_at)}</TableCell>
                <TableCell>{keepDateHour(row.updated_at)}</TableCell>
                <TableCell>{row.sac_priority[0].name}</TableCell>
                <TableCell>{row.sac_department[0].name}</TableCell>
                <TableCell>
                  {usedName(row.sac_user[0].name, row.sac_user[0].registration)}
                </TableCell>
                <TableCell>{row.sac_occurrence_type[0].name}</TableCell>
                <TableCell>
                  <Tooltip title="Visualização">
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(`/sac/details/${row.id}?search=true`)
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
                          row.sac_department[0].id,
                          row.sac_status[0].id
                        )
                      }
                      disabled={false}
                    >
                      <img src={editIcon} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Efetuar Tratativa">
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleTreatment(
                          Number(row.id),
                          row.sac_department[0].id,
                          row.sac_status[0].id
                        )
                      }
                      disabled={false}
                    >
                      <img src={gavelIcon} />
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
            {SacList.length <= 0 && (
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
