import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface ChartWrapperProps {
  title: string;
  description?: string;
  data: any[];
  children: React.ReactNode;
}

export function ChartWrapper({ title, description, data, children }: ChartWrapperProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-2 flex-none">
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center p-6 text-muted-foreground bg-muted/20 border-t border-dashed m-4 rounded-lg">
          <div className="flex flex-col items-center justify-center py-8">
            <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">Tidak ada data untuk ditampilkan</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
