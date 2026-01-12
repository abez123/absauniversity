# LMS PWA - Learning Management System

Una plataforma completa de gestión de aprendizaje construida con **Next.js**, **Hono**, **Bun** y **React 19**. Incluye autenticación por correo, cursos con videos, transcripciones, documentos, chat con IA y exámenes interactivos.

## Características Principales

### Para Estudiantes
- **Autenticación por Correo**: Sistema seguro de login con códigos de verificación
- **Catálogo de Cursos**: Acceso a cursos publicados con descripciones detalladas
- **Visor de Videos**: Reproducción de videos con seguimiento de visualización
- **Transcripciones**: Acceso a transcripciones de videos para mejor comprensión
- **Documentos del Curso**: Descarga de materiales complementarios
- **Chat con IA**: Asistente inteligente para responder dudas sobre el curso
- **Exámenes**: Evaluaciones interactivas con preguntas de opción múltiple y respuestas cortas
- **Seguimiento de Progreso**: Visualización del progreso en cada curso

### Para Administradores
- **Gestión de Cursos**: Crear, editar y publicar cursos
- **Carga de Videos**: Subir y gestionar videos del curso
- **Transcripciones**: Agregar transcripciones de videos
- **Documentos**: Subir documentos complementarios
- **Creación de Exámenes**: Crear exámenes con múltiples tipos de preguntas
- **Configuración de Requisitos**: Establecer cursos previos requeridos
- **Fechas de Disponibilidad**: Configurar cuándo los cursos están disponibles
- **Entrenamiento de IA**: Proporcionar documentos para entrenar el asistente de IA

### Características PWA
- **Instalable**: Se puede instalar como aplicación en dispositivos
- **Offline**: Funcionalidad limitada sin conexión a internet
- **Sincronización**: Sincronización automática cuando se restaura la conexión
- **Notificaciones**: Notificaciones push para actualizaciones importantes

## Tecnología Stack

### Frontend
- **React 19** - Framework UI moderno
- **Tailwind CSS 4** - Estilos utilitarios
- **shadcn/ui** - Componentes de UI reutilizables
- **tRPC** - Type-safe API calls
- **Wouter** - Enrutamiento ligero
- **Streamdown** - Renderizado de markdown

### Backend
- **Express.js** - Servidor web
- **tRPC** - RPC type-safe
- **Drizzle ORM** - ORM moderno
- **MySQL/TiDB** - Base de datos

### DevOps
- **Bun** - Runtime de JavaScript
- **Vite** - Build tool rápido
- **TypeScript** - Type safety
- **Vitest** - Testing framework

## Estructura del Proyecto

```
lms-pwa-nextjs-hono-bun/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx              # Página principal con lista de cursos
│   │   │   ├── CourseDetail.tsx      # Detalle del curso
│   │   │   ├── ExamPage.tsx          # Página de examen
│   │   │   └── AdminPanel.tsx        # Panel de administración
│   │   ├── components/
│   │   │   ├── CourseChatBox.tsx     # Chat con IA
│   │   │   └── ui/                   # Componentes shadcn/ui
│   │   ├── lib/
│   │   │   └── trpc.ts               # Cliente tRPC
│   │   └── App.tsx                   # Rutas principales
│   ├── public/
│   │   ├── manifest.json             # PWA manifest
│   │   └── sw.js                     # Service Worker
│   └── index.html
├── server/
│   ├── routers.ts                    # Procedimientos tRPC
│   ├── db.ts                         # Funciones de base de datos
│   └── _core/                        # Configuración del servidor
├── drizzle/
│   └── schema.ts                     # Esquema de base de datos
└── todo.md                           # Tareas del proyecto
```

## Esquema de Base de Datos

### Tablas Principales

**users** - Usuarios del sistema
- id, openId (OAuth), name, email, role (admin/user), timestamps

**courses** - Cursos disponibles
- id, title, description, instructorId, videoUrl, videoTranscript, prerequisites, startDate, endDate, isPublished

**courseDocuments** - Documentos de cursos
- id, courseId, title, documentUrl, documentKey, mimeType

**exams** - Exámenes
- id, courseId, title, description, passingScore

**examQuestions** - Preguntas de examen
- id, examId, question, questionType, options, correctAnswer, points

**studentProgress** - Progreso del estudiante
- id, userId, courseId, videoWatched, examTaken, examScore, timestamps

**examResponses** - Respuestas de exámenes
- id, examId, userId, questionId, answer, isCorrect, pointsEarned

**chatMessages** - Historial de chat
- id, userId, courseId, role (user/assistant), content, createdAt

**emailVerificationCodes** - Códigos de verificación
- id, email, code, expiresAt

## Rutas de la API (tRPC)

### Autenticación
- `auth.me` - Obtener usuario actual
- `auth.logout` - Cerrar sesión

### Cursos
- `courses.list` - Listar cursos publicados
- `courses.getById` - Obtener detalle del curso
- `courses.getByInstructor` - Listar cursos del instructor (admin)
- `courses.create` - Crear curso (admin)
- `courses.update` - Actualizar curso (admin)

