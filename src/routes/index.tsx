import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { useAuthContext, useDrawerContext } from "../contexts";
import { messageWarning } from "../shared/utils/messages/messageWarning";
import {
  AccessGroupService,
  IAccess,
} from "../services/users/access-group/AccessGroupService";
import { ListagemDeMonitoramento } from "../pages/monitoramento/ListagemDeMonitoramento";
import { DetalheDeMonitoramento } from "../pages/monitoramento/DetalheDeMonitoramento";
import { ListagemDeManutencao } from "../pages/manutencao/ListagemDeManutencao";
import { DetalheDeManutencao } from "../pages/manutencao/DetalheDeManutencao";
import { ListagemRevisaoCameras } from "../pages/revisao-cameras/ListagemRevisaoCameras";
import { DetalheRevisaoCameras } from "../pages/revisao-cameras/DetalheRevisaoCameras";
import { ListagemSac } from "../pages/sac/ListagemSac";
import { DetalheSac } from "../pages/sac/DetalheSac";
import { TratativaSac } from "../pages/sac/TratativaSac";
import { Dashboard } from "../pages/dashboard/Dashboard";
import { DetalheRo } from "../pages/ro/DetalheRo";
import { ListagemRo } from "../pages/ro/ListagemRo";
import { RegistroUsuario } from "../pages/users/registroUsuario/RegistroUsuario";
import { RecuperacaoSenha } from "../pages/users/recuperacaoSenha/RecuperacaoSenha";
import { GrupoAcesso } from "../pages/users/registroGrupoAcesso/GrupoAcesso";

export const AppRoutes: React.FC = () => {
  const { loggedUser } = useAuthContext();
  const { setDrawerOptions } = useDrawerContext();

  const home: IAccess[] = [
    {
      icon: "home",
      path: "/pagina-inicial",
      label: "Avisos",
    },
  ];

  useEffect(() => {
    AccessGroupService.getGroupsByGroup(loggedUser.access_group).then(
      (result) => {
        if (result instanceof Error) {
          setDrawerOptions(home);
          messageWarning(`Grupo de acesso não encontrado\n ${result.message}`);
        } else {
          const resultData = result.group;
          const fullData = home.concat(resultData);
          setDrawerOptions(fullData);
        }
      }
    );
  }, []);

  return (
    <Routes>
      <Route
        path="/monitoring-cars"
        element={<ListagemDeMonitoramento />}
      />
      <Route
        path="/monitoring-car/details/:id"
        element={<DetalheDeMonitoramento />}
      />

      <Route
        path="/maintenance-cars"
        element={<ListagemDeManutencao />}
      />
      <Route
        path="/maintenance-car/details/:id"
        element={<DetalheDeManutencao />}
      />

      <Route
        path="/recovery-password"
        element={<RecuperacaoSenha />}
      />

      <Route
        path="/user-registration"
        element={<RegistroUsuario />}
      />

      <Route
        path="/access-group-registration"
        element={<GrupoAcesso />}
      />

      <Route
        path="/camera-reviews"
        element={<ListagemRevisaoCameras />}
      />

      <Route
        path="/camera-review/details/:id"
        element={<DetalheRevisaoCameras />}
      />

      <Route
        path="/sac"
        element={<ListagemSac />}
      />

      <Route
        path="/sac/details/:id"
        element={<DetalheSac />}
      />

      <Route
        path="/sac/treatment/:id"
        element={<TratativaSac />}
      />

      <Route
        path="/ro"
        element={<ListagemRo />}
      />

      <Route
        path="/ro/details/:id"
        element={<DetalheRo />}
      />

      <Route
        path="/pagina-inicial"
        element={<Dashboard />}
      />

      <Route
        path="*"
        element={<Navigate to="/pagina-inicial" />}
      />
    </Routes>
  );
};
