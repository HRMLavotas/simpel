import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { UnitActivitySummary } from '@/hooks/useUnitActivityMonitoring';

interface ExportMonitoringButtonProps {
  data: UnitActivitySummary[];
  month: string;
}

export function ExportMonitoringButton({ data, month }: ExportMonitoringButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    // Prepare CSV content
    const headers = [
      'Unit Kerja',
      'Bulan',
      'Total Perubahan',
      'Pegawai Diupdate',
      'Mutasi',
      'Perubahan Jabatan',
      'Kenaikan Pangkat',
      'Diklat/Pelatihan',
      'Update Pendidikan',
      'Update Terakhir',
      'Status'
    ];

    const getStatus = (totalChanges: number) => {
      if (totalChanges === 0) return 'Tidak Ada Aktivitas';
      if (totalChanges < 5) return 'Aktivitas Rendah';
      if (totalChanges < 20) return 'Aktivitas Sedang';
      return 'Aktivitas Tinggi';
    };

    const rows = data.map(unit => [
      unit.department,
      format(new Date(unit.month), 'MMMM yyyy', { locale: localeId }),
      unit.total_changes,
      unit.employees_updated,
      unit.mutations,
      unit.position_changes,
      unit.rank_changes,
      unit.training_records,
      unit.education_records,
      unit.last_update ? format(new Date(unit.last_update), 'dd/MM/yyyy HH:mm') : '-',
      getStatus(unit.total_changes)
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const monthLabel = format(new Date(month), 'yyyy-MM', { locale: localeId });
    link.setAttribute('href', url);
    link.setAttribute('download', `monitoring-unit-${monthLabel}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
