# Configuración de Supabase para Spanish License

## Problemas Comunes

### Error 1: `"new row violates row-level security policy"`
Ocurre porque Supabase tiene habilitado Row Level Security (RLS) pero no hay políticas que permitan a los usuarios crear sus perfiles.

### Error 2: `"infinite recursion detected in policy"`
Ocurre cuando las políticas RLS intentan consultar la misma tabla dentro de la política, causando un bucle infinito.

## Solución Actualizada

Las políticas han sido **simplificadas** para evitar recursión infinita y permitir el correcto funcionamiento de la app.

## Solución: Configurar Políticas de RLS

### Paso 1: Acceder al SQL Editor de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. En el menú lateral, selecciona **SQL Editor**
3. Haz clic en **New Query**

### Paso 2: Ejecutar el Script SQL

Copia y pega el contenido completo del archivo `supabase_rls_policies.sql` en el editor SQL y ejecuta el script haciendo clic en **Run**.

### Paso 3: Verificar las Políticas

Después de ejecutar el script, verifica que las políticas se crearon correctamente:

1. Ve a **Authentication** > **Policies** en el menú lateral
2. Deberías ver las siguientes políticas para cada tabla:

#### Tabla `profiles`:
- ✅ Users can insert their own profile (INSERT)
- ✅ Authenticated users can view profiles (SELECT)
- ✅ Users can update their own profile (UPDATE)

#### Tabla `students`:
- ✅ Users can insert their own student record (INSERT)
- ✅ Authenticated users can view students (SELECT)
- ✅ Students can update their own record (UPDATE)

#### Tabla `teachers`:
- ✅ Users can insert their own teacher record (INSERT)
- ✅ Authenticated users can view teachers (SELECT)
- ✅ Teachers can update their own record (UPDATE)

## Resolución de Problemas

### Si las políticas ya existen

**No te preocupes**, el script `supabase_rls_policies.sql` ahora incluye comandos `DROP POLICY IF EXISTS` al inicio que eliminan automáticamente cualquier política existente antes de crear las nuevas.

Simplemente ejecuta el script completo y las políticas antiguas (con problemas de recursión) serán eliminadas y reemplazadas por las nuevas versiones simplificadas.

### Verificar que RLS esté habilitado

Ejecuta este query para verificar que RLS esté habilitado en las tablas:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'students', 'teachers');
```

Todas las tablas deberían mostrar `rowsecurity = true`.

## Cómo Funcionan las Políticas

### Políticas Simplificadas (Sin Recursión)

Las políticas han sido **simplificadas** para evitar el error de recursión infinita:

**Todos los usuarios autenticados pueden**:
- ✅ **INSERTAR**: Solo sus propios registros (`auth.uid() = id` o `auth.uid() = user_id`)
- ✅ **VER (SELECT)**: Cualquier registro de cualquier tabla (necesario para la funcionalidad de la app)
- ✅ **ACTUALIZAR**: Solo sus propios registros

**Usuarios no autenticados**:
- ❌ No tienen acceso a ninguna tabla

### ¿Por qué estas políticas?

1. **INSERT restringido**: Los usuarios solo pueden crear registros para sí mismos, evitando que alguien cree perfiles falsos
2. **SELECT abierto**: Todos los usuarios autenticados pueden ver todos los datos, lo cual es necesario para:
   - Estudiantes vean a los profesores disponibles
   - Profesores vean a sus estudiantes
   - La app funcione correctamente sin restricciones excesivas
3. **UPDATE restringido**: Los usuarios solo pueden modificar sus propios datos

### Restricciones por Rol a Nivel de Aplicación

Las restricciones más específicas por rol (estudiante, profesor, admin) deben implementarse en la **lógica de la aplicación**, no en las políticas RLS, para evitar problemas de recursión infinita.

## Tablas Adicionales Requeridas

Además de las tablas básicas (`profiles`, `students`, `teachers`), la aplicación requiere tablas adicionales para funcionalidades de quizzes y progreso.

### Paso 4: Crear Tablas Adicionales

1. En el SQL Editor de Supabase, abre una **nueva query**
2. Copia y pega el contenido de `supabase_schema_additional.sql`
3. Ejecuta el script

Este script creará:
- **quizzes**: Cuestionarios asociados a lecciones
- **quiz_attempts**: Intentos de quizzes por estudiantes
- **student_progress**: Progreso de estudiantes en lecciones

## Prueba de Funcionamiento

Después de configurar las políticas y crear las tablas adicionales:

1. Limpia el almacenamiento de la app (si has intentado registrarte antes)
2. Reinicia la aplicación
3. Intenta crear una nueva cuenta
4. El registro debería funcionar correctamente sin errores de RLS

## Estructura Completa de la Base de Datos

### Tablas Básicas (Usuario y Autenticación):
- **profiles**: Información común de todos los usuarios
- **students**: Información específica de estudiantes (referencia a profiles)
- **teachers**: Información específica de profesores (referencia a profiles)

### Tablas de Funcionalidad (Quizzes y Progreso):
- **quizzes**: Cuestionarios creados por profesores
- **quiz_attempts**: Intentos de quizzes realizados por estudiantes
- **student_progress**: Seguimiento del progreso de estudiantes por lección

La columna `role` en `profiles` determina el tipo de usuario y sus permisos.
