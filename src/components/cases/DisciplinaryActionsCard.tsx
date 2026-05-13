/**
 * DisciplinaryActionsCard Component
 * Displays list of disciplinary actions for an employee case
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Calendar, FileText, User, AlertCircle } from "lucide-react";
import { formatDateID } from "@/lib/date-utils";
import { DISCIPLINARY_LEVELS, DISCIPLINARY_TYPES } from "./DisciplinaryActionDialog";

interface DisciplinaryAction {
  level: "ringan" | "sedang" | "berat";
  type: string;
  decisionNumber: string;
  decisionDate: string;
  effectiveDate: string;
  endDate?: string;
  issuedBy: string;
  violation: string;
  notes?: string;
  documentLink?: string;
  addedAt?: string;
}

interface DisciplinaryActionsCardProps {
  disciplinaryActions: DisciplinaryAction[];
}

export default function DisciplinaryActionsCard({
  disciplinaryActions,
}: DisciplinaryActionsCardProps) {
  if (!disciplinaryActions || disciplinaryActions.length === 0) {
    return null;
  }

  const getLevelColor = (level: string) => {
    const colors = {
      ringan: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      sedang: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      berat: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getTypeLabel = (level: string, type: string) => {
    const types = DISCIPLINARY_TYPES[level as keyof typeof DISCIPLINARY_TYPES];
    return types?.find((t) => t.value === type)?.label || type;
  };

  return (
    <Card className="border-red-200 dark:border-red-900 shadow-lg bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20">
      <CardHeader className="border-b border-red-200 dark:border-red-900 bg-gradient-to-r from-red-100/50 to-transparent dark:from-red-950/30">
        <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
          <Scale className="h-5 w-5" />
          Riwayat Hukuman Disiplin
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {disciplinaryActions
            .sort((a, b) => new Date(b.decisionDate).getTime() - new Date(a.decisionDate).getTime())
            .map((action, index) => (
              <div
                key={index}
                className="p-4 border border-red-200 dark:border-red-900 rounded-lg bg-white dark:bg-gray-950 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getLevelColor(action.level)}>
                        {DISCIPLINARY_LEVELS[action.level]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        SK No. {action.decisionNumber}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground">
                      {getTypeLabel(action.level, action.type)}
                    </h4>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <div>
                      <p className="text-xs">Tanggal Keputusan</p>
                      <p className="font-medium text-foreground">
                        {formatDateID(action.decisionDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <div>
                      <p className="text-xs">Mulai Berlaku</p>
                      <p className="font-medium text-foreground">
                        {formatDateID(action.effectiveDate)}
                      </p>
                    </div>
                  </div>
                  {action.endDate && (
                    <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                      <Calendar className="h-4 w-4" />
                      <div>
                        <p className="text-xs">Berakhir</p>
                        <p className="font-medium text-foreground">
                          {formatDateID(action.endDate)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Issued By */}
                <div className="flex items-start gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ditetapkan oleh</p>
                    <p className="font-medium text-foreground">{action.issuedBy}</p>
                  </div>
                </div>

                {/* Violation */}
                <div className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pelanggaran</p>
                    <p className="text-foreground">{action.violation}</p>
                  </div>
                </div>

                {/* Notes */}
                {action.notes && (
                  <div className="pt-2 border-t border-red-100 dark:border-red-900/50">
                    <p className="text-xs text-muted-foreground mb-1">Catatan</p>
                    <p className="text-sm text-foreground">{action.notes}</p>
                  </div>
                )}

                {/* Document Link */}
                {action.documentLink && (
                  <div className="pt-2 border-t border-red-100 dark:border-red-900/50">
                    <a
                      href={action.documentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      Lihat Dokumen SK
                    </a>
                  </div>
                )}
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
