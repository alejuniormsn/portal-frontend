import { BrowserRouter } from "react-router-dom";

import "./shared/forms/TraducoesYup";

import { AppThemeProvider, AuthProvider, DrawerProvider } from "./contexts";
import { AppRoutes } from "./routes";

import { Login } from "./pages/users/login/Login";
import { MenuLateral } from "./pages/dashboard/menu-lateral/MenuLateral";

export const App = () => {
  return (
    <AuthProvider>
      <AppThemeProvider>
        <Login>
          <DrawerProvider>
            <BrowserRouter>
              <MenuLateral>
                <AppRoutes />
              </MenuLateral>
            </BrowserRouter>
          </DrawerProvider>
        </Login>
      </AppThemeProvider>
    </AuthProvider>
  );
};
