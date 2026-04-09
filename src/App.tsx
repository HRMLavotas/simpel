import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { queryClient } from "@/lib/query-client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import type { AppRole } from "@/lib/constants";

// Lazy load pages for code splitting
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Employees = lazy(() => import("./pages/Employees"));
const Import = lazy(() => import("./pages/Import"));
const ImportNonAsn = lazy(() => import("./pages/ImportNonAsn"));
const Profile = lazy(() => import("./pages/Profile"));
const Admins = lazy(() => import("./pages/Admins"));
const Departments = lazy(() => import("./pages/Departments"));
const DataBuilder = lazy(() => import("./pages/DataBuilder"));
const PetaJabatan = lazy(() => import("./pages/PetaJabatan"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: AppRole[] }) {
  const { user, role, isLoading } = useAuth();

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

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/dashboard" replace />;
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
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <SidebarProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth" element={<PublicRoute><ErrorBoundary><Auth /></ErrorBoundary></PublicRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><ErrorBoundary><Dashboard /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/employees" element={<ProtectedRoute><ErrorBoundary><Employees /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/import" element={<ProtectedRoute allowedRoles={['admin_unit', 'admin_pusat']}><ErrorBoundary><Import /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/import-non-asn" element={<ProtectedRoute allowedRoles={['admin_unit', 'admin_pusat']}><ErrorBoundary><ImportNonAsn /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ErrorBoundary><Profile /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/admins" element={<ProtectedRoute allowedRoles={['admin_pusat']}><ErrorBoundary><Admins /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/departments" element={<ProtectedRoute allowedRoles={['admin_pusat']}><ErrorBoundary><Departments /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/peta-jabatan" element={<ProtectedRoute><ErrorBoundary><PetaJabatan /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/data-builder" element={<ProtectedRoute allowedRoles={['admin_unit', 'admin_pusat', 'admin_pimpinan']}><ErrorBoundary><DataBuilder /></ErrorBoundary></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
