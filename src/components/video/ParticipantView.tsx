// src/components/video/ParticipantView.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { RtcSurfaceView, RenderModeType } from 'react-native-agora';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';

const { width, height } = Dimensions.get('window');

interface ParticipantViewProps {
  uid: number;
  name: string;
  isLocal?: boolean;
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
  isFullScreen?: boolean;
}

export default function ParticipantView({
  uid,
  name,
  isLocal = false,
  isAudioMuted = false,
  isVideoMuted = false,
  isFullScreen = false,
}: ParticipantViewProps) {
  const containerStyle = isFullScreen ? styles.fullScreenContainer : styles.thumbnailContainer;

  return (
    <View style={containerStyle}>
      {/* Video View */}
      {!isVideoMuted ? (
        <RtcSurfaceView
          style={styles.videoView}
          canvas={{
            uid: isLocal ? 0 : uid,
            renderMode: RenderModeType.RenderModeHidden,
          }}
        />
      ) : (
        <View style={styles.videoDisabledView}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={isFullScreen ? 64 : 32} color="#FFFFFF" />
          </View>
        </View>
      )}

      {/* Participant Info Overlay */}
      <View style={styles.infoOverlay}>
        <View style={styles.nameContainer}>
          <Text style={styles.nameText} numberOfLines={1}>
            {name}
            {isLocal && ' (T�)'}
          </Text>
        </View>

        {/* Audio Muted Indicator */}
        {isAudioMuted && (
          <View style={styles.mutedIndicator}>
            <Ionicons name="mic-off" size={16} color="#FFFFFF" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    width: width,
    height: height,
    backgroundColor: '#000000',
    position: 'relative',
  },
  thumbnailContainer: {
    width: 120,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  videoDisabledView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mutedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
