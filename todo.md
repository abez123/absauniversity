# LMS PWA - Project TODO

## Autenticación
- [x] Sistema de autenticación por código de correo (usando OAuth de Manus)
- [x] Validación de correo electrónico
- [x] Gestión de sesiones

## Interfaz de Estudiantes
- [x] Página de inicio/dashboard de cursos (Home.tsx)
- [x] Menú lateral con lista de cursos
- [x] Visor de video del curso (CourseDetail.tsx)
- [x] Transcripciones del video
- [x] Documentos del curso (lado derecho)
- [x] Chat con IA para dudas del curso (CourseChatBox.tsx)
- [x] Acceso a examen final (después de ver video)

## Chat con IA
- [x] Integración de LLM para responder dudas (invokeLLM)
- [x] Historial de conversaciones
- [x] Contexto de documentos del curso

## Sistema de Exámenes
- [x] Crear exámenes de preguntas y respuestas (ExamPage.tsx)
- [x] Validar finalización de video antes de examen
- [x] Calificación de exámenes
- [x] Historial de resultados

## Panel de Administración
- [x] Crear cursos (AdminPanel.tsx)
- [x] Subir videos
- [x] Entrenar IA con documentos del curso
- [x] Configurar requisitos previos de cursos
- [x] Configurar fechas de disponibilidad
- [x] Crear preguntas de examen
- [x] Gestión de usuarios (mediante roles)

## Características PWA
- [x] Manifest.json
- [x] Service Worker (sw.js)
- [x] Instalación en dispositivos

## Base de Datos
- [x] Tabla de usuarios
- [x] Tabla de cursos
- [x] Tabla de documentos
- [x] Tabla de transcripciones (en cursos)
- [x] Tabla de exámenes
- [x] Tabla de respuestas de exámenes
- [x] Tabla de progreso de estudiantes
- [x] Tabla de mensajes de chat
- [x] Tabla de códigos de verificación de email

## Configuración del Proyecto
- [x] Estructura de carpetas
- [x] Variables de entorno
- [x] Configuración de base de datos
- [x] Configuración de almacenamiento (S3)
- [x] Configuración de LLM
- [x] Rutas de la aplicación
- [x] Documentación completa

## Procedimientos tRPC Implementados
- [x] auth.me - Obtener usuario actual
- [x] auth.logout - Cerrar sesión
- [x] courses.list - Listar cursos publicados
- [x] courses.getById - Obtener detalle del curso
- [x] courses.getByInstructor - Listar cursos del instructor
- [x] courses.create - Crear curso (admin)
- [x] courses.update - Actualizar curso (admin)
- [x] studentProgress.get - Obtener progreso
- [x] studentProgress.enroll - Inscribirse en curso
- [x] studentProgress.markVideoWatched - Marcar video como visto
- [x] studentProgress.markExamTaken - Registrar examen completado
- [x] exams.getByCourse - Obtener examen del curso
- [x] exams.getQuestions - Obtener preguntas del examen
- [x] exams.create - Crear examen (admin)
- [x] exams.addQuestion - Agregar pregunta (admin)
- [x] documents.getByCourse - Obtener documentos del curso
- [x] documents.add - Agregar documento (admin)
- [x] chat.getHistory - Obtener historial de chat
- [x] chat.sendMessage - Enviar mensaje y obtener respuesta de IA

## Páginas Implementadas
- [x] Home.tsx - Página principal con lista de cursos
- [x] CourseDetail.tsx - Detalle del curso con video, transcripción y documentos
- [x] ExamPage.tsx - Página de examen
- [x] AdminPanel.tsx - Panel de administración
- [x] CourseChatBox.tsx - Componente de chat con IA

## Próximos Pasos (Opcionales)
- [ ] Sistema de certificados
- [ ] Badges y gamificación
- [ ] Foros de discusión
- [ ] Videoconferencias en vivo
- [ ] Análisis avanzado de progreso
- [ ] Integración con sistemas de pago
- [ ] Soporte multiidioma
- [ ] Accesibilidad mejorada
