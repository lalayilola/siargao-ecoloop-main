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
      profiles: {
        Row: {
          id: string
          full_name: string
          barangay: string
          address: string
          phone: string
          primary_role: Database['public']['Enums']['app_role']
          lgu_approved: boolean
          municipality: Database['public']['Enums']['municipality']
          is_super_admin: boolean
          profile_picture_url: string | null
          cover_photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name?: string
          barangay?: string
          address?: string
          phone?: string
          primary_role?: Database['public']['Enums']['app_role']
          lgu_approved?: boolean
          municipality?: Database['public']['Enums']['municipality']
          is_super_admin?: boolean
          profile_picture_url?: string | null
          cover_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          barangay?: string
          address?: string
          phone?: string
          primary_role?: Database['public']['Enums']['app_role']
          lgu_approved?: boolean
          municipality?: Database['public']['Enums']['municipality']
          is_super_admin?: boolean
          profile_picture_url?: string | null
          cover_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: Database['public']['Enums']['app_role']
        }
        Insert: {
          id?: string
          user_id: string
          role: Database['public']['Enums']['app_role']
        }
        Update: {
          id?: string
          user_id?: string
          role?: Database['public']['Enums']['app_role']
        }
      }
      feed_posts: {
        Row: {
          id: string
          user_id: string
          role: Database['public']['Enums']['app_role']
          author: string
          barangay: string
          body: string
          image: string | null
          images: string[]
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
          role?: Database['public']['Enums']['app_role']
          author: string
          barangay: string
          body: string
          image?: string | null
          images?: string[]
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
          role?: Database['public']['Enums']['app_role']
          author?: string
          barangay?: string
          body?: string
          image?: string | null
          images?: string[]
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
      marketplace_listings: {
        Row: {
          id: string
          user_id: string
          title: string
          kind: Database['public']['Enums']['listing_kind']
          seller: string
          role: Database['public']['Enums']['app_role']
          barangay: string
          municipality: Database['public']['Enums']['municipality']
          kg: number
          price: string | null
          available_at: string
          image: string | null
          images: string[]
          transaction_type: Database['public']['Enums']['transaction_type']
          acceptable_exchanges: string[]
          category: string
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
          title: string
          kind?: Database['public']['Enums']['listing_kind']
          seller: string
          role?: Database['public']['Enums']['app_role']
          barangay: string
          municipality?: Database['public']['Enums']['municipality']
          kg: number
          price?: string | null
          available_at?: string
          image?: string | null
          images?: string[]
          transaction_type?: Database['public']['Enums']['transaction_type']
          acceptable_exchanges?: string[]
          category?: string
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
          title?: string
          kind?: Database['public']['Enums']['listing_kind']
          seller?: string
          role?: Database['public']['Enums']['app_role']
          barangay?: string
          municipality?: Database['public']['Enums']['municipality']
          kg?: number
          price?: string | null
          available_at?: string
          image?: string | null
          images?: string[]
          transaction_type?: Database['public']['Enums']['transaction_type']
          acceptable_exchanges?: string[]
          category?: string
          latitude?: number | null
          longitude?: number | null
          location_name?: string | null
          location_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      planning_entries: {
        Row: {
          id: string
          user_id: string
          role: Database['public']['Enums']['app_role']
          author: string
          need: string
          when: string
          kg: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: Database['public']['Enums']['app_role']
          author: string
          need: string
          when: string
          kg?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: Database['public']['Enums']['app_role']
          author?: string
          need?: string
          when?: string
          kg?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      trades: {
        Row: {
          id: string
          from_user_id: string
          from_role: Database['public']['Enums']['app_role']
          from_name: string
          from_gives: string
          to_user_id: string | null
          to_role: Database['public']['Enums']['app_role']
          to_name: string
          to_gives: string
          status: Database['public']['Enums']['trade_status']
          trade_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          from_role?: Database['public']['Enums']['app_role']
          from_name: string
          from_gives: string
          to_user_id?: string | null
          to_role?: Database['public']['Enums']['app_role']
          to_name: string
          to_gives: string
          status?: Database['public']['Enums']['trade_status']
          trade_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          from_role?: Database['public']['Enums']['app_role']
          from_name?: string
          from_gives?: string
          to_user_id?: string | null
          to_role?: Database['public']['Enums']['app_role']
          to_name?: string
          to_gives?: string
          status?: Database['public']['Enums']['trade_status']
          trade_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      trade_requests: {
        Row: {
          id: string
          listing_id: string
          requester_user_id: string
          requester_name: string
          requester_role: Database['public']['Enums']['app_role']
          offered_item_id: string | null
          offered_item_title: string | null
          message: string
          status: Database['public']['Enums']['trade_status']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          requester_user_id: string
          requester_name: string
          requester_role: Database['public']['Enums']['app_role']
          offered_item_id?: string | null
          offered_item_title?: string | null
          message: string
          status?: Database['public']['Enums']['trade_status']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          requester_user_id?: string
          requester_name?: string
          requester_role?: Database['public']['Enums']['app_role']
          offered_item_id?: string | null
          offered_item_title?: string | null
          message?: string
          status?: Database['public']['Enums']['trade_status']
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
          buyer_role: Database['public']['Enums']['app_role']
          message: string | null
          quantity_kg: number
          status: Database['public']['Enums']['trade_status']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          buyer_user_id: string
          buyer_name: string
          buyer_role: Database['public']['Enums']['app_role']
          message?: string | null
          quantity_kg?: number
          status?: Database['public']['Enums']['trade_status']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          buyer_user_id?: string
          buyer_name?: string
          buyer_role?: Database['public']['Enums']['app_role']
          message?: string | null
          quantity_kg?: number
          status?: Database['public']['Enums']['trade_status']
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          trade_request_id: string | null
          purchase_request_id: string | null
          listing_id: string | null
          participant_1_id: string
          participant_2_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trade_request_id?: string | null
          purchase_request_id?: string | null
          listing_id?: string | null
          participant_1_id: string
          participant_2_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trade_request_id?: string | null
          purchase_request_id?: string | null
          listing_id?: string | null
          participant_1_id?: string
          participant_2_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          image_url: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          image_url?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          image_url?: string | null
          read_at?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          link: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          link?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          link?: string | null
          read_at?: string | null
          created_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          lgu_admin_id: string
          title: string
          content: string
          category: string
          importance: string
          status: string
          published_at: string | null
          created_at: string
          updated_at: string
          image_url: string | null
          images: string | null
        }
        Insert: {
          id?: string
          lgu_admin_id: string
          title: string
          content: string
          category?: string
          importance?: string
          status?: string
          published_at?: string | null
          created_at?: string
          updated_at?: string
          image_url?: string | null
          images?: string | null
        }
        Update: {
          id?: string
          lgu_admin_id?: string
          title?: string
          content?: string
          category?: string
          importance?: string
          status?: string
          published_at?: string | null
          created_at?: string
          updated_at?: string
          image_url?: string | null
          images?: string | null
        }
      }
      announcement_reactions: {
        Row: {
          id: string
          announcement_id: string
          user_id: string
          reaction_type: string
          created_at: string
        }
        Insert: {
          id?: string
          announcement_id: string
          user_id: string
          reaction_type: string
          created_at?: string
        }
        Update: {
          id?: string
          announcement_id?: string
          user_id?: string
          reaction_type?: string
          created_at?: string
        }
      }
      announcement_comments: {
        Row: {
          id: string
          announcement_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          announcement_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          announcement_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
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
      feed_reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          reaction_type: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          reaction_type: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          reaction_type?: string
          created_at?: string
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
          status: string
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
          status?: string
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
          status?: string
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
          request_date: string
          collection_date: string | null
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          farmer_id: string
          farmer_name: string
          compost_inventory_id: string
          quantity_requested_kg: number
          request_date: string
          collection_date?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          farmer_id?: string
          farmer_name?: string
          compost_inventory_id?: string
          quantity_requested_kg?: number
          request_date?: string
          collection_date?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          message: string
          response: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          response: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          response?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Enums: {
      app_role: 'farmer' | 'restaurant' | 'resident' | 'lgu_admin' | 'super_admin'
      listing_kind: 'produce' | 'waste' | 'compost'
      trade_status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
      transaction_type: 'sell_only' | 'barter_only' | 'sell_and_barter'
      municipality: 'burgos' | 'dapa' | 'general_luna' | 'pilar' | 'san_benito' | 'san_isidro' | 'santa_monica' | 'socorro' | 'del_carmen'
    }
  }
}
