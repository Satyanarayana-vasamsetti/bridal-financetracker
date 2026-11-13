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
import {
  Users,
  Eye,
  KeyRound,
  Shield,
  ShieldAlert,
  Search,
  ArrowUpDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Customers() {
  const { user, isAdmin, token } = useAuth();
  const { customers, fetchCustomers, setSelectedCustomerId } = useData();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = customers.filter((c) =>
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenueAll = customers.reduce((s, c) => s + (c.totalIncome || 0), 0);
  const totalExpensesAll = customers.reduce((s, c) => s + (c.totalExpenses || 0), 0);
  const totalProfitAll = totalRevenueAll - totalExpensesAll;

  // View Customer's data
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id.toString());
    toast.success(`Viewing records for ${customer.email}`);
    navigate("/");
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
      toast.success(`Password reset for ${selectedCustomer.email}`);
      setResetModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password");
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
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update role");
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Customer Management</h2>
            <p className="text-muted-foreground text-sm">
              View and manage all registered customer accounts, finances, and passwords
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setSelectedCustomerId("all");
              toast.success("Viewing all customer records combined");
              navigate("/");
            }}
          >
            <TrendingUp className="h-4 w-4" />
            View All Accounts Combined
          </Button>
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
                <CardDescription>Click View Records to inspect any customer's data</CardDescription>
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
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <TableRow key={cust.id}>
                        <TableCell className="font-medium">
                          {cust.email}
                          {cust.id === user?.id && (
                            <span className="ml-2 text-xs text-muted-foreground">(You)</span>
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
                        <TableCell className="text-center">{cust.eventsCount || 0}</TableCell>
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
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1"
                              onClick={() => handleViewCustomer(cust)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden lg:inline">View Data</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 gap-1 text-primary hover:text-primary"
                              onClick={() => handleOpenReset(cust)}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              <span className="hidden lg:inline">Reset Pass</span>
                            </Button>
                            {cust.id !== user?.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-muted-foreground"
                                onClick={() => handleToggleRole(cust)}
                              >
                                {cust.role === "admin" ? "Demote" : "Make Admin"}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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
