import React from "react";
import type {
Contract,
Mode,
Option,
Proposal,
SelectableService,
ServiceCategory,
Session
} from "../api";
import "../style.css";

export type Ctx = {
  session: Session | null;
  demo: boolean;
  mode: Mode;
  setDemo: () => void;
  switchMode: (m: Mode) => Promise<void>;
  logout: () => Promise<void>;
  contracts: Contract[];
  setContracts: React.Dispatch<React.SetStateAction<Contract[]>>;
  services: SelectableService[];
  serviceCategories: ServiceCategory[];
  servicesLoading: boolean;
  servicesError: string;
  regions: Option[];
  regionsLoading: boolean;
  regionsError: string;
  reloadRegions: () => Promise<void>;
  demoProposals: Proposal[];
  setDemoProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
  notice: (s: string) => void;
};