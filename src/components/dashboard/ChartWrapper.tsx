import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

import { ChartDataItem } from '@/types/chart';

interface ChartWrapperProps {
  title: string;
  description?: string;
  data: ChartDataItem[];
  children: React.ReactNode;
}

export function ChartWrapper({ title, description, data, children }: ChartWrapperProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">Tidak ada data untuk ditampilkan</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
