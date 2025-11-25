# ⚠️ SOLUCIÓN RÁPIDA: Error 110 de Agora

## El Problema

Cuando intentas iniciar una videollamada, obtienes:
```
ERROR  ❌ Agora error: 110
```

## ¿Por qué ocurre?

Tu proyecto de Agora tiene el **App Certificate activado**, que requiere tokens seguros. React Native no puede generar estos tokens porque necesita el módulo `crypto` de Node.js (solo disponible en servidores).

## ✅ Solución en 3 Pasos

### 1️⃣ Abre Agora Console
Ve a: https://console.agora.io

### 2️⃣ Desactiva el App Certificate
1. Selecciona tu proyecto (App ID: `c71527c9412548b4979c46023d336d88`)
2. Haz clic en **"Config"** (arriba)
3. Busca **"Features"**
4. Encuentra **"Primary Certificate"**
5. **DESACTIVA el toggle** (debe quedar gris/OFF)
6. Guarda si es necesario

### 3️⃣ Reinicia la App
Cierra completamente la app en Android y vuelve a abrirla.

---

## 🎯 ¿Funcionó?

Después de desactivar el App Certificate y reiniciar la app, deberías ver en la consola:

```
LOG  📡 Generando configuración para videollamada
LOG     Canal: class_XXXXX
LOG     UID: 12345678
LOG  ⚠️  Usando token vacío - Asegúrate de desactivar App Certificate en Agora Console
LOG  ✅ Agora Engine initialized successfully
LOG  ✅ Video preview started
LOG  ✅ Joined channel: class_XXXXX
```

**NO deberías ver:**
```
ERROR  ❌ Agora error: 110  ❌
```

---

## 📱 Si aún no ves la cámara

Si la conexión funciona pero no ves video:

1. **Verifica permisos:** La app debe pedir permisos de cámara y micrófono al iniciar
2. **Verifica que construiste Development Build** (no Expo Go)
3. **Ambos usuarios deben estar en el mismo canal** para verse

---

## 🔒 ¿Y la Seguridad?

**Para desarrollo:** Desactiva el App Certificate (lo que acabas de hacer)

**Para producción:** Necesitarás:
- Crear un backend/Edge Function
- El backend generará tokens seguros
- Reactivar el App Certificate en Agora

Por ahora, para probar la funcionalidad, está bien con el App Certificate desactivado.

---

## ❓ Soporte

Si sigues teniendo problemas:
1. Revisa que el App Certificate esté realmente desactivado
2. Cierra completamente la app y vuelve a abrirla
3. Verifica los logs en la consola para ver mensajes de error específicos

Para más detalles técnicos, consulta [AGORA_SETUP.md](AGORA_SETUP.md)
