import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Plus, Trash2, Calendar, User, Briefcase } from "lucide-react";
import { LeadershipDirective } from "@/lib/leadershipDirectiveStorage";
import { formatDateID } from "@/lib/date-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface LeadershipDirectivesCardProps {
  directives: LeadershipDirective[];
  canEdit: boolean;
  onAdd: () => void;
  onEdit: (directive: LeadershipDirective) => void;
  onDelete: (directiveId: string) => void;
}

export default function LeadershipDirectivesCard({
  directives,
  canEdit,
  onAdd,
  onEdit,
  onDelete,
}: LeadershipDirectivesCardProps) {
  const [directiveToDelete, setDirectiveToDelete] = useState<LeadershipDirective | null>(null);

  const handleDelete = () => {
    if (directiveToDelete) {
      onDelete(directiveToDelete.id!);
      setDirectiveToDelete(null);
    }
  };

  return (
    <>
      <Card className="border-blue-200 dark:border-blue-800 shadow-lg bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
        <CardHeader className="border-b border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-100/50 to-transparent dark:from-blue-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <CardTitle className="text-blue-900 dark:text-blue-100">Arahan Pimpinan</CardTitle>
                {directives.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {directives.length} arahan tercatat
                  </p>
                )}
              </div>
            </div>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAdd}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah Arahan
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {directives.length === 0 ? (
            <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-dashed border-blue-200 dark:border-blue-800 text-center">
              <p className="text-sm text-muted-foreground mb-2">Belum ada arahan pimpinan</p>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={onAdd} className="mt-2">
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Arahan Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {directives.map((directive, index) => (
                <div
                  key={directive.id}
                  className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow"
                >
                  {/* Header with date and actions */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDateID(directive.directiveDate, { 
                          year: "numeric", 
                          month: "long", 
                          day: "numeric" 
                        })}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        #{directives.length - index}
                      </Badge>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(directive)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDirectiveToDelete(directive)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Issued by info */}
                  <div className="flex flex-wrap gap-3 mb-3 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="font-medium text-foreground">{directive.issuedByName}</span>
                    </div>
                    {directive.issuedByPosition && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        <span>{directive.issuedByPosition}</span>
                      </div>
                    )}
                  </div>

                  {/* Directive text */}
                  <div className="pl-4 border-l-2 border-blue-300 dark:border-blue-700">
                    <p className="text-sm text-muted-foreground mb-1">Arahan:</p>
                    <p className="text-foreground font-medium whitespace-pre-wrap">
                      {directive.directiveText}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!directiveToDelete} onOpenChange={() => setDirectiveToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Arahan Pimpinan?</AlertDialogTitle>
            <AlertDialogDescription>
              Arahan dari <strong>{directiveToDelete?.issuedByName}</strong> pada tanggal{" "}
              <strong>
                {directiveToDelete && formatDateID(directiveToDelete.directiveDate, { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </strong>{" "}
              akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
