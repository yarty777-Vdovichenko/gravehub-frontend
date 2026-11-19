import { AdvancedMarket } from "../NewPages";
import "../style.css";
import { EmployeeContractList } from './EmployeeContractList';
import { useApp } from './useApp';
export function ContractList(){const a=useApp();return a.mode==='customer'?<AdvancedMarket services={a.services} regions={a.regions} endpoint="/contracts/my"/>:<EmployeeContractList/>;}
