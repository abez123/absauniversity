# Guía de Variables de Entorno - ABSA University

## Producción Self-Hosted (Recomendado)

Cuando despliegas en tu VPS con Docker, **SOLO necesitas estas variables**:

```env
# Base de Datos
DB_ROOT_PASSWORD=tu_password_seguro
DB_NAME=absa_lms
DB_USER=absa_user
DB_PASSWORD=tu_password_seguro
DB_PORT=3306
DB_HOST=db
DATABASE_URL=mysql://absa_user:tu_password_seguro@db:3306/absa_lms

# Aplicación
NODE_ENV=production
APP_PORT=8082
VITE_APP_TITLE=ABSA UNIVERSITY
VITE_APP_LOGO=/logo-absa.png

# Seguridad
JWT_SECRET=tu_jwt_secret_generado_con_openssl

# Qdrant (RAG)
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=

# OpenAI (para embeddings)
OPENAI_API_KEY=sk-tu_openai_api_key
```

## Variables a IGNORAR en Producción Self-Hosted

**NO necesitas estas variables en producción:**

- `VITE_APP_ID` - Solo para OAuth de Manus
- `OAUTH_SERVER_URL` - Solo para OAuth de Manus
- `VITE_OAUTH_PORTAL_URL` - Solo para OAuth de Manus
- `OWNER_OPEN_ID` - Solo para OAuth de Manus
- `OWNER_NAME` - Solo para OAuth de Manus
- `BUILT_IN_FORGE_API_URL` - Usas Ollama local
- `BUILT_IN_FORGE_API_KEY` - Usas Ollama local
- `VITE_FRONTEND_FORGE_API_KEY` - Usas Ollama local
- `VITE_FRONTEND_FORGE_API_URL` - Usas Ollama local

## Desarrollo Local (Con Manus OAuth)

Si quieres usar Manus OAuth en desarrollo, agrega:

```env
VITE_APP_ID=tu_app_id_de_manus
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=tu_owner_open_id
OWNER_NAME=Tu Nombre
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=tu_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=tu_frontend_forge_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

## Cómo Generar JWT_SECRET Seguro

```bash
openssl rand -hex 32
```

Ejemplo de salida:
```
2f83db95d74a05d15482eaf872edfc76a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5
```

## Pasos en Dokploy

1. Ve a tu proyecto en Dokploy
2. Haz clic en "Environment Variables"
3. Copia SOLO las variables de la sección "Producción Self-Hosted"
4. Reemplaza los valores `tu_*` con tus valores reales
5. Haz clic en "Deploy"

## Verificación

Después de desplegar, verifica que el servidor inicie con:

```
[SDK] Running in self-hosted mode - OAuth SDK disabled
[OAuth] Disabled in production (self-hosted mode)
[Server] Running in self-hosted mode - Manus OAuth disabled
[Auth] Using local verification code authentication (self-hosted mode)
Server running on http://localhost:8082/
```

Si ves estos mensajes, significa que está corriendo correctamente en modo self-hosted.
