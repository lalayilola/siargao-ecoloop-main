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
          quantity_kg: number
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
          quantity_kg?: number
          status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      marketplace_listings: {
        Row: {
          id: string
          user_id: string
          role: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          seller: string
          title: string
          kind: 'produce' | 'waste' | 'compost'
          kg: number
          price: string | null
          available_at: string
          image: string | null
          barangay: string
          transaction_type: 'sell_only' | 'barter_only' | 'sell_and_barter'
          acceptable_exchanges: string[]
          category: string | null
          latitude: number | null
          longitude: number | null
          location_name: string | null
          location_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          seller: string
          title: string
          kind: 'produce' | 'waste' | 'compost'
          kg: number
          price?: string | null
          available_at: string
          image?: string | null
          barangay: string
          transaction_type: 'sell_only' | 'barter_only' | 'sell_and_barter'
          acceptable_exchanges: string[]
          category?: string | null
          latitude?: number | null
          longitude?: number | null
          location_name?: string | null
          location_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          seller?: string
          title?: string
          kind?: 'produce' | 'waste' | 'compost'
          kg?: number
          price?: string | null
          available_at?: string
          image?: string | null
          barangay?: string
          transaction_type?: 'sell_only' | 'barter_only' | 'sell_and_barter'
          acceptable_exchanges?: string[]
          category?: string | null
          latitude?: number | null
          longitude?: number | null
          location_name?: string | null
          location_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      food_waste_reports: {
        Row: {
          id: string
          hotel_restaurant_id: string
          hotel_restaurant_name: string
          waste_type: string
          quantity_kg: number
          collection_date: string
          collection_address: string
          status: 'pending' | 'scheduled' | 'collected' | 'processed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hotel_restaurant_id: string
          hotel_restaurant_name: string
          waste_type: string
          quantity_kg: number
          collection_date: string
          collection_address: string
          status?: 'pending' | 'scheduled' | 'collected' | 'processed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hotel_restaurant_id?: string
          hotel_restaurant_name?: string
          waste_type?: string
          quantity_kg?: number
          collection_date?: string
          collection_address?: string
          status?: 'pending' | 'scheduled' | 'collected' | 'processed'
          created_at?: string
          updated_at?: string
        }
      }
      waste_collections: {
        Row: {
          id: string
          waste_report_id: string
          collector_id: string
          collector_name: string
          scheduled_date: string
          completed_date: string | null
          status: 'scheduled' | 'in_progress' | 'completed'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          waste_report_id: string
          collector_id: string
          collector_name: string
          scheduled_date: string
          completed_date?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          waste_report_id?: string
          collector_id?: string
          collector_name?: string
          scheduled_date?: string
          completed_date?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      compost_inventory: {
        Row: {
          id: string
          lgu_id: string
          compost_type: string
          quantity_kg: number
          production_date: string
          expiry_date: string | null
          status: 'available' | 'reserved' | 'distributed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lgu_id: string
          compost_type: string
          quantity_kg: number
          production_date: string
          expiry_date?: string | null
          status?: 'available' | 'reserved' | 'distributed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lgu_id?: string
          compost_type?: string
          quantity_kg?: number
          production_date?: string
          expiry_date?: string | null
          status?: 'available' | 'reserved' | 'distributed'
          created_at?: string
          updated_at?: string
        }
      }
      compost_requests: {
        Row: {
          id: string
          farmer_id: string
          farmer_name: string
          compost_inventory_id: string
          quantity_requested_kg: number
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          request_date: string
          collection_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          farmer_id: string
          farmer_name: string
          compost_inventory_id: string
          quantity_requested_kg: number
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          request_date: string
          collection_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          farmer_id?: string
          farmer_name?: string
          compost_inventory_id?: string
          quantity_requested_kg?: number
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          request_date?: string
          collection_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      feed_posts: {
        Row: {
          id: string
          user_id: string
          role: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          author: string
          barangay: string
          body: string
          image: string | null
          kg: number | null
          price: string | null
          date: string | null
          latitude: number | null
          longitude: number | null
          location_name: string | null
          location_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          author: string
          barangay: string
          body: string
          image?: string | null
          kg?: number | null
          price?: string | null
          date?: string | null
          latitude?: number | null
          longitude?: number | null
          location_name?: string | null
          location_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin'
          author?: string
          barangay?: string
          body?: string
          image?: string | null
          kg?: number | null
          price?: string | null
          date?: string | null
          latitude?: number | null
          longitude?: number | null
          location_name?: string | null
          location_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      feed_reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          reaction_type: 'like' | 'love' | 'helpful' | 'support'
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          reaction_type: 'like' | 'love' | 'helpful' | 'support'
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          reaction_type?: 'like' | 'love' | 'helpful' | 'support'
          created_at?: string
        }
      }
      feed_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'trade_request' | 'purchase_request' | 'waste_collection' | 'compost_request' | 'announcement' | 'general'
          link: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'trade_request' | 'purchase_request' | 'waste_collection' | 'compost_request' | 'announcement' | 'general'
          link?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'trade_request' | 'purchase_request' | 'waste_collection' | 'compost_request' | 'announcement' | 'general'
          link?: string | null
          read_at?: string | null
          created_at?: string
        }
      }
      eco_points: {
        Row: {
          id: string
          user_id: string
          points: number
          activity_type: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          points: number
          activity_type: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points?: number
          activity_type?: string
          description?: string
          created_at?: string
        }
      }
      badges: {
        Row: {
          id: string
          user_id: string
          badge_name: string
          badge_description: string
          badge_icon: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_name: string
          badge_description: string
          badge_icon: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_name?: string
          badge_description?: string
          badge_icon?: string
          earned_at?: string
        }
      }
    }
  }
}
