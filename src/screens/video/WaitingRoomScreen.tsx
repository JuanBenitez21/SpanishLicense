// src/screens/video/WaitingRoomScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { agoraService } from '@/services/video/agoraService';
import LocalVideoPreview from '@/components/video/LocalVideoPreview';

type WaitingRoomScreenProps = {
  navigation: any;
  route: {
    params: {
      classId: string;
      channelName: string;
      token: string;
      isTeacher: boolean;
      teacherName?: string;
      studentName?: string;
    };
  };
};

export default function WaitingRoomScreen({ navigation, route }: WaitingRoomScreenProps) {
  const { classId, channelName, token, isTeacher, teacherName, studentName } = route.params;

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    initializeAgora();

    return () => {
      cleanup();
    };
  }, []);

  const initializeAgora = async () => {
    try {
      setIsInitializing(true);

      // Inicializar el motor de Agora
      await agoraService.initialize();

      // Iniciar preview de video local
      await agoraService.startPreview();

      // Habilitar altavoz por defecto
      await agoraService.enableSpeakerphone(true);

      setIsInitializing(false);
    } catch (error) {
      console.error('Error inicializando Agora:', error);
      Alert.alert(
        'Error',
        'No se pudo inicializar la videollamada',
        [
          {
            text: 'Volver',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const cleanup = async () => {
    try {
      await agoraService.stopPreview();
    } catch (error) {
      console.error('Error en cleanup:', error);
    }
  };

  const handleToggleVideo = async () => {
    try {
      const newState = !isVideoEnabled;
      await agoraService.toggleCamera(!newState);
      setIsVideoEnabled(newState);
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  const handleToggleMic = async () => {
    try {
      const newState = !isMicEnabled;
      await agoraService.toggleMicrophone(!newState);
      setIsMicEnabled(newState);
    } catch (error) {
      console.error('Error toggling mic:', error);
    }
  };

  const handleJoinCall = async () => {
    if (isJoining) return;

    try {
      setIsJoining(true);

      // Unirse al canal
      await agoraService.joinChannel({
        channelName,
        token,
        uid: 0, // 0 = auto-asignar
        classId,
        isTeacher,
        teacherName,
        studentName,
      });

      // Navegar a la pantalla de videollamada
      navigation.replace('VideoCall', {
        classId,
        channelName,
        isTeacher,
        teacherName,
        studentName,
      });
    } catch (error) {
      console.error('Error joining call:', error);
      Alert.alert('Error', 'No se pudo unir a la videollamada');
      setIsJoining(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Preparando videollamada...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Ionicons name="close" size={28} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sala de espera</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Video Preview */}
        <View style={styles.previewContainer}>
          <LocalVideoPreview
            isVideoEnabled={isVideoEnabled}
            userName={isTeacher ? teacherName : studentName}
          />
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>
            {isTeacher ? `Clase con ${studentName}` : `Clase con ${teacherName}`}
          </Text>
          <Text style={styles.infoSubtitle}>
            Asegúrate de que tu cámara y micrófono funcionen correctamente
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              !isMicEnabled && styles.controlButtonDisabled,
            ]}
            onPress={handleToggleMic}
          >
            <Ionicons
              name={isMicEnabled ? 'mic' : 'mic-off'}
              size={28}
              color={isMicEnabled ? theme.colors.primary.main : theme.colors.error}
            />
            <Text style={styles.controlLabel}>
              {isMicEnabled ? 'Micrófono' : 'Silenciado'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              !isVideoEnabled && styles.controlButtonDisabled,
            ]}
            onPress={handleToggleVideo}
          >
            <Ionicons
              name={isVideoEnabled ? 'videocam' : 'videocam-off'}
              size={28}
              color={isVideoEnabled ? theme.colors.primary.main : theme.colors.error}
            />
            <Text style={styles.controlLabel}>
              {isVideoEnabled ? 'Cámara' : 'Desactivada'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Join Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
          onPress={handleJoinCall}
          disabled={isJoining}
        >
          {isJoining ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="videocam" size={24} color="#FFFFFF" />
              <Text style={styles.joinButtonText}>Unirse a la llamada</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 22,
  },
  previewContainer: {
    alignItems: 'center',
  },
  infoContainer: {
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  infoSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: 32,
  },
  controlButton: {
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.background.paper,
    minWidth: 120,
    ...theme.shadows.small,
  },
  controlButtonDisabled: {
    backgroundColor: theme.colors.background.paper,
    opacity: 0.7,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  footer: {
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 16,
    borderRadius: 16,
    ...theme.shadows.medium,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
