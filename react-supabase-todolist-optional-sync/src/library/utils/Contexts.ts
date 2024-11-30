import { SupabaseConnector } from "@/powersync/SupabaseConnector";
import React from "react";

export const SupabaseContext = React.createContext<SupabaseConnector | null>(null);
export const useSupabase = () => React.useContext(SupabaseContext);