# 🎥 Solución: Cámara y Micrófono no Funcionan

## Problema

Los usuarios se conectan a la videollamada pero:
- ❌ No se ve la cámara (ni la propia ni la del otro usuario)
- ❌ No se escucha el audio
- ❌ Ambos ven solo pantallas negras o avatares

## ✅ Cambios Realizados

He actualizado el código para solucionar estos problemas:

### 1. Habilitación de Audio/Video en la Inicialización

**Archivo:** `src/services/video/agoraService.ts`

Se agregaron las siguientes líneas en la función `initialize()`:

```typescript
// Configurar valores por defecto
this.engine.setDefaultAudioRouteToSpeakerphone(true);

// Asegurarse de que el audio y video local están habilitados
this.engine.enableLocalAudio(true);
this.engine.enableLocalVideo(true);
```

### 2. Habilitación Explícita al Unirse al Canal

En la función `joinChannel()`:

```typescript
// Habilitar audio y video antes de unirse
this.engine.enableAudio();
this.engine.enableVideo();
this.engine.enableLocalAudio(true);
this.engine.enableLocalVideo(true);

// Unirse al canal con configuración explícita
await this.engine.joinChannel(config.token, config.channelName, config.uid, {
  publishMicrophoneTrack: true,    // ✅ Publicar audio
  publishCameraTrack: true,         // ✅ Publicar video
  autoSubscribeAudio: true,         // ✅ Recibir audio automáticamente
  autoSubscribeVideo: true,         // ✅ Recibir video automáticamente
});
```

### 3. Especificación Correcta del Tipo de Fuente

**Archivo:** `src/components/video/ParticipantView.tsx`

```typescript
<RtcSurfaceView
  canvas={{
    uid: isLocal ? 0 : uid,           // 0 para local, uid real para remoto
    renderMode: RenderModeType.RenderModeHidden,
    sourceType: isLocal ? 0 : 1,      // 0 = cámara local, 1 = usuario remoto
  }}
/>
```

---

## 🔄 Cómo Probar los Cambios

### Opción 1: Recarga en Caliente (Si funciona)

1. Guarda todos los archivos
2. El servidor Expo debería recargar automáticamente
3. Cierra completamente la app en ambos dispositivos
4. Vuelve a abrirla y prueba la videollamada

### Opción 2: Reconstruir la App (Recomendado)

Si la recarga en caliente no funciona o sigues viendo problemas:

```bash
# 1. Detén el servidor actual (Ctrl+C)

# 2. Reconstruye la app (esto puede tomar 10-15 minutos)
eas build --profile development --platform android --local

# 3. Instala el nuevo APK en ambos dispositivos

# 4. Inicia el servidor nuevamente
npx expo start
```

---

## ✅ Qué Deberías Ver Ahora

### En los Logs de Consola:

```
LOG  ✅ Agora Engine initialized successfully
LOG  ✅ Audio y Video habilitados por defecto
LOG  📡 Generando configuración para videollamada
LOG     Canal: class_XXXXX
LOG     UID: 12345678
LOG  ✅ Joined channel: class_XXXXX
LOG     📹 Video habilitado, 🎤 Audio habilitado
LOG  👤 Remote user joined: 98765432
```

### En la App:

1. **En la Sala de Espera:**
   - ✅ Deberías ver tu propia cámara en el preview
   - ✅ Puedes activar/desactivar micrófono y cámara

2. **En la Videollamada:**
   - ✅ Tu video aparece en miniatura (esquina)
   - ✅ El video del otro usuario aparece en pantalla completa
   - ✅ Puedes escuchar al otro usuario
   - ✅ El otro usuario puede verte y escucharte

---

## 🔍 Si Aún No Funciona

### Verificar Permisos de Android

1. Ve a **Configuración** en tu dispositivo Android
2. **Aplicaciones** > **SpanishLicense**
3. **Permisos**
4. Asegúrate de que estos permisos estén **PERMITIDOS**:
   - ✅ Cámara
   - ✅ Micrófono

### Verificar que App Certificate está Desactivado

Si ves error 110, verifica que desactivaste el App Certificate:
- Ve a https://console.agora.io
- Tu proyecto debe tener **"Enable Primary Certificate" = OFF**

### Logs Importantes a Revisar

Si algo no funciona, busca estos mensajes en la consola:

**❌ Errores Críticos:**
```
ERROR  ❌ Agora error: 110         → App Certificate no desactivado
ERROR  ❌ Error initializing        → Problema de inicialización
ERROR  Permission denied            → Permisos no otorgados
```

**✅ Mensajes Correctos:**
```
LOG  ✅ Agora Engine initialized successfully
LOG  ✅ Audio y Video habilitados por defecto
LOG  ✅ Joined channel: class_XXXXX
LOG     📹 Video habilitado, 🎤 Audio habilitado
LOG  👤 Remote user joined: [número]
```

---

## 🏗️ ¿Necesitas Reconstruir?

Si los cambios NO se aplican con recarga en caliente, necesitas reconstruir:

```bash
# Reconstruir localmente (más rápido)
eas build --profile development --platform android --local

# O reconstruir en la nube de EAS
eas build --profile development --platform android
```

Después de reconstruir, instala el nuevo APK en ambos dispositivos.

---

## 📞 Estado Actual

Después de estos cambios:
- ✅ Audio y video se habilitan automáticamente al inicializar
- ✅ Se publican ambos tracks (audio y video) al unirse al canal
- ✅ Se suscriben automáticamente a audio y video remotos
- ✅ El componente de video especifica correctamente la fuente (local vs remoto)

**Todo debería funcionar correctamente ahora.** Si sigues teniendo problemas, revisa los permisos de Android y asegúrate de reconstruir la app.
