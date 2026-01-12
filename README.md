# ABSA UNIVERSITY - Plataforma de Aprendizaje en Línea

![ABSA Logo](client/public/logo-absa.png)

**ABSA UNIVERSITY** es una plataforma moderna de gestión de aprendizaje (LMS) construida con tecnologías de vanguardia. Ofrece una experiencia completa para estudiantes y administradores, con características como cursos con video, chat con IA, exámenes interactivos y mucho más.

## 🚀 Características Principales

### Para Estudiantes
- ✅ Autenticación segura por OAuth
- ✅ Catálogo de cursos con descripciones
- ✅ Reproducción de videos con transcripciones
- ✅ Descarga de documentos del curso
- ✅ Chat con IA para responder dudas
- ✅ Exámenes interactivos
- ✅ Seguimiento de progreso

### Para Administradores
- ✅ Panel de administración completo
- ✅ Crear y gestionar cursos
- ✅ Subir videos y transcripciones
- ✅ Crear exámenes con preguntas
- ✅ Configurar requisitos previos
- ✅ Ver estadísticas de cursos
- ✅ Entrenar IA con documentos

### Características PWA
- ✅ Instalable en dispositivos
- ✅ Funcionalidad offline
- ✅ Sincronización automática
- ✅ Notificaciones push

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19, Tailwind CSS 4, shadcn/ui |
| **Backend** | Express.js, tRPC, Hono |
| **Base de Datos** | MySQL/TiDB, Drizzle ORM |
| **Runtime** | Bun, Node.js |
| **Build** | Vite, TypeScript |
| **Testing** | Vitest |

## 📋 Requisitos

- Node.js 22+
- Bun (recomendado)
- MySQL/TiDB
- Git

## 🚀 Instalación Rápida

```bash
# Clonar repositorio
git clone https://github.com/abez123/absauniversity.git
cd absauniversity

# Instalar dependencias
pnpm install

# Configurar base de datos
pnpm db:push

# Iniciar servidor de desarrollo
pnpm dev
```

Accede a `http://localhost:3000`

## 📚 Documentación

- **[README_LMS.md](README_LMS.md)** - Documentación técnica completa
- **[TEST_USERS.md](TEST_USERS.md)** - Usuarios de prueba y guía de acceso
- **[todo.md](todo.md)** - Estado del proyecto y características

## 👥 Usuarios de Prueba

| Rol | Email | OpenId |
|-----|-------|--------|
| Estudiante | estudiante@absa.edu | test-student-001 |
| Administrador | admin@absa.edu | test-admin-001 |

Consulta [TEST_USERS.md](TEST_USERS.md) para instrucciones de acceso.

## 📁 Estructura del Proyecto

```
absauniversity/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas principales
│   │   ├── components/    # Componentes reutilizables
│   │   └── constants/     # Constantes (idiomas, etc)
│   └── public/            # Archivos estáticos
├── server/                # Backend Express/tRPC
│   ├── routers.ts         # Procedimientos tRPC
│   ├── db.ts              # Funciones de BD
│   └── _core/             # Configuración del servidor
├── drizzle/               # Esquema de BD
└── shared/                # Código compartido
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Iniciar servidor de desarrollo
pnpm build            # Compilar para producción
pnpm start            # Iniciar servidor de producción

# Base de Datos
pnpm db:push          # Ejecutar migraciones

# Testing
pnpm test             # Ejecutar tests
pnpm test:watch       # Tests en modo watch

# Herramientas
pnpm format           # Formatear código
pnpm check            # Verificar tipos TypeScript
```

## 🗄️ Base de Datos

La plataforma utiliza las siguientes tablas principales:

- **users** - Usuarios del sistema
- **courses** - Cursos disponibles
- **courseDocuments** - Documentos de cursos
- **exams** - Exámenes
- **examQuestions** - Preguntas de examen
- **studentProgress** - Progreso de estudiantes
- **examResponses** - Respuestas de exámenes
- **chatMessages** - Historial de chat
- **emailVerificationCodes** - Códigos de verificación

## 🤖 Integración con IA

La plataforma incluye integración con LLM para:
- Responder preguntas del chat en contexto del curso
- Entrenar con documentos específicos del curso
- Generar respuestas personalizadas

## 🌐 Despliegue

La plataforma está optimizada para despliegue en **Manus**:

1. Crea un checkpoint del proyecto
2. Haz clic en "Publish" en la UI de Management
3. Configura tu dominio personalizado

## 📝 Licencia

MIT

## 🆘 Soporte

Para reportar bugs o sugerir mejoras:
1. Abre un issue en GitHub
2. Describe el problema detalladamente
3. Incluye pasos para reproducir

## 🎯 Roadmap

- [ ] Sistema de certificados
- [ ] Badges y gamificación
- [ ] Foros de discusión
- [ ] Videoconferencias en vivo
- [ ] Análisis avanzado de progreso
- [ ] Integración con sistemas de pago
- [ ] Soporte multiidioma
- [ ] Accesibilidad mejorada

## 👨‍💻 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Contacto

- **Email**: info@absa.edu
- **Website**: https://www.absa.edu
- **GitHub**: https://github.com/abez123/absauniversity

---

**Hecho con ❤️ para ABSA UNIVERSITY**
