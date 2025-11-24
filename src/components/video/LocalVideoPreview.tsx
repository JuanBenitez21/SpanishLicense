// src/components/video/LocalVideoPreview.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { RtcSurfaceView, RenderModeType } from 'react-native-agora';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';

const { width } = Dimensions.get('window');

interface LocalVideoPreviewProps {
  isVideoEnabled: boolean;
  userName?: string;
}

export default function LocalVideoPreview({
  isVideoEnabled,
  userName = 'Tú',
}: LocalVideoPreviewProps) {
  return (
    <View style={styles.container}>
      {isVideoEnabled ? (
        <RtcSurfaceView
          style={styles.videoView}
          canvas={{
            uid: 0,
            renderMode: RenderModeType.RenderModeHidden,
          }}
        />
      ) : (
        <View style={styles.videoDisabledView}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.videoDisabledText}>Cámara desactivada</Text>
        </View>
      )}

      {/* User Name Overlay */}
      <View style={styles.nameOverlay}>
        <Text style={styles.nameText}>{userName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 44,
    height: (width - 44) * 1.33, // 4:3 aspect ratio
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    position: 'relative',
    ...theme.shadows.large,
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
    gap: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDisabledText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
