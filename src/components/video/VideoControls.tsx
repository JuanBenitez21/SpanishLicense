// src/components/video/VideoControls.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';

interface VideoControlsProps {
  isMicMuted: boolean;
  isVideoMuted: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  onEndCall: () => void;
}

export default function VideoControls({
  isMicMuted,
  isVideoMuted,
  onToggleMic,
  onToggleVideo,
  onSwitchCamera,
  onEndCall,
}: VideoControlsProps) {
  return (
    <View style={styles.container}>
      {/* Microphone Control */}
      <TouchableOpacity
        style={[styles.controlButton, isMicMuted && styles.controlButtonMuted]}
        onPress={onToggleMic}
      >
        <Ionicons
          name={isMicMuted ? 'mic-off' : 'mic'}
          size={24}
          color={isMicMuted ? theme.colors.error : '#FFFFFF'}
        />
        <Text style={[styles.controlLabel, isMicMuted && styles.controlLabelMuted]}>
          {isMicMuted ? 'Activar' : 'Silenciar'}
        </Text>
      </TouchableOpacity>

      {/* Video Control */}
      <TouchableOpacity
        style={[styles.controlButton, isVideoMuted && styles.controlButtonMuted]}
        onPress={onToggleVideo}
      >
        <Ionicons
          name={isVideoMuted ? 'videocam-off' : 'videocam'}
          size={24}
          color={isVideoMuted ? theme.colors.error : '#FFFFFF'}
        />
        <Text style={[styles.controlLabel, isVideoMuted && styles.controlLabelMuted]}>
          {isVideoMuted ? 'Activar' : 'Pausar'}
        </Text>
      </TouchableOpacity>

      {/* Switch Camera */}
      <TouchableOpacity style={styles.controlButton} onPress={onSwitchCamera}>
        <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
        <Text style={styles.controlLabel}>Girar</Text>
      </TouchableOpacity>

      {/* End Call */}
      <TouchableOpacity style={styles.endCallButton} onPress={onEndCall}>
        <Ionicons name="call" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: 4,
  },
  controlButtonMuted: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  controlLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 4,
  },
  controlLabelMuted: {
    color: theme.colors.error,
  },
  endCallButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.error,
    transform: [{ rotate: '135deg' }],
  },
});
