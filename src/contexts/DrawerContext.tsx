import { createContext, useCallback, useContext, useState } from "react";
import { IAccess } from "../services/users/access-group/AccessGroupService";

// interface ISubItens {
//   to: string;
//   icon: string;
//   label: string;
// }

// export interface IAccessGroup {
//   label: string;
//   icon: string;
//   path: string;
//   subItems?: ISubItens[];
// }

interface IDrawerContextData {
  isDrawerOpen: boolean;
  toggleDrawerOpen: () => void;
  drawerOptions: IAccess[];
  setDrawerOptions: (newDrawerOptions: IAccess[]) => void;
}

const DrawerContext = createContext({} as IDrawerContextData);

export const useDrawerContext = () => {
  return useContext(DrawerContext);
};

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [drawerOptions, setDrawerOptions] = useState<IAccess[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawerOpen = useCallback(() => {
    setIsDrawerOpen((oldDrawerOpen) => !oldDrawerOpen);
  }, []);

  const handleSetDrawerOptions = useCallback((newDrawerOptions: IAccess[]) => {
    setDrawerOptions(newDrawerOptions);
  }, []);

  return (
    <DrawerContext.Provider
      value={{
        isDrawerOpen,
        drawerOptions,
        toggleDrawerOpen,
        setDrawerOptions: handleSetDrawerOptions,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
};
