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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ahli_bilik: {
        Row: {
          bilik_id: string
          id: string
          joined_at: string
          peranan: string
          user_id: string
        }
        Insert: {
          bilik_id: string
          id?: string
          joined_at?: string
          peranan?: string
          user_id: string
        }
        Update: {
          bilik_id?: string
          id?: string
          joined_at?: string
          peranan?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ahli_bilik_bilik_id_fkey"
            columns: ["bilik_id"]
            isOneToOne: false
            referencedRelation: "bilik"
            referencedColumns: ["id"]
          },
        ]
      }
      bacaan: {
        Row: {
          bilik_id: string
          dibaca_pada: string
          user_id: string
        }
        Insert: {
          bilik_id: string
          dibaca_pada?: string
          user_id: string
        }
        Update: {
          bilik_id?: string
          dibaca_pada?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bacaan_bilik_id_fkey"
            columns: ["bilik_id"]
            isOneToOne: false
            referencedRelation: "bilik"
            referencedColumns: ["id"]
          },
        ]
      }
      bilik: {
        Row: {
          ada_kata_laluan: boolean
          created_at: string
          id: string
          kod: string
          nama: string
          pemilik: string
          tajuk: string | null
        }
        Insert: {
          ada_kata_laluan?: boolean
          created_at?: string
          id?: string
          kod: string
          nama: string
          pemilik: string
          tajuk?: string | null
        }
        Update: {
          ada_kata_laluan?: boolean
          created_at?: string
          id?: string
          kod?: string
          nama?: string
          pemilik?: string
          tajuk?: string | null
        }
        Relationships: []
      }
      bilik_rahsia: {
        Row: {
          bilik_id: string
          cincang: string
          created_at: string
        }
        Insert: {
          bilik_id: string
          cincang: string
          created_at?: string
        }
        Update: {
          bilik_id?: string
          cincang?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bilik_rahsia_bilik_id_fkey"
            columns: ["bilik_id"]
            isOneToOne: true
            referencedRelation: "bilik"
            referencedColumns: ["id"]
          },
        ]
      }
      kata_tapis: {
        Row: {
          id: string
          kata: string
          tahap: string
        }
        Insert: {
          id?: string
          kata: string
          tahap?: string
        }
        Update: {
          id?: string
          kata?: string
          tahap?: string
        }
        Relationships: []
      }
      laporan: {
        Row: {
          created_at: string
          id: string
          mesej_id: string | null
          nota: string | null
          pelapor: string
          pos_id: string | null
          sebab: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mesej_id?: string | null
          nota?: string | null
          pelapor: string
          pos_id?: string | null
          sebab: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mesej_id?: string | null
          nota?: string | null
          pelapor?: string
          pos_id?: string | null
          sebab?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "laporan_mesej_id_fkey"
            columns: ["mesej_id"]
            isOneToOne: false
            referencedRelation: "mesej"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_pos_id_fkey"
            columns: ["pos_id"]
            isOneToOne: false
            referencedRelation: "pos"
            referencedColumns: ["id"]
          },
        ]
      }
      mesej: {
        Row: {
          bilik_id: string
          created_at: string
          ditapis: boolean
          id: string
          imej_url: string | null
          kandungan: string
          user_id: string
        }
        Insert: {
          bilik_id: string
          created_at?: string
          ditapis?: boolean
          id?: string
          imej_url?: string | null
          kandungan?: string
          user_id: string
        }
        Update: {
          bilik_id?: string
          created_at?: string
          ditapis?: boolean
          id?: string
          imej_url?: string | null
          kandungan?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mesej_bilik_id_fkey"
            columns: ["bilik_id"]
            isOneToOne: false
            referencedRelation: "bilik"
            referencedColumns: ["id"]
          },
        ]
      }
      pos: {
        Row: {
          created_at: string
          ditapis: boolean
          id: string
          imej_url: string | null
          induk_id: string | null
          kandungan: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ditapis?: boolean
          id?: string
          imej_url?: string | null
          induk_id?: string | null
          kandungan?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ditapis?: boolean
          id?: string
          imej_url?: string | null
          induk_id?: string | null
          kandungan?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_induk_id_fkey"
            columns: ["induk_id"]
            isOneToOne: false
            referencedRelation: "pos"
            referencedColumns: ["id"]
          },
        ]
      }
      profil: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nama_paparan: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          nama_paparan?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nama_paparan?: string
        }
        Relationships: []
      }
      suka_pos: {
        Row: {
          created_at: string
          pos_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          pos_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          pos_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suka_pos_pos_id_fkey"
            columns: ["pos_id"]
            isOneToOne: false
            referencedRelation: "pos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adalah_ahli: { Args: { _bilik: string; _user: string }; Returns: boolean }
      bilik_berkunci: { Args: { _kod: string }; Returns: boolean }
      cipta_bilik: {
        Args: {
          _kata_laluan?: string
          _kod: string
          _nama: string
          _tajuk: string
        }
        Returns: string
      }
      sertai_bilik: {
        Args: { _kata_laluan?: string; _kod: string }
        Returns: string
      }
      tapis_teks: { Args: { _teks: string }; Returns: string }
      tetap_kata_laluan: {
        Args: { _bilik: string; _kata_laluan: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
