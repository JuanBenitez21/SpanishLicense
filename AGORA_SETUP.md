# Configuración de Agora - Solución al Error 110

## Error Actual
```
ERROR  ❌ Agora error: 110
```

Este error significa que tu proyecto de Agora tiene el **App Certificate habilitado**, pero estás enviando un token vacío o inválido.

## Solución 1: Desactivar App Certificate (Más Rápida - Solo para Pruebas)

1. Ve a la consola de Agora: https://console.agora.io
2. Inicia sesión con tu cuenta
3. En el dashboard, selecciona tu proyecto (el que tiene App ID: `c71527c9412548b4979c46023d336d88`)
4. Ve a la pestaña **"Config"**
5. En la sección **"Features"**, busca **"Primary Certificate"**
6. **DESACTIVA** el toggle de "Enable Primary Certificate"
7. Guarda los cambios
8. Reinicia tu app en React Native

**Ventajas:**
- Solución inmediata
- No necesitas modificar código
- Perfecto para pruebas de desarrollo

**Desventajas:**
- Menos seguro (no usar en producción)
- Cualquiera con tu App ID puede conectarse

---

## Solución 2: Usar App Certificate (Recomendado para Producción)

Si quieres mantener el App Certificate habilitado (más seguro):

### Paso 1: Obtener el App Certificate

1. Ve a https://console.agora.io
2. Selecciona tu proyecto
3. En la pestaña **"Config"**
4. Copia el **"Primary Certificate"** (es una cadena larga de caracteres)

### Paso 2: Agregar el Certificate al .env

Abre el archivo `.env` y agrega tu App Certificate:

```env
AGORA_APP_CERTIFICATE=TU_APP_CERTIFICATE_AQUI
```

Ejemplo:
```env
AGORA_APP_CERTIFICATE=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Paso 3: Reiniciar el servidor

```bash
# Detener el servidor actual (Ctrl+C)
# Luego reiniciar
npx expo start
```

El código ya está configurado para:
- ✅ Detectar automáticamente si tienes App Certificate
- ✅ Generar tokens válidos con expiración de 1 hora
- ✅ Funcionar sin App Certificate (token vacío) si no está configurado

---

## ¿Qué hace el código ahora?

El archivo `src/services/video/tokenService.ts` ahora:

1. **Si tienes App Certificate configurado:**
   - Genera un token RTC válido usando `agora-token`
   - El token expira en 1 hora
   - Todos los usuarios tienen rol de PUBLISHER (pueden hablar y mostrar video)
   - Verás en consola: `✅ Token de Agora generado con App Certificate`

2. **Si NO tienes App Certificate:**
   - Usa token vacío (string vacío)
   - Solo funciona si desactivaste el App Certificate en Agora
   - Verás en consola: `⚠️ Usando token vacío (sin App Certificate)`

---

## Verificar que funciona

Después de aplicar una de las soluciones, al iniciar una videollamada deberías ver:

```
LOG  ✅ Agora Engine initialized successfully
LOG  ✅ Video preview started
LOG  🔊 Speakerphone enabled
LOG  ✅ Joined channel: class_XXXXX
LOG  👤 User 12345 joined channel (si alguien más se une)
```

**NO deberías ver:**
```
ERROR  ❌ Agora error: 110
```

---

## Recomendación

Para **desarrollo/pruebas**: Usa Solución 1 (desactivar App Certificate)
Para **producción**: Usa Solución 2 (con App Certificate) y mueve la generación de tokens a un backend seguro

---

## Problema con la cámara

Si después de resolver el error 110 aún no ves la cámara:

1. Verifica permisos de Android en `app.json`:
   ```json
   "permissions": [
     "CAMERA",
     "RECORD_AUDIO",
     "MODIFY_AUDIO_SETTINGS"
   ]
   ```

2. Asegúrate de haber construido un Development Build (no Expo Go):
   ```bash
   eas build --profile development --platform android
   ```

3. Verifica que el dispositivo haya otorgado permisos a la app

---

## Soporte

Si sigues teniendo problemas, revisa los logs en consola. El código ahora proporciona mensajes claros sobre qué está pasando con la generación de tokens.
