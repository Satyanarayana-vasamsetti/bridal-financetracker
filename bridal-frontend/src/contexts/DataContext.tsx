import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

/* ================= TYPES ================= */

export type ServiceType = "Bridal" | "Mehandi";

export interface BridalEvent {
  id: number;
  date: string;
  eventName: string;
  clientName: string;
  serviceType: ServiceType;
  amount: number;
  notes: string;
}

export interface Expense {
  id: number;
  date: string;
  expenseName: string;
  description: string;
  serviceType: ServiceType;
  amount: number;
  notes: string;
}

interface ServiceSummary {
  income: number;
  expenses: number;
  profit: number;
}

interface DataContextType {
  events: BridalEvent[];
  expenses: Expense[];
  addEvent: (event: Omit<BridalEvent, "id">) => Promise<void>;
  updateEvent: (id: number, event: Omit<BridalEvent, "id">) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>;
  updateExpense: (id: number, expense: Omit<Expense, "id">) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  bridalSummary: ServiceSummary;
  mehandiSummary: ServiceSummary;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

/* ================= AXIOS ================= */

const api = axios.create({
  baseURL:`${import.meta.env.VITE_API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ================= PROVIDER ================= */

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [events, setEvents] = useState<BridalEvent[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ---------- FETCH EVENTS ---------- */
  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get("/events");
      setEvents(res.data || []);
    } catch {
      toast.error("Failed to load events");
    }
  }, []);

  /* ---------- FETCH EXPENSES ---------- */
  const fetchExpenses = useCallback(async () => {
    try {
      const res = await api.get("/expenses");
      setExpenses(res.data || []);
    } catch {
      toast.error("Failed to load expenses");
    }
  }, []);

  /* ---------- INITIAL LOAD ---------- */
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      Promise.all([fetchEvents(), fetchExpenses()])
        .finally(() => setIsLoading(false));
    } else {
      setEvents([]);
      setExpenses([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchEvents, fetchExpenses]);

  /* ================= EVENTS CRUD ================= */

  const addEvent = async (event: Omit<BridalEvent, "id">) => {
    try {
      await api.post("/events", event);
      await fetchEvents();
      toast.success("Event added");
    } catch {
      toast.error("Failed to add event");
    }
  };

  const updateEvent = async (id: number, event: Omit<BridalEvent, "id">) => {
    try {
      await api.put(`/events/${id}`, event);
      await fetchEvents();
      toast.success("Event updated");
    } catch {
      toast.error("Failed to update event");
    }
  };

  const deleteEvent = async (id: number) => {
    try {
      await api.delete(`/events/${id}`);
      await fetchEvents();
      toast.success("Event deleted");
    } catch {
      toast.error("Failed to delete event");
    }
  };

  /* ================= EXPENSES CRUD ================= */

  const addExpense = async (expense: Omit<Expense, "id">) => {
    try {
      await api.post("/expenses", expense);
      await fetchExpenses();
      toast.success("Expense added");
    } catch {
      toast.error("Failed to add expense");
    }
  };

  const updateExpense = async (id: number, expense: Omit<Expense, "id">) => {
    try {
      await api.put(`/expenses/${id}`, expense);
      await fetchExpenses();
      toast.success("Expense updated");
    } catch {
      toast.error("Failed to update expense");
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      await api.delete(`/expenses/${id}`);
      await fetchExpenses();
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  /* ================= CALCULATIONS ================= */

  const totalIncome = events.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalIncome - totalExpenses;

  const bridalSummary: ServiceSummary = {
    income: events.filter(e => e.serviceType === "Bridal")
      .reduce((s, e) => s + e.amount, 0),
    expenses: expenses.filter(e => e.serviceType === "Bridal")
      .reduce((s, e) => s + e.amount, 0),
    profit: 0,
  };
  bridalSummary.profit = bridalSummary.income - bridalSummary.expenses;

  const mehandiSummary: ServiceSummary = {
    income: events.filter(e => e.serviceType === "Mehandi")
      .reduce((s, e) => s + e.amount, 0),
    expenses: expenses.filter(e => e.serviceType === "Mehandi")
      .reduce((s, e) => s + e.amount, 0),
    profit: 0,
  };
  mehandiSummary.profit = mehandiSummary.income - mehandiSummary.expenses;

  return (
    <DataContext.Provider
      value={{
        events,
        expenses,
        addEvent,
        updateEvent,
        deleteEvent,
        addExpense,
        updateExpense,
        deleteExpense,
        totalIncome,
        totalExpenses,
        profit,
        bridalSummary,
        mehandiSummary,
        isLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
}
