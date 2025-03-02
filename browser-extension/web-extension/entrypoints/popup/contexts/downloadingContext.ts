import { createContext, useContext } from "react";

export const DownloadingContext = createContext<[Boolean, React.Dispatch<React.SetStateAction<Boolean>>] | undefined>(undefined);

export function useDownloading() {
  const context = useContext(DownloadingContext);
  if (context === undefined) {
    throw new Error('useDownloading must be used within a RootComponent');
  }
  return context;
}