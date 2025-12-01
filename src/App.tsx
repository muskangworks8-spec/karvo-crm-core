import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AuthGuard } from "./components/auth/AuthGuard";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Leads from "./pages/Leads";
import LeadDetails from "./pages/LeadDetails";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import Tasks from "./pages/Tasks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Main application component with routing
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/leads"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <Leads />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/leads/:id"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <LeadDetails />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/clients"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <Clients />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/clients/:id"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <ClientDetails />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/tasks"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <Tasks />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/reports"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <AuthGuard>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/users"
            element={
              <AuthGuard requiredRole="admin">
                <DashboardLayout>
                  <Users />
                </DashboardLayout>
              </AuthGuard>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
