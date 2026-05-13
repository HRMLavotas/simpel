/**
 * CaseDetailCard Component
 * Displays case-specific details based on case type
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmployeeCase } from "@/lib/employeeCaseTypes";
import {
  AlertCircle,
  TrendingDown,
  Scale,
  FileText,
  Heart,
  Info,
  Users,
  DollarSign,
  CreditCard,
  Clock,
  UserMinus,
  Search,
  HelpCircle,
} from "lucide-react";
import { formatDateID } from "@/lib/date-utils";

interface CaseDetailCardProps {
  employeeCase: EmployeeCase;
}

export default function CaseDetailCard({ employeeCase }: CaseDetailCardProps) {
  const { caseType, caseDetails } = employeeCase;

  if (!caseDetails) return null;

  const renderIcon = () => {
    switch (caseType) {
      case "perceraian":
        return <Users className="h-5 w-5 text-red-500" />;
      case "hutang":
        return <DollarSign className="h-5 w-5 text-orange-500" />;
      case "pinjaman_online":
        return <CreditCard className="h-5 w-5 text-yellow-500" />;
      case "presensi":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "pengunduran_diri":
        return <UserMinus className="h-5 w-5 text-purple-500" />;
      case "temuan":
        return <Search className="h-5 w-5 text-green-500" />;
      case "lainnya":
        return <HelpCircle className="h-5 w-5 text-gray-500" />;
      // Legacy icons
      case "disiplin":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "kinerja":
        return <TrendingDown className="h-5 w-5 text-orange-500" />;
      case "hukum":
        return <Scale className="h-5 w-5 text-purple-500" />;
      case "kesehatan":
        return <Heart className="h-5 w-5 text-pink-500" />;
      case "administrasi":
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderDetails = () => {
    // Show "Lainnya" kategori if exists
    if (caseType === "lainnya" && caseDetails.lainnyaKategori) {
      return (
        <div>
          <p className="text-sm text-muted-foreground">Kategori</p>
          <Badge variant="outline" className="mt-1">
            {caseDetails.lainnyaKategori}
          </Badge>
        </div>
      );
    }

    // Legacy case-specific details (for backward compatibility)
    switch (caseType) {
      case "disiplin":
        return (
          <>
            {caseDetails.violationType && (
              <div>
                <p className="text-sm text-muted-foreground">Jenis Pelanggaran</p>
                <p className="font-medium mt-1">{caseDetails.violationType}</p>
              </div>
            )}
            {caseDetails.violationDate && (
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Pelanggaran</p>
                <p className="font-medium mt-1">
                  {formatDateID(caseDetails.violationDate)}
                </p>
              </div>
            )}
            {caseDetails.reportedBy && (
              <div>
                <p className="text-sm text-muted-foreground">Dilaporkan Oleh</p>
                <p className="font-medium mt-1">{caseDetails.reportedBy}</p>
              </div>
            )}
          </>
        );

      case "kinerja":
        return (
          <>
            {caseDetails.performanceIssue && (
              <div>
                <p className="text-sm text-muted-foreground">Masalah Kinerja</p>
                <p className="mt-1">{caseDetails.performanceIssue}</p>
              </div>
            )}
            {caseDetails.performancePeriod && (
              <div>
                <p className="text-sm text-muted-foreground">Periode Penilaian</p>
                <p className="font-medium mt-1">{caseDetails.performancePeriod}</p>
              </div>
            )}
            {caseDetails.targetNotMet && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Target yang Tidak Tercapai
                </p>
                <p className="mt-1">{caseDetails.targetNotMet}</p>
              </div>
            )}
          </>
        );

      case "etika":
        return (
          <>
            {caseDetails.ethicsViolation && (
              <div>
                <p className="text-sm text-muted-foreground">Pelanggaran Etika</p>
                <p className="mt-1">{caseDetails.ethicsViolation}</p>
              </div>
            )}
            {caseDetails.ethicsImpact && (
              <div>
                <p className="text-sm text-muted-foreground">Dampak</p>
                <p className="mt-1">{caseDetails.ethicsImpact}</p>
              </div>
            )}
          </>
        );

      case "administrasi":
        return (
          <>
            {caseDetails.adminIssue && (
              <div>
                <p className="text-sm text-muted-foreground">Masalah Administrasi</p>
                <p className="mt-1">{caseDetails.adminIssue}</p>
              </div>
            )}
            {caseDetails.adminDocuments && (
              <div>
                <p className="text-sm text-muted-foreground">Dokumen Terkait</p>
                <p className="mt-1">{caseDetails.adminDocuments}</p>
              </div>
            )}
          </>
        );

      case "hukum":
        return (
          <>
            {caseDetails.legalCase && (
              <div>
                <p className="text-sm text-muted-foreground">Kasus Hukum</p>
                <p className="mt-1">{caseDetails.legalCase}</p>
              </div>
            )}
            {caseDetails.legalStatus && (
              <div>
                <p className="text-sm text-muted-foreground">Status Hukum</p>
                <Badge variant="outline" className="mt-1">
                  {caseDetails.legalStatus}
                </Badge>
              </div>
            )}
            {caseDetails.courtName && (
              <div>
                <p className="text-sm text-muted-foreground">Pengadilan</p>
                <p className="font-medium mt-1">{caseDetails.courtName}</p>
              </div>
            )}
          </>
        );

      case "kesehatan":
        return (
          <>
            {caseDetails.healthIssue && (
              <div>
                <p className="text-sm text-muted-foreground">Masalah Kesehatan</p>
                <p className="mt-1">{caseDetails.healthIssue}</p>
              </div>
            )}
            {caseDetails.treatmentStatus && (
              <div>
                <p className="text-sm text-muted-foreground">Status Perawatan</p>
                <Badge variant="outline" className="mt-1">
                  {caseDetails.treatmentStatus}
                </Badge>
              </div>
            )}
            {caseDetails.medicalDocuments && (
              <div>
                <p className="text-sm text-muted-foreground">Dokumen Medis</p>
                <p className="mt-1 text-sm">{caseDetails.medicalDocuments}</p>
              </div>
            )}
          </>
        );

      case "lainnya":
        return (
          <>
            {caseDetails.otherDetails && (
              <div>
                <p className="text-sm text-muted-foreground">Detail Lainnya</p>
                <p className="mt-1">{caseDetails.otherDetails}</p>
              </div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  const details = renderDetails();

  // Don't render card if no details
  if (!details) return null;

  return (
    <Card className="border-primary/10 shadow-lg">
      <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          {renderIcon()}
          Detail Spesifik Kasus
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">{details}</CardContent>
    </Card>
  );
}
