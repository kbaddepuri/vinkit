import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Avatar,
  Divider,
} from '@mui/material';
import { Send, Close } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuthStore } from '../store/authStore';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
}

interface ChatPanelProps {
  roomId: string;
  onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ roomId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle WebSocket messages for chat
  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'chat_message') {
      const chatMessage: Message = {
        id: `${message.from_user}_${Date.now()}`,
        text: message.text,
        sender: message.from_user === user ? 'You' : message.from_user,
        timestamp: new Date(message.timestamp || Date.now()),
      };
      setMessages(prev => [...prev, chatMessage]);
    }
  };

  // Use WebSocket hook for chat functionality
  const { sendMessage } = useWebSocket(user || 'anonymous', roomId, handleWebSocketMessage);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Send message via WebSocket
      sendMessage({
        type: 'chat_message',
        room_id: roomId,
        text: newMessage.trim(),
        timestamp: new Date().toISOString(),
      });
      
      // Add to local messages immediately for better UX
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        sender: 'You',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(26, 26, 46, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6">Chat</Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1,
        }}
      >
        <List>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ListItem
                sx={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  py: 1,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                    {message.sender.charAt(0)}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    {message.sender}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>
                <ListItemText
                  primary={message.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.875rem',
                      wordBreak: 'break-word',
                    },
                  }}
                />
              </ListItem>
              {index < messages.length - 1 && <Divider sx={{ my: 0.5 }} />}
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Message Input */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
            multiline
            maxRows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.1)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            color="primary"
            sx={{
              alignSelf: 'flex-end',
            }}
          >
            <Send />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChatPanel;
