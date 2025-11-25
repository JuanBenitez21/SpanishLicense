// src/services/video/agoraService.ts
import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  VideoEncoderConfiguration,
  IRtcEngineEventHandler,
} from 'react-native-agora';
import { VideoCallConfig } from '@/types/video.types';

class AgoraService {
  private engine: IRtcEngine | null = null;
  private appId: string;
  private isInitialized: boolean = false;

  constructor() {
    this.appId = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';

    if (!this.appId) {
      console.warn('Agora APP ID not found. Video calls will not work.');
    }
  }

  /**
   * Inicializa el motor de Agora
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || !this.appId) {
      return;
    }

    try {
      this.engine = createAgoraRtcEngine();

      // Inicializar con appId
      this.engine.initialize({
        appId: this.appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      // Habilitar video y audio
      this.engine.enableVideo();
      this.engine.enableAudio();

      // Configurar valores por defecto
      this.engine.setDefaultAudioRouteToSpeakerphone(true);

      // Asegurarse de que el audio y video local están habilitados
      this.engine.enableLocalAudio(true);
      this.engine.enableLocalVideo(true);

      this.isInitialized = true;
      console.log('✅ Agora Engine initialized successfully');
      console.log('✅ Audio y Video habilitados por defecto');
    } catch (error) {
      console.error('❌ Error initializing Agora Engine:', error);
      throw error;
    }
  }

  /**
   * Configura la calidad del video
   */
  async setVideoQuality(quality: 'low' | 'medium' | 'high'): Promise<void> {
    if (!this.engine) return;

    const configs: Record<string, VideoEncoderConfiguration> = {
      low: {
        dimensions: { width: 320, height: 240 },
        frameRate: 15,
        bitrate: 200,
      },
      medium: {
        dimensions: { width: 640, height: 480 },
        frameRate: 30,
        bitrate: 500,
      },
      high: {
        dimensions: { width: 1280, height: 720 },
        frameRate: 30,
        bitrate: 1000,
      },
    };

    this.engine.setVideoEncoderConfiguration(configs[quality]);
  }

  /**
   * Une a un canal de video
   */
  async joinChannel(config: VideoCallConfig): Promise<void> {
    if (!this.engine) {
      throw new Error('Agora Engine not initialized');
    }

    try {
      // Configurar rol del usuario (todos como broadcaster para videollamada bidireccional)
      this.engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      // Habilitar audio y video antes de unirse
      this.engine.enableAudio();
      this.engine.enableVideo();
      this.engine.enableLocalAudio(true);
      this.engine.enableLocalVideo(true);

      // Unirse al canal
      await this.engine.joinChannel(config.token, config.channelName, config.uid, {
        publishMicrophoneTrack: true,
        publishCameraTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });

      console.log(`✅ Joined channel: ${config.channelName}`);
      console.log(`   📹 Video habilitado, 🎤 Audio habilitado`);
    } catch (error) {
      console.error('❌ Error joining channel:', error);
      throw error;
    }
  }

  /**
   * Sale del canal
   */
  async leaveChannel(): Promise<void> {
    if (!this.engine) return;

    try {
      this.engine.leaveChannel();
      console.log('✅ Left channel successfully');
    } catch (error) {
      console.error('❌ Error leaving channel:', error);
      throw error;
    }
  }

  /**
   * Activa/desactiva el micrófono
   */
  async toggleMicrophone(muted: boolean): Promise<void> {
    if (!this.engine) return;

    try {
      this.engine.muteLocalAudioStream(muted);
      console.log(`🎤 Microphone ${muted ? 'muted' : 'unmuted'}`);
    } catch (error) {
      console.error('❌ Error toggling microphone:', error);
      throw error;
    }
  }

  /**
   * Activa/desactiva la cámara
   */
  async toggleCamera(disabled: boolean): Promise<void> {
    if (!this.engine) return;

    try {
      this.engine.muteLocalVideoStream(disabled);
      console.log(`📹 Camera ${disabled ? 'disabled' : 'enabled'}`);
    } catch (error) {
      console.error('❌ Error toggling camera:', error);
      throw error;
    }
  }

  /**
   * Cambia entre cámara frontal y trasera
   */
  async switchCamera(): Promise<void> {
    if (!this.engine) return;

    try {
      this.engine.switchCamera();
      console.log('📸 Camera switched');
    } catch (error) {
      console.error('❌ Error switching camera:', error);
      throw error;
    }
  }

  /**
   * Habilita el modo de altavoz
   */
  async enableSpeakerphone(enabled: boolean): Promise<void> {
    if (!this.engine) return;

    try {
      this.engine.setEnableSpeakerphone(enabled);
      console.log(`🔊 Speakerphone ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error toggling speakerphone:', error);
      throw error;
    }
  }

  /**
   * Inicia preview de video local
   */
  async startPreview(): Promise<void> {
    if (!this.engine) return;

    try {
      this.engine.startPreview();
      console.log('✅ Video preview started');
    } catch (error) {
      console.error('❌ Error starting preview:', error);
      throw error;
    }
  }

  /**
   * Detiene preview de video local
   */
  async stopPreview(): Promise<void> {
    if (!this.engine) return;

    try {
      this.engine.stopPreview();
      console.log('✅ Video preview stopped');
    } catch (error) {
      console.error('❌ Error stopping preview:', error);
      throw error;
    }
  }

  /**
   * Registra event handlers
   */
  registerEventHandler(eventHandler: IRtcEngineEventHandler): void {
    if (!this.engine) return;

    this.engine.registerEventHandler(eventHandler);
  }

  /**
   * Remueve todos los event handlers
   */
  unregisterEventHandler(eventHandler: IRtcEngineEventHandler): void {
    if (!this.engine) return;

    this.engine.unregisterEventHandler(eventHandler);
  }

  /**
   * Libera recursos del motor
   */
  async release(): Promise<void> {
    if (!this.engine) return;

    try {
      this.engine.release();
      this.engine = null;
      this.isInitialized = false;
      console.log('✅ Agora Engine released');
    } catch (error) {
      console.error('❌ Error releasing Agora Engine:', error);
      throw error;
    }
  }

  /**
   * Obtiene la instancia del engine
   */
  getEngine(): IRtcEngine | null {
    return this.engine;
  }

  /**
   * Verifica si está inicializado
   */
  isEngineInitialized(): boolean {
    return this.isInitialized;
  }
}

export const agoraService = new AgoraService();
