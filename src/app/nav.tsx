/* Nav context — shares the mobile sidebar's open state between the shell, the
   sidebar drawer, and the topbar's hamburger. Desktop ignores it (sidebar is
   always visible there). */
import { createContext, useContext } from "react";

interface NavState {
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
}

export const NavContext = createContext<NavState>({ navOpen: false, setNavOpen: () => {} });

export function useNav(): NavState {
  return useContext(NavContext);
}
