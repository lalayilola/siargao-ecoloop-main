-- Create notification triggers for marketplace events

-- Function to create notification for trade request events
CREATE OR REPLACE FUNCTION public.notify_trade_request_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  listing_owner_id UUID;
  listing_title TEXT;
  requester_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get listing details
    SELECT user_id, title INTO listing_owner_id, listing_title
    FROM public.marketplace_listings
    WHERE id = NEW.listing_id;
    
    -- Get requester name
    SELECT requester_name INTO requester_name
    FROM public.trade_requests
    WHERE id = NEW.id;
    
    -- Create notification for listing owner
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      listing_owner_id,
      'trade_request',
      'New Trade Request',
      requester_name || ' wants to trade for your listing: ' || listing_title,
      '/marketplace'
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Get listing details
    SELECT user_id, title INTO listing_owner_id, listing_title
    FROM public.marketplace_listings
    WHERE id = NEW.listing_id;
    
    -- Get requester name
    SELECT requester_name INTO requester_name
    FROM public.trade_requests
    WHERE id = NEW.id;
    
    IF OLD.status != NEW.status THEN
      IF NEW.status = 'accepted' THEN
        -- Notify requester that trade was accepted
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (
          NEW.requester_user_id,
          'trade_accepted',
          'Trade Request Accepted',
          'Your trade request for ' || listing_title || ' has been accepted!',
          '/marketplace'
        );
      ELSIF NEW.status = 'rejected' THEN
        -- Notify requester that trade was rejected
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (
          NEW.requester_user_id,
          'trade_rejected',
          'Trade Request Rejected',
          'Your trade request for ' || listing_title || ' was declined.',
          '/marketplace'
        );
      ELSIF NEW.status = 'completed' THEN
        -- Notify both parties that trade is completed
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (
          NEW.requester_user_id,
          'trade_completed',
          'Trade Completed',
          'Your trade for ' || listing_title || ' has been completed.',
          '/marketplace'
        );
        
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (
          listing_owner_id,
          'trade_completed',
          'Trade Completed',
          'Trade for ' || listing_title || ' has been completed.',
          '/marketplace'
        );
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger for trade_requests
DROP TRIGGER IF EXISTS notify_trade_request_trigger ON public.trade_requests;
CREATE TRIGGER notify_trade_request_trigger
  AFTER INSERT OR UPDATE ON public.trade_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_trade_request_event();

-- Function to create notification for purchase request events
CREATE OR REPLACE FUNCTION public.notify_purchase_request_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  listing_owner_id UUID;
  listing_title TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get listing details
    SELECT user_id, title INTO listing_owner_id, listing_title
    FROM public.marketplace_listings
    WHERE id = NEW.listing_id;
    
    -- Create notification for listing owner
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      listing_owner_id,
      'purchase_request',
      'New Purchase Request',
      NEW.buyer_name || ' wants to buy your listing: ' || listing_title,
      '/marketplace'
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Get listing details
    SELECT user_id, title INTO listing_owner_id, listing_title
    FROM public.marketplace_listings
    WHERE id = NEW.listing_id;
    
    IF OLD.status != NEW.status THEN
      IF NEW.status = 'accepted' THEN
        -- Notify buyer that purchase was approved
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (
          NEW.buyer_user_id,
          'purchase_approved',
          'Purchase Request Approved',
          'Your purchase request for ' || listing_title || ' has been approved!',
          '/marketplace'
        );
      ELSIF NEW.status = 'rejected' THEN
        -- Notify buyer that purchase was rejected
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (
          NEW.buyer_user_id,
          'purchase_rejected',
          'Purchase Request Rejected',
          'Your purchase request for ' || listing_title || ' was declined.',
          '/marketplace'
        );
      ELSIF NEW.status = 'completed' THEN
        -- Notify both parties that purchase is completed
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (
          NEW.buyer_user_id,
          'purchase_completed',
          'Purchase Completed',
          'Your purchase of ' || listing_title || ' has been completed.',
          '/marketplace'
        );
        
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (
          listing_owner_id,
          'purchase_completed',
          'Purchase Completed',
          'Sale of ' || listing_title || ' has been completed.',
          '/marketplace'
        );
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger for purchase_requests
DROP TRIGGER IF EXISTS notify_purchase_request_trigger ON public.purchase_requests;
CREATE TRIGGER notify_purchase_request_trigger
  AFTER INSERT OR UPDATE ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_purchase_request_event();

-- Function to create notification for new messages
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  other_participant_id UUID;
BEGIN
  -- Get the other participant in the conversation
  IF NEW.sender_id = (SELECT participant_1_id FROM public.conversations WHERE id = NEW.conversation_id) THEN
    SELECT participant_2_id INTO other_participant_id
    FROM public.conversations
    WHERE id = NEW.conversation_id;
  ELSE
    SELECT participant_1_id INTO other_participant_id
    FROM public.conversations
    WHERE id = NEW.conversation_id;
  END IF;
  
  -- Create notification for the other participant
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    other_participant_id,
    'new_message',
    'New Message',
    'You have received a new message.',
    '/marketplace'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for messages
DROP TRIGGER IF EXISTS notify_new_message_trigger ON public.messages;
CREATE TRIGGER notify_new_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();
