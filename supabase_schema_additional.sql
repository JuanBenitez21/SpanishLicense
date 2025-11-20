-- =====================================================
-- ESQUEMA ADICIONAL PARA SPANISH LICENSE
-- =====================================================
-- Este script crea las tablas adicionales necesarias
-- para quizzes, intentos y progreso del estudiante
-- =====================================================

-- ========================================
-- TABLA: quizzes
-- ========================================
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    num_questions INTEGER NOT NULL DEFAULT 5,
    passing_score INTEGER NOT NULL DEFAULT 70,
    time_limit_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para quizzes
CREATE POLICY "Authenticated users can view quizzes"
ON quizzes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teachers can insert quizzes"
ON quizzes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  )
);

CREATE POLICY "Teachers can update quizzes"
ON quizzes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  )
);

-- ========================================
-- TABLA: quiz_attempts
-- ========================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    generated_questions JSONB NOT NULL,
    user_answers TEXT[],
    score NUMERIC,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Habilitar RLS
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para quiz_attempts
CREATE POLICY "Users can insert their own quiz attempts"
ON quiz_attempts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Authenticated users can view quiz attempts"
ON quiz_attempts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Students can update their own quiz attempts"
ON quiz_attempts
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- ========================================
-- TABLA: student_progress
-- ========================================
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    score NUMERIC,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- Habilitar RLS
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para student_progress
CREATE POLICY "Users can insert their own progress"
ON student_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Authenticated users can view progress"
ON student_progress
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Students can update their own progress"
ON student_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- ========================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ========================================
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_lesson_id ON student_progress(lesson_id);

-- =====================================================
-- TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_progress_updated_at
    BEFORE UPDATE ON student_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- NOTAS:
-- =====================================================
-- 1. Este script crea las tablas adicionales necesarias
-- 2. Las políticas RLS permiten que usuarios autenticados vean datos
-- 3. Solo los profesores/admins pueden crear/editar quizzes
-- 4. Los estudiantes solo pueden modificar sus propios intentos y progreso
-- 5. Ejecuta este script DESPUÉS de crear las tablas básicas (profiles, students, teachers)
-- =====================================================
