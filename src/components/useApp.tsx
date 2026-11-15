import {
useContext
} from "react";
import "../style.css";
import { Context } from './Context';
export const useApp = () => useContext(Context);