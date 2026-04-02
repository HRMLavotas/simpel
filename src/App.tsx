import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/query-client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Import from "./pages/Import";
import ImportNonAsn from "./pages/ImportNonAsn";
import Profile from "./pages/Profile";
import Admins from "./pages/Admins";
import Departments from "./pages/Departments";
import DataBuilder from "./pages/DataBuilder";
import PetaJabatan from "./pages/PetaJabatan";
import NotFound from "./pages/NotFound";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<PublicRoute><ErrorBoundary><Auth /></ErrorBoundary></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><ErrorBoundary><Dashboard /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><ErrorBoundary><Employees /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/import" element={<ProtectedRoute><ErrorBoundary><Import /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/import-non-asn" element={<ProtectedRoute><ErrorBoundary><ImportNonAsn /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ErrorBoundary><Profile /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/admins" element={<ProtectedRoute><ErrorBoundary><Admins /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute><ErrorBoundary><Departments /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/peta-jabatan" element={<ProtectedRoute><ErrorBoundary><PetaJabatan /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/data-builder" element={<ProtectedRoute><ErrorBoundary><DataBuilder /></ErrorBoundary></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
