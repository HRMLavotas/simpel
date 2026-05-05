import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    logger.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold text-primary/20">404</h1>
          <h2 className="text-2xl font-bold">Halaman Tidak Ditemukan</h2>
          <p className="text-muted-foreground">
            Halaman <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">{location.pathname}</code> tidak ada atau sudah dipindahkan.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <Button onClick={() => navigate('/dashboard')} className="gap-2">
            <Home className="h-4 w-4" />
            Ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
