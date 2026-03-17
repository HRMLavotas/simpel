export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      competency_test_history: {
        Row: {
          created_at: string | null
          employee_id: string
          hasil: string | null
          id: string
          jenis_uji: string | null
          keterangan: string | null
          tanggal: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          hasil?: string | null
          id?: string
          jenis_uji?: string | null
          keterangan?: string | null
          tanggal?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          hasil?: string | null
          id?: string
          jenis_uji?: string | null
          keterangan?: string | null
          tanggal?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competency_test_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      education_history: {
        Row: {
          back_title: string | null
          created_at: string | null
          employee_id: string
          front_title: string | null
          graduation_year: number | null
          id: string
          institution_name: string | null
          level: string
          major: string | null
          updated_at: string | null
        }
        Insert: {
          back_title?: string | null
          created_at?: string | null
          employee_id: string
          front_title?: string | null
          graduation_year?: number | null
          id?: string
          institution_name?: string | null
          level: string
          major?: string | null
          updated_at?: string | null
        }
        Update: {
          back_title?: string | null
          created_at?: string | null
          employee_id?: string
          front_title?: string | null
          graduation_year?: number | null
          id?: string
          institution_name?: string | null
          level?: string
          major?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "education_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          asn_status: string | null
          back_title: string | null
          birth_date: string | null
          birth_place: string | null
          created_at: string | null
          department: string
          front_title: string | null
          gender: string | null
          id: string
          join_date: string | null
          keterangan_formasi: string | null
          keterangan_penempatan: string | null
          keterangan_penugasan: string | null
          keterangan_perubahan: string | null
          name: string
          nip: string | null
          old_position: string | null
          position_name: string | null
          position_type: string | null
          rank_group: string | null
          religion: string | null
          tmt_cpns: string | null
          tmt_pensiun: string | null
          tmt_pns: string | null
          updated_at: string | null
        }
        Insert: {
          asn_status?: string | null
          back_title?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          department: string
          front_title?: string | null
          gender?: string | null
          id?: string
          join_date?: string | null
          keterangan_formasi?: string | null
          keterangan_penempatan?: string | null
          keterangan_penugasan?: string | null
          keterangan_perubahan?: string | null
          name: string
          nip?: string | null
          old_position?: string | null
          position_name?: string | null
          position_type?: string | null
          rank_group?: string | null
          religion?: string | null
          tmt_cpns?: string | null
          tmt_pensiun?: string | null
          tmt_pns?: string | null
          updated_at?: string | null
        }
        Update: {
          asn_status?: string | null
          back_title?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          department?: string
          front_title?: string | null
          gender?: string | null
          id?: string
          join_date?: string | null
          keterangan_formasi?: string | null
          keterangan_penempatan?: string | null
          keterangan_penugasan?: string | null
          keterangan_perubahan?: string | null
          name?: string
          nip?: string | null
          old_position?: string | null
          position_name?: string | null
          position_type?: string | null
          rank_group?: string | null
          religion?: string | null
          tmt_cpns?: string | null
          tmt_pensiun?: string | null
          tmt_pns?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mutation_history: {
        Row: {
          created_at: string | null
          dari_unit: string | null
          employee_id: string
          id: string
          ke_unit: string | null
          keterangan: string | null
          nomor_sk: string | null
          tanggal: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dari_unit?: string | null
          employee_id: string
          id?: string
          ke_unit?: string | null
          keterangan?: string | null
          nomor_sk?: string | null
          tanggal?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dari_unit?: string | null
          employee_id?: string
          id?: string
          ke_unit?: string | null
          keterangan?: string | null
          nomor_sk?: string | null
          tanggal?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mutation_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      position_history: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          jabatan_baru: string | null
          jabatan_lama: string | null
          keterangan: string | null
          nomor_sk: string | null
          tanggal: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          jabatan_baru?: string | null
          jabatan_lama?: string | null
          keterangan?: string | null
          nomor_sk?: string | null
          tanggal?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          jabatan_baru?: string | null
          jabatan_lama?: string | null
          keterangan?: string | null
          nomor_sk?: string | null
          tanggal?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "position_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      position_references: {
        Row: {
          abk_count: number | null
          created_at: string | null
          department: string
          grade: number | null
          id: string
          position_category: string
          position_name: string
          position_order: number | null
          updated_at: string | null
        }
        Insert: {
          abk_count?: number | null
          created_at?: string | null
          department: string
          grade?: number | null
          id?: string
          position_category: string
          position_name: string
          position_order?: number | null
          updated_at?: string | null
        }
        Update: {
          abk_count?: number | null
          created_at?: string | null
          department?: string
          grade?: number | null
          id?: string
          position_category?: string
          position_name?: string
          position_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string
          email: string
          full_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department: string
          email: string
          full_name: string
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rank_history: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          keterangan: string | null
          nomor_sk: string | null
          pangkat_baru: string | null
          pangkat_lama: string | null
          tanggal: string | null
          tmt: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          keterangan?: string | null
          nomor_sk?: string | null
          pangkat_baru?: string | null
          pangkat_lama?: string | null
          tanggal?: string | null
          tmt?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          keterangan?: string | null
          nomor_sk?: string | null
          pangkat_baru?: string | null
          pangkat_lama?: string | null
          tanggal?: string | null
          tmt?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      training_history: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          keterangan: string | null
          nama_diklat: string | null
          penyelenggara: string | null
          sertifikat: string | null
          tanggal_mulai: string | null
          tanggal_selesai: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          keterangan?: string | null
          nama_diklat?: string | null
          penyelenggara?: string | null
          sertifikat?: string | null
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          keterangan?: string | null
          nama_diklat?: string | null
          penyelenggara?: string | null
          sertifikat?: string | null
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_department: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin_unit" | "admin_pusat"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin_unit", "admin_pusat"],
    },
  },
} as const
