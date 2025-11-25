# Configuración de Agora - Solución al Error 110

## Error Actual
```
ERROR  ❌ Agora error: 110
```

Este error significa que tu proyecto de Agora tiene el **App Certificate habilitado**, pero estás enviando un token vacío.

## ✅ SOLUCIÓN: Desactivar App Certificate (Requerido para Desarrollo)

### Instrucciones Paso a Paso:

1. Abre tu navegador y ve a: **https://console.agora.io**

2. Inicia sesión con tu cuenta de Agora

3. En el dashboard principal, busca y selecciona tu proyecto:
   - App ID: `c71527c9412548b4979c46023d336d88`

4. Una vez dentro del proyecto, ve a la pestaña **"Config"** (arriba)

5. Busca la sección **"Features"**

6. Encuentra **"Primary Certificate"** o **"App Certificate"**

7. **DESACTIVA el toggle** que dice "Enable Primary Certificate" o "Enable App Certificate"
   - El toggle debe quedar en color gris (OFF)

8. Guarda los cambios si te lo pide

9. Cierra la app en tu dispositivo Android

10. Vuelve a abrir la app y prueba la videollamada

**¿Por qué esto?**

React Native no puede generar tokens seguros porque requiere el módulo `crypto` de Node.js, que no está disponible en dispositivos móviles. La única forma de usar tokens seguros es con un backend (servidor).

Para desarrollo, es más sencillo desactivar el App Certificate temporalmente.

---

## ¿Y para Producción?

Para producción, necesitarás:

1. Crear un backend (Supabase Edge Function, AWS Lambda, etc.)
2. El backend generará tokens usando el App Certificate
3. La app móvil llamará a ese backend para obtener tokens válidos
4. Volver a activar el App Certificate en Agora Console

Pero por ahora, para desarrollo, **desactiva el App Certificate**

---

## ¿Qué hace el código ahora?

El archivo `src/services/video/tokenService.ts` usa un **token vacío** (string vacío) para conectarse a Agora.

Esto solo funciona si **desactivaste el App Certificate** en Agora Console.

En la consola verás:
```
LOG  📡 Generando configuración para videollamada
LOG     Canal: class_XXXXX
LOG     UID: 12345678
LOG  ⚠️  Usando token vacío - Asegúrate de desactivar App Certificate en Agora Console
```

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
