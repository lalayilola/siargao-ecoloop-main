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
      farmers: {
        Row: {
          id: string
          user_id: string
          farm_name: string
          farm_size_hectares: number
          primary_crops: string[]
          sustainability_score: number
          total_sales: number
          active_listings: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          farm_name: string
          farm_size_hectares: number
          primary_crops: string[]
          sustainability_score?: number
          total_sales?: number
          active_listings?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          farm_name?: string
          farm_size_hectares?: number
          primary_crops?: string[]
          sustainability_score?: number
          total_sales?: number
          active_listings?: number
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          user_id: string
          business_name: string
          business_type: 'hotel' | 'restaurant' | 'cafe'
          address: string
          phone: string
          sustainability_score: number
          total_waste_submitted: number
          total_produce_purchased: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          business_type: 'hotel' | 'restaurant' | 'cafe'
          address: string
          phone: string
          sustainability_score?: number
          total_waste_submitted?: number
          total_produce_purchased?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          business_type?: 'hotel' | 'restaurant' | 'cafe'
          address?: string
          phone?: string
          sustainability_score?: number
          total_waste_submitted?: number
          total_produce_purchased?: number
          created_at?: string
          updated_at?: string
        }
      }
      produce: {
        Row: {
          id: string
          farmer_id: string
          farmer_name: string
          product_name: string
          category: string
          quantity_kg: number
          price_per_kg: number
          description: string
          image_url: string | null
          available_from: string
          available_until: string | null
          status: 'available' | 'sold' | 'reserved'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          farmer_id: string
          farmer_name: string
          product_name: string
          category: string
          quantity_kg: number
          price_per_kg: number
          description: string
          image_url?: string | null
          available_from: string
          available_until?: string | null
          status?: 'available' | 'sold' | 'reserved'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          farmer_id?: string
          farmer_name?: string
          product_name?: string
          category?: string
          quantity_kg?: number
          price_per_kg?: number
          description?: string
          image_url?: string | null
          available_from?: string
          available_until?: string | null
          status?: 'available' | 'sold' | 'reserved'
          created_at?: string
          updated_at?: string
        }
      }
      produce_orders: {
        Row: {
          id: string
          produce_id: string
          farmer_id: string
          farmer_name: string
          buyer_id: string
          buyer_name: string
          buyer_type: 'hotel' | 'restaurant' | 'cafe'
          quantity_kg: number
          total_price: number
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          order_date: string
          delivery_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          produce_id: string
          farmer_id: string
          farmer_name: string
          buyer_id: string
          buyer_name: string
          buyer_type: 'hotel' | 'restaurant' | 'cafe'
          quantity_kg: number
          total_price: number
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          order_date: string
          delivery_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          produce_id?: string
          farmer_id?: string
          farmer_name?: string
          buyer_id?: string
          buyer_name?: string
          buyer_type?: 'hotel' | 'restaurant' | 'cafe'
          quantity_kg?: number
          total_price?: number
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          order_date?: string
          delivery_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trades: {
        Row: {
          id: string
          from_user_id: string
          from_role: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
          from_name: string
          from_gives: string
          to_user_id: string | null
          to_role: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
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
          from_role: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
          from_name: string
          from_gives: string
          to_user_id?: string | null
          to_role: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
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
          from_role?: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
          from_name?: string
          from_gives?: string
          to_user_id?: string | null
          to_role?: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
          to_name?: string
          to_gives?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
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
          requester_role: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
          offered_item_id: string | null
          offered_item_title: string | null
          message: string
          status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          requester_user_id: string
          requester_name: string
          requester_role: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
          offered_item_id?: string | null
          offered_item_title?: string | null
          message: string
          status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          requester_user_id?: string
          requester_name?: string
          requester_role?: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
          offered_item_id?: string | null
          offered_item_title?: string | null
          message?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
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
          buyer_role: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
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
          buyer_role: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
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
          buyer_role?: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
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
          role: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
          seller: string
          title: string
          kind: 'produce' | 'waste'
          kg: number
          price: string | null
          available_at: string
          image: string | null
          images: string[]
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
          role: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
          seller: string
          title: string
          kind: 'produce' | 'waste'
          kg: number
          price?: string | null
          available_at: string
          image?: string | null
          images?: string[]
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
          role?: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
          seller?: string
          title?: string
          kind?: 'produce' | 'waste' | 'compost'
          kg?: number
          price?: string | null
          available_at?: string
          image?: string | null
          images?: string[]
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
      feed_posts: {
        Row: {
          id: string
          user_id: string
          role: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
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
          post_type: 'farmer_produce' | 'hotel_update' | 'food_waste' | 'lgu_announcement' | 'sustainability_tip'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
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
          post_type?: 'farmer_produce' | 'hotel_update' | 'food_waste' | 'compost' | 'lgu_announcement' | 'sustainability_tip'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
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
          post_type?: 'farmer_produce' | 'hotel_update' | 'food_waste' | 'compost' | 'lgu_announcement' | 'sustainability_tip'
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
          type: 'trade_request' | 'purchase_request' | 'waste_collection' | 'announcement' | 'general' | 'order_received' | 'order_approved'
          link: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'trade_request' | 'purchase_request' | 'waste_collection' | 'announcement' | 'general' | 'order_received' | 'order_approved'
          link?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'trade_request' | 'purchase_request' | 'waste_collection' | 'announcement' | 'general' | 'order_received' | 'order_approved'
          link?: string | null
          read_at?: string | null
          created_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string
          author_name: string
          priority: 'low' | 'medium' | 'high'
          target_audience: 'all' | 'farmers' | 'hotels' | 'lgu'
          published_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id: string
          author_name: string
          priority?: 'low' | 'medium' | 'high'
          target_audience?: 'all' | 'farmers' | 'hotels' | 'lgu'
          published_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_id?: string
          author_name?: string
          priority?: 'low' | 'medium' | 'high'
          target_audience?: 'all' | 'farmers' | 'hotels' | 'lgu'
          published_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      analytics_logs: {
        Row: {
          id: string
          metric_type: string
          metric_value: number
          metric_unit: string
          recorded_at: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          metric_type: string
          metric_value: number
          metric_unit: string
          recorded_at: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          metric_type?: string
          metric_value?: number
          metric_unit?: string
          recorded_at?: string
          metadata?: Json
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
    Enums: {
      trade_status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
      purchase_status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
      role: 'farmer' | 'hotel_restaurant' | 'resident' | 'lgu_admin'
      listing_kind: 'produce' | 'waste'
      transaction_type: 'sell_only' | 'barter_only' | 'sell_and_barter'
      post_type: 'farmer_produce' | 'hotel_update' | 'food_waste' | 'lgu_announcement' | 'sustainability_tip'
      notification_type: 'trade_request' | 'purchase_request' | 'waste_collection' | 'announcement' | 'general' | 'order_received' | 'order_approved'
      priority: 'low' | 'medium' | 'high'
      target_audience: 'all' | 'farmers' | 'hotels' | 'lgu'
      reaction_type: 'like' | 'love' | 'helpful' | 'support'
    }
  }
}
