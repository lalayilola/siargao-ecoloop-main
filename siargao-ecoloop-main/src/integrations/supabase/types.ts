export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      trades: {
        Row: {
          id: string
          from_user_id: string
          from_role: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          from_name: string
          from_gives: string
          to_user_id: string | null
          to_role: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          to_name: string
          to_gives: string
          status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
          trade_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          from_role: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          from_name: string
          from_gives: string
          to_user_id?: string | null
          to_role: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          to_name: string
          to_gives: string
          status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
          trade_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          from_role?: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          from_name?: string
          from_gives?: string
          to_user_id?: string | null
          to_role?: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          to_name?: string
          to_gives?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
          trade_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      purchase_requests: {
        Row: {
          id: string
          listing_id: string
          buyer_user_id: string
          buyer_name: string
          buyer_role: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          message: string | null
          quantity_kg: number | null
          status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          buyer_user_id: string
          buyer_name: string
          buyer_role: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          message?: string | null
          quantity_kg?: number | null
          status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          buyer_user_id?: string
          buyer_name?: string
          buyer_role?: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          message?: string | null
          quantity_kg?: number | null
          status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
