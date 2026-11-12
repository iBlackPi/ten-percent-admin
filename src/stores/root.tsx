import { createContext, useContext, type ReactNode } from 'react';
import { SessionStore } from './session.ts';

export class RootStore {
  session = new SessionStore();
}

const rootStore = new RootStore();
const StoreContext = createContext<RootStore>(rootStore);

export const StoreProvider = ({ children }: { children: ReactNode }) => (
  <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
);

export const useStores = (): RootStore => useContext(StoreContext);
