// src/services/video/tokenService.ts

/**
 * Servicio para generar tokens de Agora RTC
 *
 * NOTA IMPORTANTE:
 * Para usar Agora en producción, necesitas implementar un servidor backend
 * que genere tokens seguros usando el App Certificate de Agora.
 *
 * Por ahora, este servicio genera un token temporal vacío para desarrollo.
 * En producción, debes:
 * 1. Crear un Edge Function en Supabase o un endpoint en tu backend
 * 2. Usar el Agora Token Generator para crear tokens seguros
 * 3. Llamar a ese endpoint desde este servicio
 */

interface TokenResponse {
  token: string;
  channelName: string;
  uid: number;
}

class TokenService {
  /**
   * Genera un token de Agora para unirse a un canal
   *
   * @param classId - ID de la clase para la cual se genera el token
   * @param userId - ID del usuario que se unirá al canal
   * @returns Token de Agora, nombre del canal y UID
   */
  async generateToken(classId: string, userId: string): Promise<TokenResponse> {
    try {
      // DESARROLLO: Para pruebas iniciales sin seguridad
      // Puedes usar null como token si tu proyecto de Agora no tiene App Certificate configurado
      // ADVERTENCIA: No usar en producción

      const channelName = `class_${classId}`;
      const uid = this.generateUid(userId);

      // TODO: En producción, llamar a tu backend para generar el token
      // Ejemplo:
      // const { data, error } = await supabase.functions.invoke('generate-agora-token', {
      //   body: { channelName, uid }
      // });
      //
      // if (error) throw error;
      // return { token: data.token, channelName, uid };

      // Por ahora, retornamos un token vacío (solo funciona si NO tienes App Certificate)
      return {
        token: '', // Token vacío - solo para desarrollo sin App Certificate
        channelName,
        uid,
      };
    } catch (error) {
      console.error('Error generating Agora token:', error);
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
