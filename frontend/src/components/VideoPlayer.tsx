import React, { useRef, useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal: boolean;
  userId: string;
  isMuted: boolean;
  isVideoOff: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  isLocal,
  userId,
  isMuted,
  isVideoOff,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log('Setting video stream:', stream);
      console.log('Video tracks:', stream.getVideoTracks());
      console.log('Video tracks enabled:', stream.getVideoTracks().map(t => t.enabled));
      
      // Check if there are any enabled video tracks
      const hasEnabledVideoTracks = stream.getVideoTracks().some(track => track.enabled);
      
      if (hasEnabledVideoTracks) {
        videoRef.current.srcObject = stream;
        // Ensure video plays
        videoRef.current.play().catch(console.error);
      } else {
        // No enabled video tracks, clear the video
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  return (
    <Box
      className="video-container"
      sx={{
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        background: '#000',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {stream && !isVideoOff && stream.getVideoTracks().some(track => track.enabled) ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: '#000',
          }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <Typography variant="h4" sx={{ mb: 1 }}>
            {userId.charAt(0).toUpperCase()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isVideoOff ? 'Camera off' : 'No video'}
          </Typography>
        </Box>
      )}

      {/* Overlay with user info and status */}
      <Box
        className="video-overlay"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
          p: 2,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {isLocal ? 'You' : userId}
        </Typography>
        <Box display="flex" gap={1}>
          {isMuted && (
            <Chip
              label="Muted"
              size="small"
              color="error"
              sx={{ fontSize: '0.75rem' }}
            />
          )}
          {isVideoOff && (
            <Chip
              label="Video Off"
              size="small"
              color="warning"
              sx={{ fontSize: '0.75rem' }}
            />
          )}
        </Box>
      </Box>

      {/* Local user indicator */}
      {isLocal && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 1,
            px: 1,
            py: 0.5,
          }}
        >
          <Typography variant="caption" color="white">
            You
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default VideoPlayer;
