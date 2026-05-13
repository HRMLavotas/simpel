/**
 * CaseAccessManagement Component
 * Manages user access permissions for the case management system
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Trash2, UserPlus, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  getAllAccessControl,
  grantAccess,
  revokeAccess,
  CaseAccessControl,
} from "@/lib/employeeCaseStorage";
import { TableSkeleton } from "@/components/skeletons";

interface CaseAccessManagementProps {
  onAccessChange?: () => void;
}

export default function CaseAccessManagement({
  onAccessChange,
}: CaseAccessManagementProps) {
  const { user } = useAuth();
  const [accessList, setAccessList] = useState<CaseAccessControl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [canEdit, setCanEdit] = useState(true);
  const [userToRevoke, setUserToRevoke] = useState<CaseAccessControl | null>(
    null
  );

  const loadAccessList = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getAllAccessControl();
      setAccessList(list);
    } catch (error) {
      console.error("Error loading access list:", error);
      toast.error("Gagal memuat daftar akses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAvailableUsers = useCallback(async () => {
    try {
      // Get ONLY admin_pusat users from user_roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "admin_pusat"); // Only admin_pusat

      if (rolesError) throw rolesError;

      if (!rolesData || rolesData.length === 0) {
        setAvailableUsers([]);
        return;
      }

      // Get profiles for these admin_pusat users
      const adminPusatIds = rolesData.map(r => r.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, department")
        .in("id", adminPusatIds)
        .order("full_name");

      if (profilesError) throw profilesError;

      // Combine data - only admin_pusat users
      const users = (profilesData || []).map(p => ({
        id: p.id,
        name: p.full_name || p.email,
        nip: p.email, // Use email as identifier
        role: 'admin_pusat', // All are admin_pusat
        department: p.department || '-',
      }));

      setAvailableUsers(users);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Gagal memuat daftar admin pusat");
    }
  }, []);

  useEffect(() => {
    loadAccessList();
    loadAvailableUsers();
  }, [loadAccessList, loadAvailableUsers]);

  const handleGrantAccess = async () => {
    if (!selectedUser || !user) return;

    try {
      await grantAccess(
        selectedUser.id,
        selectedUser.name,
        selectedUser.role,
        canEdit,
        user.id
      );

      toast.success(`Akses berhasil diberikan kepada ${selectedUser.name}`);
      setShowAddDialog(false);
      setSelectedUser(null);
      setCanEdit(true);
      setSearchQuery(""); // Reset search
      loadAccessList();
      onAccessChange?.();
    } catch (error) {
      console.error("Error granting access:", error);
      toast.error("Gagal memberikan akses");
    }
  };

  const handleRevokeAccess = async () => {
    if (!userToRevoke) return;

    try {
      await revokeAccess(userToRevoke.userId);
      toast.success(`Akses ${userToRevoke.userName} berhasil dicabut`);
      setUserToRevoke(null);
      loadAccessList();
      onAccessChange?.();
    } catch (error) {
      console.error("Error revoking access:", error);
      toast.error("Gagal mencabut akses");
    }
  };

  const filteredUsers = availableUsers.filter(
    (u) =>
      !accessList.some((a) => a.userId === u.id) &&
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.nip.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, { label: string; variant: any }> = {
      admin_pusat: { label: "Admin Pusat", variant: "default" },
      admin_unit: { label: "Admin Unit", variant: "secondary" },
      user_pimpinan: { label: "Pimpinan", variant: "outline" },
      user_unit: { label: "User Unit", variant: "outline" },
    };

    const roleInfo = roleLabels[role] || { label: role, variant: "outline" };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Pengaturan Akses Kasus Pegawai
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Kelola Admin Pusat yang dapat mengakses menu Kasus Pegawai
              </p>
            </div>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Tambah Admin Pusat
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : accessList.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Belum ada Admin Pusat yang diberikan akses</p>
              <p className="text-sm mt-2">
                Klik "Tambah Admin Pusat" untuk memberikan akses ke menu Kasus Pegawai
              </p>
              <p className="text-xs mt-4 text-muted-foreground/70">
                Catatan: Hanya Admin Pusat yang dapat ditambahkan ke daftar akses
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Hak Akses</TableHead>
                    <TableHead>Diberikan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessList.map((access) => (
                    <TableRow key={access.userId}>
                      <TableCell className="font-medium">
                        {access.userName}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {/* Get email from availableUsers or show placeholder */}
                        {availableUsers.find(u => u.id === access.userId)?.nip || 
                         accessList.find(a => a.userId === access.userId)?.userName.toLowerCase().includes('@') 
                           ? access.userName 
                           : '-'}
                      </TableCell>
                      <TableCell>{getRoleBadge(access.userRole)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant="outline">Lihat</Badge>
                          {access.canEdit && (
                            <Badge variant="default">Edit</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(access.grantedAt).toLocaleDateString("id-ID", {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToRevoke(access)}
                          className="hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Access Dialog */}
      {showAddDialog && (
        <AlertDialog open onOpenChange={(open) => !open && setShowAddDialog(false)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Berikan Akses Kasus Pegawai</AlertDialogTitle>
              <AlertDialogDescription>
                Pilih Admin Pusat yang akan diberikan akses ke sistem kasus pegawai. Hanya Admin Pusat yang dapat ditambahkan.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              {selectedUser ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted">
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Email: {selectedUser.nip}
                    </p>
                    {selectedUser.department && (
                      <p className="text-sm text-muted-foreground">
                        Unit: {selectedUser.department}
                      </p>
                    )}
                    <div className="mt-2">{getRoleBadge(selectedUser.role)}</div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="can-edit">Izinkan Edit</Label>
                      <p className="text-sm text-muted-foreground">
                        Pengguna dapat membuat, mengedit, dan menghapus kasus
                      </p>
                    </div>
                    <Switch
                      id="can-edit"
                      checked={canEdit}
                      onCheckedChange={setCanEdit}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleGrantAccess} className="flex-1">
                      Berikan Akses
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(null);
                        setCanEdit(true);
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama atau email Admin Pusat..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className="w-full text-left p-4 hover:bg-muted transition-colors border-b last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{u.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {u.nip}
                              </p>
                              {u.department && u.department !== '-' && (
                                <p className="text-xs text-muted-foreground">
                                  {u.department}
                                </p>
                              )}
                            </div>
                            {getRoleBadge(u.role)}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        {searchQuery
                          ? "Tidak ada Admin Pusat ditemukan"
                          : availableUsers.length === 0
                          ? "Tidak ada Admin Pusat lain yang tersedia"
                          : "Semua Admin Pusat sudah memiliki akses"}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                    >
                      Tutup
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Revoke Access Confirmation */}
      <AlertDialog
        open={!!userToRevoke}
        onOpenChange={(open) => !open && setUserToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cabut Akses?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mencabut akses {userToRevoke?.userName} ke sistem kasus
              pegawai. Pengguna tidak akan dapat melihat atau mengelola kasus
              lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAccess}
              className="bg-destructive"
            >
              Cabut Akses
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
