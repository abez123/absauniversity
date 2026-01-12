# Usuarios de Prueba - ABSA UNIVERSITY

## 📚 Acceso a la Plataforma

La plataforma ABSA UNIVERSITY está configurada con dos usuarios de prueba para que puedas explorar todas las funcionalidades.

---

## 👤 Usuario Estudiante

**Nombre:** Estudiante de Prueba  
**Email:** estudiante@absa.edu  
**OpenId:** test-student-001  
**Rol:** Estudiante (user)

### Funcionalidades Disponibles:
- Ver lista de cursos disponibles
- Inscribirse en cursos
- Ver videos del curso
- Leer transcripciones
- Descargar documentos
- Hacer preguntas al chat con IA
- Realizar exámenes
- Ver progreso en cursos

---

## 👨‍💼 Usuario Administrador

**Nombre:** Administrador de Prueba  
**Email:** admin@absa.edu  
**OpenId:** test-admin-001  
**Rol:** Administrador (admin)

### Funcionalidades Disponibles:
- Acceso al Panel de Administración (`/admin`)
- Crear nuevos cursos
- Subir videos y transcripciones
- Agregar documentos del curso
- Crear exámenes
- Agregar preguntas a exámenes
- Publicar/despublicar cursos
- Ver estadísticas de cursos

---

## 🔐 Cómo Acceder en Desarrollo

### Opción 1: Usando el Sistema de Autenticación OAuth (Recomendado)

1. Accede a la plataforma en `http://localhost:3000`
2. Haz clic en "Iniciar Sesión"
3. Completa el flujo de autenticación de Manus
4. El sistema creará automáticamente tu usuario

### Opción 2: Acceso Directo (Desarrollo Local)

Para desarrollo local, puedes modificar el archivo `server/_core/context.ts` para permitir acceso directo con los usuarios de prueba:

```typescript
// En server/_core/context.ts
// Agregar un middleware de desarrollo que reconozca los openIds de prueba
if (process.env.NODE_ENV === 'development') {
  const testOpenId = req.headers['x-test-user']; // Para testing
  if (testOpenId === 'test-student-001' || testOpenId === 'test-admin-001') {
    // Crear sesión con el usuario de prueba
  }
}
```

---

## 📝 Flujo de Prueba Recomendado

### Para Estudiantes:

1. **Inicio de Sesión**
   - Inicia sesión como "Estudiante de Prueba"
   - Deberías ver la página de inicio con cursos disponibles

2. **Exploración de Cursos**
   - Haz clic en un curso para ver sus detalles
   - Observa el video, transcripción y documentos

3. **Interacción con IA**
   - Haz una pregunta al chat con IA
   - Verifica que recibas respuestas contextuales

4. **Realización de Examen**
   - Después de ver el video, accede al examen
   - Completa las preguntas y envía
   - Verifica tu calificación

### Para Administradores:

1. **Acceso al Panel**
   - Inicia sesión como "Administrador de Prueba"
   - Haz clic en "Panel de Administración"

2. **Crear Curso**
   - Haz clic en "Crear Curso"
   - Completa los detalles del curso
   - Agrega video URL y transcripción

3. **Crear Examen**
   - En el curso creado, haz clic en "Agregar Examen"
   - Configura el título y puntuación mínima
   - Agrega preguntas al examen

4. **Publicar Curso**
   - Haz clic en "Publicar" para que los estudiantes lo vean

---

## 🗄️ Información de la Base de Datos

Los usuarios de prueba están almacenados en la tabla `users` con los siguientes datos:

```sql
SELECT * FROM users WHERE loginMethod = 'test';
```

**Resultado esperado:**

| id | openId | name | email | role | loginMethod |
|----|--------|------|-------|------|-------------|
| 1 | test-student-001 | Estudiante de Prueba | estudiante@absa.edu | user | test |
| 2 | test-admin-001 | Administrador de Prueba | admin@absa.edu | admin | test |

---

## 🔄 Restablecer Usuarios de Prueba

Si necesitas restablecer los usuarios de prueba, ejecuta:

```sql
DELETE FROM users WHERE loginMethod = 'test';
```

Luego ejecuta nuevamente el script de creación de usuarios.

---

## 💡 Notas Importantes

1. **Seguridad**: Estos usuarios de prueba son solo para desarrollo. No uses en producción.

2. **Datos Persistentes**: Los datos creados con estos usuarios se guardarán en la base de datos. Puedes limpiar manualmente si es necesario.

3. **Autenticación Real**: Para producción, configura el sistema de autenticación OAuth de Manus correctamente.

4. **Roles**: El sistema distingue entre `user` (estudiante) y `admin` (administrador) mediante el campo `role` en la tabla `users`.

---

## 🆘 Solución de Problemas

### No puedo iniciar sesión
- Verifica que el servidor está ejecutándose: `pnpm dev`
- Comprueba que la base de datos está conectada
- Revisa los logs en la consola

### No veo el Panel de Administración
- Asegúrate de estar usando la cuenta de "Administrador de Prueba"
- Verifica que el rol en la base de datos es "admin"

### El chat con IA no responde
- Verifica que `BUILT_IN_FORGE_API_KEY` está configurada
- Comprueba que el LLM está disponible

### Los cursos no se cargan
- Verifica que hay cursos creados en la base de datos
- Comprueba que el curso tiene `isPublished = true`

---

## 📞 Soporte

Para más información sobre la plataforma, consulta:
- `README_LMS.md` - Documentación general
- `todo.md` - Estado del proyecto
- Código fuente en `client/src/pages/` y `server/routers.ts`
