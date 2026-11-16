import {
Check,
X,
AlertCircle
} from "lucide-react";
import {
useCallback,
useEffect,
useRef,
useState
} from "react";
import {
BrowserRouter,
Navigate,
Route,
Routes
} from "react-router-dom";
import type {
Mode,
Option,
Proposal,
Session
} from "../api";
import {
api,
applySession,
configured,
errorText,
listenSession,
refresh
} from "../api";
import * as demoData from "../demo";
import { AdvancedMarket,Directory } from "../NewPages";
import "../style.css";
import { Auth, AuthFlow } from './Auth';
import { Context } from './Context';
import { ContractList } from './ContractList';
import { Dashboard } from './Dashboard';
import { Details } from './Details';
import { Guard } from './Guard';
import { MapPage, MyPlotsPage } from './MapPage';
import { Messages } from './Messages';
import { NewContract } from './NewContract';
import { Profile } from './Profile';
import { Proposals } from './Proposals';
import { Services } from './Services';
import { Shell } from './Shell';
import { Spinner } from './Spinner';
export function App() {
  const [session,setSession]=useState<Session|null>(null),
    [demo,setDemoState]=useState(false),
    [boot, setBoot] = useState(configured),
    [contracts, setContracts] = useState(demoData.contracts),
    [services, setServices] = useState<Option[]>(
      configured ? [] : demoData.services,
    ),
    [regions, setRegions] = useState<Option[]>(
      configured ? [] : demoData.regions,
    ),
    [regionsLoading, setRegionsLoading] = useState(configured),
    [regionsError, setRegionsError] = useState(""),
    [toast, setToast] = useState(""),
    [demoProposals, setDemoProposals] = useState<Proposal[]>([
      {
        id: "p1",
        price: 2200,
        comment: "Допоможу з озелененням. Підберу рослини та надішлю фотозвіт.",
        status: "pending",
        employee: {
          id: "demo",
          name: "Олександр Мельник",
          rating: 4.9,
          reviewsCount: 24,
        },
        contract: demoData.contracts[1],
      },
    ]);
  useEffect(() => listenSession((s) => setSession(s)), []);
  const reloadRegions = useCallback(async () => {
    setRegionsLoading(true);
    setRegionsError("");
    try {
      const { data } = await api.get<unknown>("/regions");
      if (!Array.isArray(data)) {
        throw new Error("Сервер повернув некоректний список регіонів.");
      }
      const validRegions = data.filter(
        (region): region is Option =>
          !!region &&
          typeof region === "object" &&
          "id" in region &&
          typeof region.id === "string" &&
          "name" in region &&
          typeof region.name === "string",
      );
      if (validRegions.length !== data.length) {
        throw new Error("Сервер повернув некоректні дані регіонів.");
      }
      setRegions(validRegions);
      if (validRegions.length === 0) {
        setRegionsError(
          "Список регіонів порожній. Попросіть адміністратора заповнити регіони в базі даних.",
        );
      }
    } catch (e) {
      setRegionsError(errorText(e));
    } finally {
      setRegionsLoading(false);
    }
  }, []);
  useEffect(() => {
    if (configured) {
      refresh()
        .catch(() => {})
        .finally(() => setBoot(false));
      api
        .get<Option[]>("/services")
        .then((r) => setServices(r.data))
        .catch(() => {});
      void reloadRegions();
    }
  }, [reloadRegions]);
  const toastTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>()=>clearTimeout(toastTimer.current),[]);
  const notice = useCallback((s: string) => {
    clearTimeout(toastTimer.current);
    setToast(s);
    toastTimer.current=setTimeout(() => setToast(""), 5000);
  }, []);
  const startDemo = () => {
    setDemoState(true);
    setServices(demoData.services);
    setRegions(demoData.regions);
    setSession({
      accessToken: "",
      user: {
        id: "demo",
        name: "Андрій Коваль",
        email: "andrii@example.com",
        roles: ["customer", "employee"],
        mode: "customer",
      },
    });
  };
  const switchMode = async (mode: Mode) => {
    if (demo) setSession((s) => (s ? { ...s, user: { ...s.user, mode } } : s));
    else {
      const r = await api.post<Session>("/auth/switch-mode", { mode });
      applySession(r.data);
    }
  };
  const logout = async () => {
    try {
      if (!demo) await api.post("/auth/logout");
    } catch (e) {
      notice(errorText(e));
    } finally {
      setDemoState(false);
      applySession(null);
      setSession(null);
    }
  };
  if(!configured)return <div className="panel detail-panel"><h1>Потрібна адреса API</h1><p>Створіть .env на основі .env.example, задайте VITE_API_URL і перезапустіть Vite.</p></div>;
  if (boot) return <Spinner />;
  return (
    <Context.Provider
      value={{
        session,
        demo,
        mode: session?.mode ?? session?.user.mode ?? "customer",
        setDemo: startDemo,
        switchMode,
        logout,
        contracts,
        setContracts,
        services,
        regions,
        regionsLoading,
        regionsError,
        reloadRegions,
        demoProposals,
        setDemoProposals,
        notice,
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth register />} />
          <Route path="/verify-email" element={<AuthFlow kind="verify" />} />
          <Route path="/reset-password" element={<AuthFlow kind="reset" />} />
          <Route path="/forgot-password" element={<AuthFlow kind="forgot" />} />
          <Route element={<Guard />}>
            <Route
              path="/"
              element={
                <Shell>
                  <Dashboard />
                </Shell>
              }
            />
            <Route
              path="/contracts"
              element={
                <Shell>
                  <ContractList />
                </Shell>
              }
            />
            <Route
              path="/contracts/new"
              element={
                <Guard mode="customer">
                  <Shell>
                    <NewContract />
                  </Shell>
                </Guard>
              }
            />
            <Route
              path="/contracts/:id"
              element={
                <Shell>
                  <Details />
                </Shell>
              }
            />
            <Route
              path="/market"
              element={
                <Guard mode="employee">
                  <Shell>
                    <AdvancedMarket services={services} regions={regions} />
                  </Shell>
                </Guard>
              }
            />
            <Route
              path="/proposals"
              element={
                <Guard mode="employee">
                  <Shell>
                    <Proposals />
                  </Shell>
                </Guard>
              }
            />
            <Route
              path="/employees"
              element={
                <Guard mode="customer">
                  <Shell>
                    <Directory services={services} regions={regions} />
                  </Shell>
                </Guard>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <Guard mode="customer">
                  <Shell>
                    <Directory services={services} regions={regions} />
                  </Shell>
                </Guard>
              }
            />
            <Route
              path="/plots"
              element={
                <Guard mode="customer">
                  <Shell>
                    <MyPlotsPage />
                  </Shell>
                </Guard>
              }
            />
            <Route
              path="/map"
              element={
                <Guard mode="customer">
                  <Shell>
                    <MapPage />
                  </Shell>
                </Guard>
              }
            />
            <Route
              path="/services"
              element={
                <Shell>
                  <Services />
                </Shell>
              }
            />
            <Route
              path="/messages"
              element={
                <Shell>
                  <Messages />
                </Shell>
              }
            />
            <Route
              path="/profile"
              element={
                <Shell>
                  <Profile />
                </Shell>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {toast && (
          <div role="status" className={"toast "+(toast.toLowerCase().includes("помил")||toast.toLowerCase().includes("не вдалося")||toast.toLowerCase().includes("недоступ")||toast.toLowerCase().includes("невір")||toast.toLowerCase().includes("заверш")||toast.toLowerCase().includes("error")||toast.toLowerCase().includes("failed")?"toast-error":"toast-success")}>
            {toast.toLowerCase().includes("помил") || toast.toLowerCase().includes("не вдалося") || toast.toLowerCase().includes("недоступ") || toast.toLowerCase().includes("невір") || toast.toLowerCase().includes("заверш") || toast.toLowerCase().includes("error") || toast.toLowerCase().includes("failed") ? <AlertCircle size={18}/> : <Check size={18}/>}
            {toast}
            <button aria-label="Закрити повідомлення" onClick={() => setToast("")}>
              <X size={16} />
            </button>
          </div>
        )}
      </BrowserRouter>
    </Context.Provider>
  );
}