import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  VideoCall,
  Add,
  ExitToApp,
  Security,
  Speed,
  Group,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { createRoom } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const response = await createRoom();
      navigate(`/chat/${response.room_id}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create room';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      navigate(`/chat/${roomId.trim()}`);
    } else {
      toast.error('Please enter a room ID');
    }
  };


  const features = [
    {
      icon: <Security />,
      title: 'End-to-End Encryption',
      description: 'Your conversations are secured with military-grade encryption',
    },
    {
      icon: <Speed />,
      title: 'Low Latency',
      description: 'Optimized for real-time communication with minimal delay',
    },
    {
      icon: <Group />,
      title: 'Multi-User Support',
      description: 'Connect with multiple participants simultaneously',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{
              background: 'linear-gradient(45deg, #6366f1, #ec4899)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>
              Welcome to Vinkit
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Secure, distributed video chat platform
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body1">Hello, {user}</Typography>
            <Tooltip title="Logout">
              <IconButton onClick={logout} color="inherit">
                <ExitToApp />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Main Actions */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              height: '100%'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <VideoCall sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Create New Room</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Start a new secure video chat room and invite others to join.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={handleCreateRoom}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(45deg, #6366f1, #ec4899)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #4f46e5, #db2777)',
                    }
                  }}
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              height: '100%'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Group sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Join Existing Room</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Enter a room ID to join an existing video chat session.
                </Typography>
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.1)',
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleJoinRoom}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    Join
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Features */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Why Choose Vinkit?
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card sx={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  }
                }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Container>
  );
};

export default Dashboard;
