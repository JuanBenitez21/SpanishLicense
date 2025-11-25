// src/services/video/tokenService.ts
import { RtcTokenBuilder, RtcRole } from 'agora-token';

/**
 * Servicio para generar tokens de Agora RTC
 *
 * DESARROLLO: Este servicio genera tokens localmente usando el App Certificate.
 * PRODUCCIÓN: Debes mover la generación de tokens a un backend seguro (Supabase Edge Function, etc.)
 */

interface TokenResponse {
  token: string;
  channelName: string;
  uid: number;
}

class TokenService {
  private appId: string;
  private appCertificate: string;

  constructor() {
    this.appId = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';
    this.appCertificate = process.env.AGORA_APP_CERTIFICATE || '';

    if (!this.appId) {
      console.error('❌ EXPO_PUBLIC_AGORA_APP_ID no está configurado');
    }
  }

  /**
   * Genera un token de Agora para unirse a un canal
   *
   * @param classId - ID de la clase para la cual se genera el token
   * @param userId - ID del usuario que se unirá al canal
   * @returns Token de Agora, nombre del canal y UID
   */
  async generateToken(classId: string, userId: string): Promise<TokenResponse> {
    try {
      const channelName = `class_${classId}`;
      const uid = this.generateUid(userId);

      let token: string;

      // Si hay App Certificate, generar token real
      if (this.appCertificate && this.appCertificate.trim() !== '') {
        const role = RtcRole.PUBLISHER; // Todos los usuarios pueden publicar (hablar y mostrar video)
        const expirationTimeInSeconds = 3600; // 1 hora
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        token = RtcTokenBuilder.buildTokenWithUid(
          this.appId,
          this.appCertificate,
          channelName,
          uid,
          role,
          privilegeExpiredTs,
          privilegeExpiredTs
        );

        console.log('✅ Token de Agora generado con App Certificate');
      } else {
        // Sin App Certificate, usar token vacío
        token = '';
        console.log('⚠️ Usando token vacío (sin App Certificate)');
        console.log('⚠️ Si ves error 110, ve a https://console.agora.io y:');
        console.log('   1. Abre tu proyecto');
        console.log('   2. Ve a "Config" > "Features"');
        console.log('   3. DESACTIVA "Enable Primary Certificate" temporalmente');
        console.log('   O agrega tu App Certificate a .env como AGORA_APP_CERTIFICATE');
      }

      return {
        token,
        channelName,
        uid,
      };
    } catch (error) {
      console.error('❌ Error generating Agora token:', error);
      throw new Error('No se pudo generar el token de videollamada');
    }
  }

  /**
   * Genera un UID numérico único basado en el userId
   */
  private generateUid(userId: string): number {
    // Convertir el UUID a un número único
    // Tomamos los primeros 8 caracteres del UUID y los convertimos a número
    const hex = userId.replace(/-/g, '').substring(0, 8);
    return parseInt(hex, 16) % 2147483647; // Max int32
  }

  /**
   * Valida si un token sigue siendo válido
   * Los tokens de Agora tienen un tiempo de expiración
   */
  async validateToken(_token: string): Promise<boolean> {
    // TODO: Implementar validación de token
    // Por ahora, retornamos true
    return true;
  }
}

export const tokenService = new TokenService();
