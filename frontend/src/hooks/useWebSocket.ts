import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: any) => void;
}

export const useWebSocket = (
  userId: string,
  roomId: string,
  onMessage?: (message: any) => void
): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
      const ws = new WebSocket(`${wsUrl}/ws/${userId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Join the room
        sendMessage({
          type: 'join_room',
          room_id: roomId,
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          // Handle different message types
          switch (message.type) {
            case 'user_joined':
              console.log('User joined:', message.user_id);
              break;
            case 'user_left':
              console.log('User left:', message.user_id);
              break;
            case 'participants':
              console.log('Current participants:', message.participants);
              break;
            case 'webrtc_offer':
            case 'webrtc_answer':
            case 'ice_candidate':
              // Forward WebRTC signaling messages
              if (onMessage) {
                onMessage(message);
              }
              break;
            default:
              console.log('Unknown message type:', message.type);
              if (onMessage) {
                onMessage(message);
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket connection closed');
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
            connect();
          }, delay);
        } else {
          toast.error('Failed to reconnect to chat server');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('Connection error');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      toast.error('Failed to connect to chat server');
    }
  }, [userId, roomId, onMessage]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        toast.error('Failed to send message');
      }
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    sendMessage,
  };
};
