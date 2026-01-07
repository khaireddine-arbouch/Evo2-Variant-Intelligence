// Database types for Supabase tables

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          name: string
          genome_assembly: string
          selected_gene: any | null // JSONB
          created_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          genome_assembly: string
          selected_gene?: any | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          genome_assembly?: string
          selected_gene?: any | null
          updated_at?: string
        }
      }
      predictions: {
        Row: {
          id: string
          session_id: string
          position: number
          chromosome: string
          reference: string
          alternative: string
          delta_score: number
          prediction: string
          confidence: number
          gene_symbol: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          position: number
          chromosome: string
          reference: string
          alternative: string
          delta_score: number
          prediction: string
          confidence: number
          gene_symbol?: string | null
          created_at?: string
        }
        Update: {
          position?: number
          chromosome?: string
          reference?: string
          alternative?: string
          delta_score?: number
          prediction?: string
          confidence?: number
          gene_symbol?: string | null
        }
      }
    }
  }
}

