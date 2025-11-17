-- =====================================================
-- POLÍTICAS DE ROW LEVEL SECURITY PARA SPANISH LICENSE
-- =====================================================
-- Ejecuta este script en el SQL Editor de Supabase
-- Dashboard > SQL Editor > New Query
-- =====================================================

-- IMPORTANTE: Primero eliminar las políticas existentes si las hay
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can insert their own student record" ON students;
DROP POLICY IF EXISTS "Students can view their own record" ON students;
DROP POLICY IF EXISTS "Students can update their own record" ON students;
DROP POLICY IF EXISTS "Teachers can view all students" ON students;
DROP POLICY IF EXISTS "Admins can view all students" ON students;

DROP POLICY IF EXISTS "Users can insert their own teacher record" ON teachers;
DROP POLICY IF EXISTS "Teachers can view their own record" ON teachers;
DROP POLICY IF EXISTS "Teachers can update their own record" ON teachers;
DROP POLICY IF EXISTS "Students can view all teachers" ON teachers;
DROP POLICY IF EXISTS "Admins can view all teachers" ON teachers;

-- ========================================
-- TABLA: profiles
-- ========================================

-- Habilitar RLS en la tabla profiles (si no está habilitado)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios autenticados pueden INSERTAR su propio perfil al registrarse
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Política: Los usuarios autenticados pueden VER cualquier perfil
-- (Simplificado para evitar recursión)
CREATE POLICY "Authenticated users can view profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Política: Los usuarios pueden ACTUALIZAR solo su propio perfil
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ========================================
-- TABLA: students
-- ========================================

-- Habilitar RLS en la tabla students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios autenticados pueden INSERTAR su propio registro de estudiante
CREATE POLICY "Users can insert their own student record"
ON students
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios autenticados pueden VER cualquier registro de estudiante
-- (Simplificado para evitar recursión)
CREATE POLICY "Authenticated users can view students"
ON students
FOR SELECT
TO authenticated
USING (true);

-- Política: Los estudiantes pueden ACTUALIZAR solo su propio registro
CREATE POLICY "Students can update their own record"
ON students
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ========================================
-- TABLA: teachers
-- ========================================

-- Habilitar RLS en la tabla teachers
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios autenticados pueden INSERTAR su propio registro de profesor
CREATE POLICY "Users can insert their own teacher record"
ON teachers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios autenticados pueden VER cualquier registro de profesor
-- (Simplificado para evitar recursión - útil para que estudiantes vean profesores)
CREATE POLICY "Authenticated users can view teachers"
ON teachers
FOR SELECT
TO authenticated
USING (true);

-- Política: Los profesores pueden ACTUALIZAR solo su propio registro
CREATE POLICY "Teachers can update their own record"
ON teachers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Las políticas permiten que usuarios autenticados:
--    - Creen sus propios registros (INSERT)
--    - Vean cualquier registro (SELECT) - necesario para la funcionalidad de la app
--    - Actualicen solo sus propios registros (UPDATE)
--
-- 2. Se usa "TO authenticated" para asegurar que solo usuarios
--    autenticados puedan acceder a los datos
--
-- 3. Las políticas están simplificadas para evitar recursión infinita
--    que ocurría al consultar la tabla profiles dentro de las políticas
--
-- 4. Si necesitas restricciones más específicas por rol, deberás
--    implementarlas a nivel de aplicación
--
-- 5. Después de ejecutar este script, prueba crear un nuevo usuario
-- =====================================================
