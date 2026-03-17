import { useState } from 'react';
import { Users, UserCheck, UserPlus, UserMinus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { AsnPieChart, RankBarChart, DepartmentBarChart, PositionTypePieChart, JoinYearBarChart, COLORS } from '@/components/dashboard/Charts';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DEPARTMENTS } from '@/lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { profile, isAdminPusat } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  const { stats, rankData, departmentData, positionTypeData, joinYearData, isLoading } = useDashboardData({
    department: profile?.department || null,
    isAdminPusat,
    selectedDepartment,
  });

  const asnChartData = [
    { name: 'PNS', value: stats.pns, color: COLORS.PNS },
    { name: 'PPPK', value: stats.pppk, color: COLORS.PPPK },
    { name: 'Non ASN', value: stats.nonAsn, color: COLORS['Non ASN'] },
  ].filter(d => d.value > 0);

  const pageTitle = isAdminPusat 
    ? selectedDepartment === 'all' 
      ? 'Dashboard - Semua Unit Kerja' 
      : `Dashboard - ${selectedDepartment}`
    : `Dashboard - ${profile?.department}`;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title">{pageTitle}</h1>
            <p className="page-description">
              Ringkasan data pegawai {isAdminPusat && selectedDepartment === 'all' ? 'seluruh unit kerja' : ''}
            </p>
          </div>

          {isAdminPusat && (
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Pilih Unit Kerja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Unit Kerja</SelectItem>
                {DEPARTMENTS.filter(d => d !== 'Pusat').map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Pegawai"
              value={stats.total}
              icon={Users}
              variant="primary"
            />
            <StatCard
              title="Jumlah PNS"
              value={stats.pns}
              icon={UserCheck}
              variant="primary"
              description={`${stats.total > 0 ? ((stats.pns / stats.total) * 100).toFixed(1) : 0}% dari total`}
            />
            <StatCard
              title="Jumlah PPPK"
              value={stats.pppk}
              icon={UserPlus}
              variant="success"
              description={`${stats.total > 0 ? ((stats.pppk / stats.total) * 100).toFixed(1) : 0}% dari total`}
            />
            <StatCard
              title="Jumlah Non ASN"
              value={stats.nonAsn}
              icon={UserMinus}
              variant="warning"
              description={`${stats.total > 0 ? ((stats.nonAsn / stats.total) * 100).toFixed(1) : 0}% dari total`}
            />
          </div>
        )}

        {/* Charts */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <AsnPieChart data={asnChartData} />
            <RankBarChart data={rankData} />
            {positionTypeData.length > 0 && (
              <PositionTypePieChart data={positionTypeData} />
            )}
            {joinYearData.length > 0 && (
              <JoinYearBarChart data={joinYearData} />
            )}
            {isAdminPusat && selectedDepartment === 'all' && departmentData.length > 0 && (
              <DepartmentBarChart data={departmentData} />
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
