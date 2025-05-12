import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import CryptoJS from "crypto-js";
import {
  AuthService,
  IAuth,
  ILogin,
  IUser,
} from "../services/auth/AuthService";
import { messageError } from "../shared/utils/messages/messageError";
import { handleErrorMessage } from "../shared/error/handleErrorMessage";

interface IAuthContextData {
  isAuthenticated: boolean;
  loggedUser: IUser;
  accessToken?: string;
  login: (login: ILogin) => Promise<string | void>;
  logout: () => void;
}

const AuthContext = createContext({} as IAuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthentic, setIsAuthentic] = useState(false);
  const [user, setUser] = useState({} as IUser);
  const [accessToken, setAccessToken] = useState<string>();

  const isAuthenticated = useMemo(() => isAuthentic, [isAuthentic]);
  const loggedUser = useMemo(() => user, [user]);

  const handleLogin = useCallback(async (login: ILogin) => {
    try {
      const password_hash = CryptoJS.MD5(login.password).toString();
      const payload = { ...login, password: password_hash };
      const result: { message: IAuth } = await AuthService.auth(payload);
      setAccessToken(result.message.token);
      setUser(result.message.user);
      setIsAuthentic(true);
    } catch (error: any) {
      messageError(
        handleErrorMessage(error),
        "Erro ao efetuar login. Peça ajuda ao suporte..."
      );
    }
  }, []);

  const handleLogout = useCallback(() => {
    setAccessToken(undefined);
    setUser({} as IUser);
    setIsAuthentic(false);
    localStorage.clear();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loggedUser,
        accessToken,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
