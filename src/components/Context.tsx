import {
createContext
} from "react";
import "../style.css";
import { Ctx } from './Ctx';
export const Context = createContext<Ctx>(null!);