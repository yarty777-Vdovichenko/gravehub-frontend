import { AdvancedMarket } from "../NewPages";
import "../style.css";
import { EmployeeContractList } from './EmployeeContractList';
import { useApp } from './useApp';
export function ContractList(){const a=useApp();return a.mode==='customer'?<AdvancedMarket serviceCategories={a.serviceCategories} regions={a.regions} endpoint="/contracts/my"/>:<EmployeeContractList/>;}
