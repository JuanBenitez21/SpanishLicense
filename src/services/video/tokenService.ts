// src/services/video/tokenService.ts

/**
 * Servicio para generar tokens de Agora RTC
 *
 * IMPORTANTE: Para que esto funcione, debes DESACTIVAR el App Certificate en Agora Console
 *
 * Pasos:
 * 1. Ve a https://console.agora.io
 * 2. Selecciona tu proyecto
 * 3. Ve a Config > Features
 * 4. DESACTIVA "Enable Primary Certificate"
 *
 * NOTA: Para producción, necesitarás un backend que genere tokens seguros
 */

interface TokenResponse {
  token: string;
  channelName: string;
  uid: number;
}

class TokenService {
  /**
   * Genera información para unirse a un canal de Agora
   *
   * @param classId - ID de la clase para la cual se genera el token
   * @param userId - ID del usuario que se unirá al canal
   * @returns Token (vacío), nombre del canal y UID
   */
  async generateToken(classId: string, userId: string): Promise<TokenResponse> {
    try {
      const channelName = `class_${classId}`;
      const uid = this.generateUid(userId);

      console.log('📡 Generando configuración para videollamada');
      console.log('   Canal:', channelName);
      console.log('   UID:', uid);
      console.log('⚠️  Usando token vacío - Asegúrate de desactivar App Certificate en Agora Console');

      return {
        token: '', // Token vacío - requiere que App Certificate esté desactivado
        channelName,
        uid,
      };
    } catch (error) {
      console.error('❌ Error generating token config:', error);
      throw new Error('No se pudo generar la configuración de videollamada');
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