### Progreso del Estudiante
- `studentProgress.get` - Obtener progreso
- `studentProgress.enroll` - Inscribirse en curso
- `studentProgress.markVideoWatched` - Marcar video como visto
- `studentProgress.markExamTaken` - Registrar examen completado

### Exámenes
- `exams.getByCourse` - Obtener examen del curso
- `exams.getQuestions` - Obtener preguntas del examen
- `exams.create` - Crear examen (admin)
- `exams.addQuestion` - Agregar pregunta (admin)

### Documentos
- `documents.getByCourse` - Obtener documentos del curso
- `documents.add` - Agregar documento (admin)

### Chat
- `chat.getHistory` - Obtener historial de chat
- `chat.sendMessage` - Enviar mensaje y obtener respuesta de IA

## Flujos Principales

### Flujo de Estudiante
1. **Autenticación**: Ingresa correo → Recibe código → Verifica código
2. **Exploración**: Ve lista de cursos disponibles
3. **Inscripción**: Se inscribe en un curso
4. **Aprendizaje**: 
   - Ve el video del curso
   - Lee la transcripción
   - Descarga documentos
   - Hace preguntas al chat con IA
5. **Evaluación**: Completa el examen final
6. **Resultado**: Obtiene calificación y certificado (si aprobó)

### Flujo de Administrador
1. **Autenticación**: Login como admin
2. **Creación de Curso**: 
   - Crea nuevo curso
   - Sube video
   - Agrega transcripción
   - Sube documentos
3. **Configuración**:
   - Establece requisitos previos
   - Configura fechas de disponibilidad
   - Entrena IA con documentos
4. **Examen**:
   - Crea examen
   - Agrega preguntas
   - Configura puntuación mínima
5. **Publicación**: Publica curso para estudiantes
6. **Monitoreo**: Revisa progreso de estudiantes

## Instalación y Configuración

### Requisitos
- Node.js 22+
- Bun (recomendado)
- MySQL/TiDB

### Pasos de Instalación

1. **Clonar repositorio**
```bash
git clone <repository-url>
cd lms-pwa-nextjs-hono-bun
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env con las variables necesarias
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
# ... otras variables
```

4. **Ejecutar migraciones**
```bash
pnpm db:push
```

5. **Iniciar servidor de desarrollo**
```bash
pnpm dev
```

6. **Acceder a la aplicación**
```
http://localhost:3000
```

## Desarrollo

### Crear un Nuevo Procedimiento tRPC

1. **Agregar función en `server/db.ts`**:
```typescript
export async function getMyData(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.select().from(myTable).where(eq(myTable.id, id));
}
```

2. **Agregar procedimiento en `server/routers.ts`**:
```typescript
myRouter: router({
  getData: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getMyData(input.id);
    }),
}),
```

3. **Usar en componente React**:
```typescript
const { data } = trpc.myRouter.getData.useQuery({ id: 1 });
```

### Escribir Tests

```typescript
import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("my feature", () => {
  it("should work", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.myRouter.getData({ id: 1 });
    expect(result).toBeDefined();
  });
});
```

### Ejecutar Tests
```bash
pnpm test
```

## Despliegue

El proyecto está configurado para desplegarse en **Manus**. Sigue los pasos:

1. **Crear checkpoint**:
```bash
# El proyecto guarda automáticamente checkpoints
```

2. **Publicar**:
- Accede a la UI de Management
- Haz clic en "Publish"
- Selecciona el checkpoint a desplegar

3. **Configurar dominio personalizado**:
- En Settings → Domains
- Agrega tu dominio personalizado

## Características Futuras

- [ ] Sistema de certificados
- [ ] Badges y gamificación
- [ ] Foros de discusión
- [ ] Videoconferencias en vivo
- [ ] Análisis avanzado de progreso
- [ ] Integración con sistemas de pago
- [ ] Soporte multiidioma
- [ ] Accesibilidad mejorada

## Solución de Problemas

### Error: "Cannot find module drizzle/schema"
**Solución**: Ejecutar `pnpm db:push` para generar las migraciones

### Error: "Database connection failed"
**Solución**: Verificar que `DATABASE_URL` está correctamente configurada

### El chat con IA no responde
**Solución**: Verificar que `BUILT_IN_FORGE_API_KEY` está configurada correctamente

## Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## Licencia

MIT

## Soporte

Para soporte, contacta a través de:
- Issues en GitHub
- Email: support@lmsplatform.com
- Documentación: https://docs.lmsplatform.com

## Roadmap

### Q1 2026
- [ ] Mejorar UI/UX
- [ ] Optimizar rendimiento
- [ ] Agregar más tipos de preguntas

### Q2 2026
- [ ] Sistema de certificados
- [ ] Análisis avanzado
- [ ] Integración de pagos

### Q3 2026
- [ ] Soporte multiidioma
- [ ] Foros de discusión
- [ ] Videoconferencias en vivo
