import type {
EmployeeInput
} from "../api";
import "../style.css";

export const employeeInput = (f: FormData): EmployeeInput => ({
  description: String(f.get("description")),
  specializationIds: f.getAll("specializationIds").map(String),
  regionIds: f.getAll("regionIds").map(String),
});