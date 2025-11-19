import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/services/auth/AuthContext';
import { StackScreenProps } from '@react-navigation/stack';
import { theme } from '@/theme/theme';

const { width } = Dimensions.get('window');

// 1. Definir la interfaz de la Lección
interface Lesson {
  id: string;
  title: string;
  duration_minutes: number;
  video_url: string;
  description: string;
}

// 2. Definir tipos para la navegación
type RootStackParamList = {
  VideoPlayer: { lesson: Lesson };
};

type Props = StackScreenProps<RootStackParamList, 'VideoPlayer'>;

export default function VideoPlayerScreen({ route, navigation }: Props) {
  const { lesson } = route.params;
  const { profile } = useAuth();
  
  // 3. Tipar correctamente la referencia del Video
  const videoRef = useRef<Video>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedProgressRef = useRef(0);
  
  const { updateProgress, completeLesson } = useProgress();
  
  // 4. El estado puede ser null al principio
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      console.log('🧹 VideoPlayerScreen desmontado');
    };
  }, []);

  // Actualizar progreso periódicamente
  useEffect(() => {
    // 5. Verificamos explícitamente que status existe y está cargado
    if (!status || !status.isLoaded || !profile || hasCompleted) return;

    // TypeScript ahora sabe que status es AVPlaybackStatusSuccess aquí
    const positionMillis = status.positionMillis || 0;
    const durationMillis = status.durationMillis || 1;
    const percentage = (positionMillis / durationMillis) * 100;

    // Log para debugging
    console.log('📹 Video status:', {
      position: Math.floor(positionMillis / 1000) + 's',
      duration: Math.floor(durationMillis / 1000) + 's',
      percentage: Math.round(percentage) + '%',
      isPlaying: status.isPlaying,
    });

    if (percentage >= 95) {
      //console.log('🎉 Video al 95%+, completando lección...');
      handleVideoComplete();
    } 
    else if (percentage > 5 && percentage < 95) {
      if (Math.abs(percentage - lastSavedProgressRef.current) >= 5) {
        //console.log('💾 Guardando progreso:', Math.round(percentage) + '%');
        lastSavedProgressRef.current = percentage;
        updateProgress(lesson.id, percentage);
      }
    }
  }, [status, profile, hasCompleted]);

  const handleVideoComplete = async () => {
    if (hasCompleted) return;
    
    try {
      console.log('✅ Marcando lección como completada...');
      setHasCompleted(true);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      await completeLesson(lesson.id);
      
      Alert.alert(
        '¡Lección Completada! 🎉',
        'Has terminado esta lección. ¡Sigue así!',
        [
          {
            text: 'Continuar',
            onPress: () => {
              console.log('📱 Navegando de vuelta a Learning...');
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error al completar lección:', error);
      Alert.alert('Error', 'No se pudo completar la lección. Intenta de nuevo.');
    }
  };

  const handlePlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
    setStatus(playbackStatus);
    
    if (playbackStatus.isLoaded) {
      setIsLoading(false);
    } else {
      // 6. Solo si !isLoaded existe la propiedad 'error'
      if (playbackStatus.error) {
        console.error('❌ Video error:', playbackStatus.error);
      }
    }
  };

  const togglePlayPause = async () => {
    // 7. Verificación estricta antes de llamar métodos
    if (!videoRef.current || !status || !status.isLoaded) return;

    try {
      if (status.isPlaying) {
        //console.log('⏸️ Pausando video');
        await videoRef.current.pauseAsync();
      } else {
        //console.log('▶️ Reproduciendo video');
        await videoRef.current.playAsync();
      }
    } catch (error) {
      console.error('❌ Error toggle play/pause:', error);
    }
  };

  const handleRewind = async () => {
    if (!videoRef.current || !status || !status.isLoaded) return;
    
    try {
      const newPosition = Math.max(0, (status.positionMillis || 0) - 10000);
      //console.log('⏪ Retrocediendo a:', Math.floor(newPosition / 1000) + 's');
      await videoRef.current.setPositionAsync(newPosition);
    } catch (error) {
      console.error('❌ Error rewind:', error);
    }
  };

  const handleForward = async () => {
    if (!videoRef.current || !status || !status.isLoaded) return;

    try {
      const newPosition = Math.min(
        status.durationMillis || 0,
        (status.positionMillis || 0) + 10000
      );
      //console.log('⏩ Adelantando a:', Math.floor(newPosition / 1000) + 's');
      await videoRef.current.setPositionAsync(newPosition);
    } catch (error) {
      console.error('❌ Error forward:', error);
    }
  };

  const handleSpeedChange = async () => {
    if (!videoRef.current || !status || !status.isLoaded) return;

    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];

    try {
      //console.log('⚡ Cambiando velocidad a:', newSpeed + 'x');
      await videoRef.current.setRateAsync(newSpeed, true);
      setPlaybackSpeed(newSpeed);
    } catch (error) {
      console.error('❌ Error cambiando velocidad:', error);
    }
  };

  const toggleFullscreen = async () => {
    if (!videoRef.current || !status || !status.isLoaded) return;

    try {
      //console.log('🖥️ Entrando a pantalla completa');
      await videoRef.current.presentFullscreenPlayer();
    } catch (error) {
      console.error('❌ Error pantalla completa:', error);
    }
  };

  // Auto-hide controls después de 3 segundos
  useEffect(() => {
    if (showControls && status?.isLoaded && 'isPlaying' in status && status.isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, status]);

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Helper para calcular progreso seguro para render
  const getVideoProgress = () => {
    if (status && status.isLoaded && status.durationMillis) {
      return (status.positionMillis || 0) / status.durationMillis;
    }
    return 0;
  };

  const videoProgress = getVideoProgress();

  const handleProgressBarPress = async (event: any) => {
    if (!videoRef.current || !status || !status.isLoaded || !status.durationMillis) return;

    const { locationX } = event.nativeEvent;
    const progressBarWidth = width - 32;
    const clickPercentage = locationX / progressBarWidth;
    const newPosition = clickPercentage * status.durationMillis;

    try {
      //console.log('🎯 Buscando en:', Math.floor(newPosition / 1000) + 's');
      await videoRef.current.setPositionAsync(newPosition);
    } catch (error) {
      console.error('❌ Error seeking:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[theme.colors.primary.main, theme.colors.primary.dark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {lesson.title}
            </Text>
            <Text style={styles.headerSubtitle}>
              {lesson.duration_minutes} minutos
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.videoContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Cargando video...</Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleControls}
          style={styles.videoTouchable}
        >
          <Video
            ref={videoRef}
            source={{ uri: lesson.video_url }}
            rate={playbackSpeed}
            volume={1.0}
            isMuted={false}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping={false}
            style={styles.video}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onError={(error) => {
              console.error('❌ Video load error:', error);
              Alert.alert('Error', 'No se pudo cargar el video. Verifica tu conexión.');
            }}
          />
        </TouchableOpacity>

        {/* Solo mostrar controles si status existe y está cargado */}
        {status && status.isLoaded && showControls && (
          <>
            {/* Controles superiores - Velocidad y Pantalla Completa */}
            <View style={styles.topControls}>
              <TouchableOpacity
                style={styles.speedButton}
                onPress={handleSpeedChange}
              >
                <Text style={styles.speedButtonText}>{playbackSpeed}x</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fullscreenButton}
                onPress={toggleFullscreen}
              >
                <Ionicons name="expand" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Controles inferiores - Progreso y Reproducción */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.progressBarContainer}
                onPress={handleProgressBarPress}
                activeOpacity={0.8}
              >
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${videoProgress * 100}%` }]}
                  />
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>
                    {formatTime(status.positionMillis || 0)}
                  </Text>
                  <Text style={styles.timeText}>
                    {formatTime(status.durationMillis || 0)}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleRewind}
                >
                  <Ionicons name="play-back" size={32} color="#FFFFFF" />
                  <Text style={styles.controlButtonText}>-10s</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playPauseButton}
                  onPress={togglePlayPause}
                >
                  <Ionicons
                    name={status.isPlaying ? 'pause' : 'play'}
                    size={48}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleForward}
                >
                  <Ionicons name="play-forward" size={32} color="#FFFFFF" />
                  <Text style={styles.controlButtonText}>+10s</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary.main} />
            <Text style={styles.infoTitle}>Descripción</Text>
          </View>
          <Text style={styles.infoDescription}>{lesson.description}</Text>
        </View>

        {videoProgress > 0 && videoProgress < 0.95 && !hasCompleted && (
          <View style={styles.progressIndicator}>
            <Ionicons name="time-outline" size={20} color={theme.colors.primary.main} />
            <Text style={styles.progressText}>
              Progreso: {Math.round(videoProgress * 100)}%
            </Text>
          </View>
        )}

        {hasCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            <Text style={styles.completedText}>¡Lección completada!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.h4,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  videoContainer: {
    width: width,
    height: width * (9 / 16),
    backgroundColor: '#000000',
    position: 'relative',
  },
  videoTouchable: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: '#FFFFFF',
    ...theme.typography.caption,
  },
  topControls: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    zIndex: 5,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: theme.spacing.md,
  },
  progressBarContainer: {
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  timeText: {
    color: '#FFFFFF',
    ...theme.typography.small,
  },
  speedButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.xl,
    minWidth: 50,
    alignItems: 'center',
  },
  speedButtonText: {
    color: '#FFFFFF',
    ...theme.typography.caption,
    fontWeight: '600',
  },
  fullscreenButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#FFFFFF',
    ...theme.typography.small,
    marginTop: theme.spacing.xs,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary.main + 'E6', // 90% opacity
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  infoCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  infoTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
  },
  infoDescription: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main + '20', // 12% opacity
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  progressText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '20', // 12% opacity
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  completedText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.success,
  },
});