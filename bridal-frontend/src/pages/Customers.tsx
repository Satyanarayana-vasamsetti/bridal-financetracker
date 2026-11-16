import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useData, Customer } from "@/contexts/DataContext";
import { formatCurrency } from "@/lib/currency";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  KeyRound,
  Shield,
  ShieldAlert,
  Search,
  Calendar,
  Receipt,
  Trash2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { SimplePagination } from "@/components/SimplePagination";

interface CustomerEvent {
  id: number;
  date: string;
  eventName: string;
  clientName: string;
  serviceType: string;
  amount: number;
  notes?: string;
}

interface CustomerExpense {
  id: number;
  date: string;
  expenseName: string;
  serviceType?: string;
  description?: string;
  amount: number;
  notes?: string;
}

export default function Customers() {
  const { user, isAdmin, token } = useAuth();
  const { customers, fetchCustomers } = useData();

  const [search, setSearch] = useState("");
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination for main Customers table
  const CUSTOMER_PAGE_SIZE = 10;
  const [customerPage, setCustomerPage] = useState(1);

  // Read-only inspection modal state
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectCustomer, setInspectCustomer] = useState<Customer | null>(null);
  const [inspectEvents, setInspectEvents] = useState<CustomerEvent[]>([]);
  const [inspectExpenses, setInspectExpenses] = useState<CustomerExpense[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [eventsFilter, setEventsFilter] = useState("");
  const [expensesFilter, setExpensesFilter] = useState("");

  // Pagination inside inspection modal
  const DETAILS_PAGE_SIZE = 10;
  const [eventsPage, setEventsPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = customers.filter((c) =>
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalCustomerPages = Math.ceil(filteredCustomers.length / CUSTOMER_PAGE_SIZE) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (customerPage - 1) * CUSTOMER_PAGE_SIZE,
    customerPage * CUSTOMER_PAGE_SIZE
  );

  const totalRevenueAll = customers.reduce((s, c) => s + (c.totalIncome || 0), 0);
  const totalExpensesAll = customers.reduce((s, c) => s + (c.totalExpenses || 0), 0);
  const totalProfitAll = totalRevenueAll - totalExpensesAll;

  // Inspect Customer's data in 100% read-only mode
  const handleInspectCustomer = async (customer: Customer) => {
    setInspectCustomer(customer);
    setInspectEvents([]);
    setInspectExpenses([]);
    setEventsFilter("");
    setExpensesFilter("");
    setEventsPage(1);
    setExpensesPage(1);
    setLoadingDetails(true);
    setInspectModalOpen(true);

    try {
      const [eventsRes, expensesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/events?customerId=${customer.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/expenses?customerId=${customer.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setInspectEvents(eventsRes.data || []);
      setInspectExpenses(expensesRes.data || []);
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : "Failed to load customer records";
      toast.error(errorMsg);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open reset password modal
  const handleOpenReset = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNewPassword("");
    setResetModalOpen(true);
  };

  // Submit Password Reset
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/customers/${selectedCustomer.id}/reset-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Password updated for ${selectedCustomer.email}`);
      setResetModalOpen(false);
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : "Failed to reset password";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle user role
  const handleToggleRole = async (customer: Customer) => {
    const newRole = customer.role === "admin" ? "user" : "admin";
    if (customer.id === user?.id) {
      toast.error("You cannot change your own role");
      return;
    }

    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/customers/${customer.id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Updated ${customer.email} role to ${newRole}`);
      fetchCustomers();
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : "Failed to update role";
      toast.error(errorMsg);
    }
  };

  // Delete customer
  const handleDeleteCustomer = async (customer: Customer) => {
    if (customer.id === user?.id) {
      toast.error("You cannot delete your own admin account");
      return;
    }

    if (!window.confirm(`Delete customer ${customer.email}? This will remove all their events and expenses.`)) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/customers/${customer.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Customer ${customer.email} deleted.`);
      fetchCustomers();
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : "Failed to delete customer";
      toast.error(errorMsg);
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground mt-2">Only administrators can access this page.</p>
        </div>
      </Layout>
    );
  }

  const filteredInspectEvents = inspectEvents.filter(
    (e) =>
      e.eventName?.toLowerCase().includes(eventsFilter.toLowerCase()) ||
      e.clientName?.toLowerCase().includes(eventsFilter.toLowerCase()) ||
      e.serviceType?.toLowerCase().includes(eventsFilter.toLowerCase()) ||
      e.notes?.toLowerCase().includes(eventsFilter.toLowerCase())
  );

  const filteredInspectExpenses = inspectExpenses.filter(
    (e) =>
      e.expenseName?.toLowerCase().includes(expensesFilter.toLowerCase()) ||
      e.serviceType?.toLowerCase().includes(expensesFilter.toLowerCase()) ||
      e.description?.toLowerCase().includes(expensesFilter.toLowerCase()) ||
      e.notes?.toLowerCase().includes(expensesFilter.toLowerCase())
  );

  const totalEventPages = Math.ceil(filteredInspectEvents.length / DETAILS_PAGE_SIZE) || 1;
  const paginatedInspectEvents = filteredInspectEvents.slice(
    (eventsPage - 1) * DETAILS_PAGE_SIZE,
    eventsPage * DETAILS_PAGE_SIZE
  );

  const totalExpensePages = Math.ceil(filteredInspectExpenses.length / DETAILS_PAGE_SIZE) || 1;
  const paginatedInspectExpenses = filteredInspectExpenses.slice(
    (expensesPage - 1) * DETAILS_PAGE_SIZE,
    expensesPage * DETAILS_PAGE_SIZE
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Customer Management</h2>
            <p className="text-muted-foreground text-sm">
              Read-only inspection of customer accounts, statistics, and password control
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Admin Mode: Read-Only Inspection</span>
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Customers</CardDescription>
              <CardTitle className="text-2xl font-bold">{customers.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>System Revenue</CardDescription>
              <CardTitle className="text-2xl font-bold text-success">
                {formatCurrency(totalRevenueAll)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>System Expenses</CardDescription>
              <CardTitle className="text-2xl font-bold text-destructive">
                {formatCurrency(totalExpensesAll)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>System Net Profit</CardDescription>
              <CardTitle className="text-2xl font-bold text-primary">
                {formatCurrency(totalProfitAll)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Customer Table Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Registered Customers</CardTitle>
                <CardDescription>Click View Customer to inspect all events & expenses</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customer email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Events</TableHead>
                    <TableHead className="text-right">Total Income</TableHead>
                    <TableHead className="text-right">Total Expenses</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCustomers.map((cust) => (
                      <TableRow key={cust.id}>
                        <TableCell className="font-medium">
                          {cust.email}
                          {cust.id === user?.id && (
                            <span className="ml-2 text-xs text-muted-foreground font-normal">(Admin Account)</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              cust.role === "admin"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            <Shield className="h-3 w-3" />
                            {cust.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-medium">{cust.eventsCount || 0}</TableCell>
                        <TableCell className="text-right font-medium text-success">
                          {formatCurrency(cust.totalIncome || 0)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {formatCurrency(cust.totalExpenses || 0)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(cust.netProfit || 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 text-xs font-medium"
                              onClick={() => handleInspectCustomer(cust)}
                            >
                              <Eye className="h-3.5 w-3.5 text-primary" />
                              <span>View Customer</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 gap-1.5 text-xs font-medium"
                              onClick={() => handleOpenReset(cust)}
                            >
                              <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                              <span>Reset Password</span>
                            </Button>
                            {cust.id !== user?.id && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-xs text-muted-foreground"
                                  onClick={() => handleToggleRole(cust)}
                                >
                                  {cust.role === "admin" ? "Demote" : "Make Admin"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteCustomer(cust)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <SimplePagination
              currentPage={customerPage}
              totalPages={totalCustomerPages}
              onPageChange={setCustomerPage}
              totalItems={filteredCustomers.length}
              pageSize={CUSTOMER_PAGE_SIZE}
              itemLabel="customers"
            />
          </CardContent>
        </Card>

        {/* Read-Only Customer Details Inspection Dialog */}
        <Dialog open={inspectModalOpen} onOpenChange={setInspectModalOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-6">
                <div>
                  <DialogTitle className="text-xl font-bold font-display flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Customer: {inspectCustomer?.email}
                  </DialogTitle>
                  <DialogDescription>
                    Read-only view of customer records (No data modification)
                  </DialogDescription>
                </div>
                {inspectCustomer && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={() => {
                      setInspectModalOpen(false);
                      handleOpenReset(inspectCustomer);
                    }}
                  >
                    <Lock className="h-3 w-3" />
                    Reset Password
                  </Button>
                )}
              </div>
            </DialogHeader>

            {/* Quick KPI Bar */}
            {inspectCustomer && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-secondary/50 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground block">Events:</span>
                  <span className="font-bold text-sm">{inspectEvents.length} events</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Total Revenue:</span>
                  <span className="font-bold text-sm text-success">
                    {formatCurrency(inspectEvents.reduce((s, e) => s + (e.amount || 0), 0))}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Total Expenses:</span>
                  <span className="font-bold text-sm text-destructive">
                    {formatCurrency(inspectExpenses.reduce((s, e) => s + (e.amount || 0), 0))}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Net Profit:</span>
                  <span className="font-bold text-sm text-primary">
                    {formatCurrency(
                      inspectEvents.reduce((s, e) => s + (e.amount || 0), 0) -
                      inspectExpenses.reduce((s, e) => s + (e.amount || 0), 0)
                    )}
                  </span>
                </div>
              </div>
            )}

            {loadingDetails ? (
              <div className="py-12 text-center text-muted-foreground animate-pulse">
                Loading customer records...
              </div>
            ) : (
              <Tabs defaultValue="events" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="events" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Events ({inspectEvents.length})
                  </TabsTrigger>
                  <TabsTrigger value="expenses" className="gap-2">
                    <Receipt className="h-4 w-4" />
                    Expenses ({inspectExpenses.length})
                  </TabsTrigger>
                </TabsList>

                {/* Events Tab */}
                <TabsContent value="events" className="flex-1 flex flex-col overflow-hidden space-y-3 pt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Filter events..."
                      value={eventsFilter}
                      onChange={(e) => setEventsFilter(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Event Name</TableHead>
                          <TableHead className="text-xs">Client Name</TableHead>
                          <TableHead className="text-xs">Service</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                          <TableHead className="text-xs">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedInspectEvents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                              No events found
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedInspectEvents.map((ev) => (
                            <TableRow key={ev.id}>
                              <TableCell className="text-xs font-mono">{ev.date}</TableCell>
                              <TableCell className="text-xs font-medium">{ev.eventName}</TableCell>
                              <TableCell className="text-xs">{ev.clientName || "-"}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{ev.serviceType || "-"}</TableCell>
                              <TableCell className="text-xs text-right font-semibold text-success">
                                {formatCurrency(ev.amount || 0)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                                {ev.notes || "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <SimplePagination
                    currentPage={eventsPage}
                    totalPages={totalEventPages}
                    onPageChange={setEventsPage}
                    totalItems={filteredInspectEvents.length}
                    pageSize={DETAILS_PAGE_SIZE}
                    itemLabel="events"
                  />
                </TabsContent>

                {/* Expenses Tab */}
                <TabsContent value="expenses" className="flex-1 flex flex-col overflow-hidden space-y-3 pt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Filter expenses..."
                      value={expensesFilter}
                      onChange={(e) => {
                        setExpensesFilter(e.target.value);
                        setExpensesPage(1);
                      }}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Expense Name</TableHead>
                          <TableHead className="text-xs">Category / Type</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                          <TableHead className="text-xs">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedInspectExpenses.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                              No expenses found
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedInspectExpenses.map((ex) => (
                            <TableRow key={ex.id}>
                              <TableCell className="text-xs font-mono">{ex.date}</TableCell>
                              <TableCell className="text-xs font-medium">{ex.expenseName}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {ex.serviceType || ex.description || "-"}
                              </TableCell>
                              <TableCell className="text-xs text-right font-semibold text-destructive">
                                {formatCurrency(ex.amount || 0)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                                {ex.notes || "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <SimplePagination
                    currentPage={expensesPage}
                    totalPages={totalExpensePages}
                    onPageChange={setExpensesPage}
                    totalItems={filteredInspectExpenses.length}
                    pageSize={DETAILS_PAGE_SIZE}
                    itemLabel="expenses"
                  />
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setInspectModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Modal */}
        <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Customer Password</DialogTitle>
              <DialogDescription>
                Set a new password for account: <strong>{selectedCustomer?.email}</strong>
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 py-2">
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Resetting..." : "Save New Password"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
