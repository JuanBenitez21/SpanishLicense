-- ============================================
-- Políticas RLS para Chat
-- ============================================
-- Ejecuta este script en tu panel de Supabase (SQL Editor)
-- para configurar las políticas de seguridad del chat

-- 1. Habilitar RLS en las tablas de chat (si no está habilitado)
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Políticas para chat_conversations
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Teachers can create conversations with students" ON chat_conversations;
DROP POLICY IF EXISTS "Students can create conversations with teachers" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON chat_conversations;

-- Política: Los usuarios pueden ver sus propias conversaciones
CREATE POLICY "Users can view their own conversations" ON chat_conversations
FOR SELECT
USING (
  -- Estudiantes pueden ver conversaciones donde son participantes
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
  OR
  -- Profesores pueden ver conversaciones donde son participantes
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);

-- Política: Profesores pueden crear conversaciones con estudiantes
CREATE POLICY "Teachers can create conversations with students" ON chat_conversations
FOR INSERT
WITH CHECK (
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);

-- Política: Estudiantes pueden crear conversaciones con profesores
CREATE POLICY "Students can create conversations with teachers" ON chat_conversations
FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Política: Los usuarios pueden actualizar sus propias conversaciones
CREATE POLICY "Users can update their own conversations" ON chat_conversations
FOR UPDATE
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
  OR
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
  OR
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);

-- ============================================
-- Políticas para chat_messages
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;

-- Política: Los usuarios pueden ver mensajes de sus conversaciones
CREATE POLICY "Users can view messages in their conversations" ON chat_messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM chat_conversations
    WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
       OR teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
  )
);

-- Política: Los usuarios pueden enviar mensajes en sus conversaciones
CREATE POLICY "Users can send messages in their conversations" ON chat_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND
  conversation_id IN (
    SELECT id FROM chat_conversations
    WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
       OR teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
  )
);

-- Política: Los usuarios pueden actualizar sus propios mensajes
CREATE POLICY "Users can update their own messages" ON chat_messages
FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- ============================================
-- Función para actualizar last_message en conversaciones
-- ============================================

-- Crear o reemplazar la función que actualiza last_message automáticamente
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS on_message_created ON chat_messages;

-- Crear trigger para actualizar last_message cuando se crea un mensaje
CREATE TRIGGER on_message_created
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- ============================================
-- Función para incrementar contador de mensajes no leídos
-- ============================================

CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  conversation_record RECORD;
BEGIN
  -- Obtener información de la conversación
  SELECT student_id, teacher_id INTO conversation_record
  FROM chat_conversations
  WHERE id = NEW.conversation_id;

  -- Obtener el rol del remitente
  IF EXISTS (SELECT 1 FROM students WHERE user_id = NEW.sender_id) THEN
    -- El remitente es un estudiante, incrementar contador del profesor
    UPDATE chat_conversations
    SET teacher_unread_count = teacher_unread_count + 1
    WHERE id = NEW.conversation_id;
  ELSIF EXISTS (SELECT 1 FROM teachers WHERE user_id = NEW.sender_id) THEN
    -- El remitente es un profesor, incrementar contador del estudiante
    UPDATE chat_conversations
    SET student_unread_count = student_unread_count + 1
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS on_message_created_increment_unread ON chat_messages;

-- Crear trigger para incrementar contador de no leídos
CREATE TRIGGER on_message_created_increment_unread
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();

-- ============================================
-- Verificación
-- ============================================

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('chat_conversations', 'chat_messages')
ORDER BY tablename, policyname;
