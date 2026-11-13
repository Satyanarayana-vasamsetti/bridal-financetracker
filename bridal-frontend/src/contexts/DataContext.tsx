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
  userId?: number;
  userEmail?: string;
}

export interface Expense {
  id: number;
  date: string;
  expenseName: string;
  description: string;
  serviceType: ServiceType;
  amount: number;
  notes: string;
  userId?: number;
  userEmail?: string;
}

export interface Customer {
  id: number;
  email: string;
  role: "admin" | "user";
  eventsCount: number;
  totalIncome: number;
  expensesCount: number;
  totalExpenses: number;
  netProfit: number;
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
  // Admin Features
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  customers: Customer[];
  fetchCustomers: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

/* ================= AXIOS ================= */

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
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
  const { isAuthenticated, isAdmin } = useAuth();

  const [events, setEvents] = useState<BridalEvent[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("my");
  const [isLoading, setIsLoading] = useState(true);

  /* ---------- FETCH CUSTOMERS (ADMIN ONLY) ---------- */
  const fetchCustomers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get("/admin/customers");
      setCustomers(res.data || []);
    } catch {
      // ignore
    }
  }, [isAdmin]);

  /* ---------- FETCH EVENTS ---------- */
  const fetchEvents = useCallback(async (customerId: string) => {
    try {
      const queryParam = customerId && customerId !== "my" ? `?customerId=${customerId}` : "";
      const res = await api.get(`/events${queryParam}`);
      setEvents(res.data || []);
    } catch {
      toast.error("Failed to load events");
    }
  }, []);

  /* ---------- FETCH EXPENSES ---------- */
  const fetchExpenses = useCallback(async (customerId: string) => {
    try {
      const queryParam = customerId && customerId !== "my" ? `?customerId=${customerId}` : "";
      const res = await api.get(`/expenses${queryParam}`);
      setExpenses(res.data || []);
    } catch {
      toast.error("Failed to load expenses");
    }
  }, []);

  /* ---------- LOAD ON AUTH / FILTER CHANGE ---------- */
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      Promise.all([
        fetchEvents(selectedCustomerId), 
        fetchExpenses(selectedCustomerId),
        fetchCustomers()
      ]).finally(() => setIsLoading(false));
    } else {
      setEvents([]);
      setExpenses([]);
      setCustomers([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedCustomerId, fetchEvents, fetchExpenses, fetchCustomers]);

  /* ================= EVENTS CRUD ================= */

  const addEvent = async (event: Omit<BridalEvent, "id">) => {
    try {
      // If admin selected a specific customer, attach userId
      const payload = selectedCustomerId !== "my" && selectedCustomerId !== "all" 
        ? { ...event, userId: parseInt(selectedCustomerId, 10) }
        : event;

      await api.post("/events", payload);
      await fetchEvents(selectedCustomerId);
      if (isAdmin) fetchCustomers();
      toast.success("Event added");
    } catch {
      toast.error("Failed to add event");
    }
  };

  const updateEvent = async (id: number, event: Omit<BridalEvent, "id">) => {
    try {
      await api.put(`/events/${id}`, event);
      await fetchEvents(selectedCustomerId);
      if (isAdmin) fetchCustomers();
      toast.success("Event updated");
    } catch {
      toast.error("Failed to update event");
    }
  };

  const deleteEvent = async (id: number) => {
    try {
      await api.delete(`/events/${id}`);
      await fetchEvents(selectedCustomerId);
      if (isAdmin) fetchCustomers();
      toast.success("Event deleted");
    } catch {
      toast.error("Failed to delete event");
    }
  };

  /* ================= EXPENSES CRUD ================= */

  const addExpense = async (expense: Omit<Expense, "id">) => {
    try {
      const payload = selectedCustomerId !== "my" && selectedCustomerId !== "all" 
        ? { ...expense, userId: parseInt(selectedCustomerId, 10) }
        : expense;

      await api.post("/expenses", payload);
      await fetchExpenses(selectedCustomerId);
      if (isAdmin) fetchCustomers();
      toast.success("Expense added");
    } catch {
      toast.error("Failed to add expense");
    }
  };

  const updateExpense = async (id: number, expense: Omit<Expense, "id">) => {
    try {
      await api.put(`/expenses/${id}`, expense);
      await fetchExpenses(selectedCustomerId);
      if (isAdmin) fetchCustomers();
      toast.success("Expense updated");
    } catch {
      toast.error("Failed to update expense");
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      await api.delete(`/expenses/${id}`);
      await fetchExpenses(selectedCustomerId);
      if (isAdmin) fetchCustomers();
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  /* ================= CALCULATIONS ================= */

  const totalIncome = events.reduce((s, e) => s + (e.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const profit = totalIncome - totalExpenses;

  const bridalSummary: ServiceSummary = {
    income: events.filter((e) => e.serviceType === "Bridal").reduce((s, e) => s + (e.amount || 0), 0),
    expenses: expenses.filter((e) => e.serviceType === "Bridal").reduce((s, e) => s + (e.amount || 0), 0),
    profit: 0,
  };
  bridalSummary.profit = bridalSummary.income - bridalSummary.expenses;

  const mehandiSummary: ServiceSummary = {
    income: events.filter((e) => e.serviceType === "Mehandi").reduce((s, e) => s + (e.amount || 0), 0),
    expenses: expenses.filter((e) => e.serviceType === "Mehandi").reduce((s, e) => s + (e.amount || 0), 0),
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
        selectedCustomerId,
        setSelectedCustomerId,
        customers,
        fetchCustomers,
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
