// src/screens/video/VideoCallScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IRtcEngineEventHandler } from 'react-native-agora';
import { agoraService } from '@/services/video/agoraService';
import ParticipantView from '@/components/video/ParticipantView';
import VideoControls from '@/components/video/VideoControls';

type VideoCallScreenProps = {
  navigation: any;
  route: {
    params: {
      classId: string;
      channelName: string;
      isTeacher: boolean;
      teacherName?: string;
      studentName?: string;
    };
  };
};

export default function VideoCallScreen({ navigation, route }: VideoCallScreenProps) {
  const { isTeacher, teacherName, studentName } = route.params;

  const [localUid, setLocalUid] = useState<number>(0);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isRemoteVideoMuted, setIsRemoteVideoMuted] = useState(false);
  const [isRemoteAudioMuted, setIsRemoteAudioMuted] = useState(false);

  const eventHandlerRef = useRef<IRtcEngineEventHandler | null>(null);

  useEffect(() => {
    setupEventHandlers();

    return () => {
      cleanup();
    };
  }, []);

  const setupEventHandlers = () => {
    const eventHandler: IRtcEngineEventHandler = {
      onJoinChannelSuccess: (connection, _elapsed) => {
        console.log('✅ Joined channel successfully:', connection.channelId);
        if (connection.localUid !== undefined) {
          setLocalUid(connection.localUid);
        }
      },

      onUserJoined: (_connection, uid, _elapsed) => {
        console.log('👤 Remote user joined:', uid);
        setRemoteUid(uid);
      },

      onUserOffline: (_connection, uid, _reason) => {
        console.log('👋 Remote user left:', uid);
        if (uid === remoteUid) {
          setRemoteUid(null);
          Alert.alert(
            'Usuario desconectado',
            `${isTeacher ? studentName : teacherName} ha salido de la llamada`,
            [
              {
                text: 'Salir',
                onPress: handleEndCall,
              },
            ]
          );
        }
      },

      onRemoteVideoStateChanged: (_connection, uid, state, _reason, _elapsed) => {
        console.log(`📹 Remote video state changed: ${uid}, state: ${state}`);
        if (uid === remoteUid) {
          // state 0 = stopped, 1 = starting, 2 = decoding
          setIsRemoteVideoMuted(state === 0);
        }
      },

      onRemoteAudioStateChanged: (_connection, uid, state, _reason, _elapsed) => {
        console.log(`🎤 Remote audio state changed: ${uid}, state: ${state}`);
        if (uid === remoteUid) {
          // state 0 = stopped, 2 = decoding
          setIsRemoteAudioMuted(state === 0);
        }
      },

      onError: (err, msg) => {
        console.error('❌ Agora error:', err, msg);
      },
    };

    eventHandlerRef.current = eventHandler;
    agoraService.registerEventHandler(eventHandler);
  };

  const cleanup = async () => {
    try {
      if (eventHandlerRef.current) {
        agoraService.unregisterEventHandler(eventHandlerRef.current);
      }

      await agoraService.leaveChannel();
    } catch (error) {
      console.error('Error en cleanup:', error);
    }
  };

  const handleToggleMic = async () => {
    try {
      const newState = !isMicMuted;
      await agoraService.toggleMicrophone(newState);
      setIsMicMuted(newState);
    } catch (error) {
      console.error('Error toggling mic:', error);
    }
  };

  const handleToggleVideo = async () => {
    try {
      const newState = !isVideoMuted;
      await agoraService.toggleCamera(newState);
      setIsVideoMuted(newState);
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  const handleSwitchCamera = async () => {
    try {
      await agoraService.switchCamera();
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };

  const handleEndCall = async () => {
    Alert.alert(
      'Finalizar llamada',
      '¿Estás seguro de que quieres salir de la videollamada?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await cleanup();
              navigation.goBack();
            } catch (error) {
              console.error('Error ending call:', error);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isTeacher ? studentName : teacherName}
        </Text>
        <Text style={styles.headerSubtitle}>
          {remoteUid ? 'Conectado' : 'Esperando...'}
        </Text>
      </View>

      {/* Video Views */}
      <View style={styles.videoContainer}>
        {/* Remote Video (Full Screen) */}
        {remoteUid ? (
          <ParticipantView
            uid={remoteUid}
            name={isTeacher ? studentName || 'Estudiante' : teacherName || 'Profesor'}
            isLocal={false}
            isAudioMuted={isRemoteAudioMuted}
            isVideoMuted={isRemoteVideoMuted}
            isFullScreen={true}
          />
        ) : (
          <View style={styles.waitingView}>
            <Text style={styles.waitingText}>
              Esperando a {isTeacher ? studentName : teacherName}...
            </Text>
          </View>
        )}

        {/* Local Video (Picture in Picture) */}
        {localUid > 0 && (
          <View style={styles.pipContainer}>
            <ParticipantView
              uid={localUid}
              name="Tú"
              isLocal={true}
              isAudioMuted={isMicMuted}
              isVideoMuted={isVideoMuted}
              isFullScreen={false}
            />
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <VideoControls
          isMicMuted={isMicMuted}
          isVideoMuted={isVideoMuted}
          onToggleMic={handleToggleMic}
          onToggleVideo={handleToggleVideo}
          onSwitchCamera={handleSwitchCamera}
          onEndCall={handleEndCall}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  waitingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  waitingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  pipContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
