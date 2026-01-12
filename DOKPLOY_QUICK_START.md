# Guía Rápida: Deployment en Dokploy

## Paso 1: Configurar Variables de Entorno en Dokploy

En la interfaz de Dokploy, ve a **Environment Variables** y configura TODAS estas variables:

### Variables Críticas (REQUERIDAS)

```
DB_ROOT_PASSWORD=tu_contraseña_segura_aqui
DB_USER=absa_user
DB_PASSWORD=tu_contraseña_usuario_aqui
DB_NAME=absa_lms
DB_PORT=3306
DB_HOST=db
NODE_ENV=production
APP_PORT=3000
JWT_SECRET=tu_jwt_secret_aqui
```

### Variables de Aplicación

```
VITE_APP_TITLE=ABSA UNIVERSITY
VITE_APP_LOGO=/logo-absa.png
VITE_APP_ID=tu_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=tu_owner_id
OWNER_NAME=Tu Nombre
```

### Variables de APIs

```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=tu_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=tu_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

### Variables Opcionales

```
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=
OPENAI_API_KEY=sk-tu_openai_key
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

## Paso 2: Configurar Docker Compose en Dokploy

1. En Dokploy, selecciona **Docker Compose** como tipo de deployment
2. Copia el contenido del archivo `docker-compose.yml` del repositorio
3. Pega en la sección de configuración de Dokploy
4. Asegúrate de que el puerto esté configurado a **3000**

## Paso 3: Iniciar Deployment

1. Haz clic en **Deploy**
2. Dokploy clonará el repositorio
3. Construirá la imagen Docker
4. Iniciará los contenedores
5. Ejecutará migraciones de BD automáticamente

## Paso 4: Verificar que Funciona

```bash
# Desde tu VPS
curl http://localhost:3000

# Deberías ver la página de login de ABSA UNIVERSITY
```

## Troubleshooting

### Error: "The variable is not set"

**Solución**: Todas las variables de entorno deben configurarse en Dokploy ANTES de hacer deploy.

### Error: "Docker command failed"

**Solución**: 
1. Verifica que todas las variables están configuradas
2. Revisa los logs en Dokploy
3. Asegúrate de que el archivo `docker-compose.yml` está correcto

### La BD no inicia

**Solución**:
```bash
# En tu VPS, verifica MySQL
docker logs absa-mysql

# Reinicia MySQL
docker restart absa-mysql
```

### La app no conecta a la BD

**Solución**: Verifica que `DATABASE_URL` está correctamente configurada:
```
mysql://absa_user:tu_contraseña@db:3306/absa_lms
```

## Próximos Pasos

1. **Configurar Dominio**: En Dokploy, agrega tu dominio personalizado
2. **Habilitar HTTPS**: Dokploy lo configura automáticamente
3. **Crear Cursos**: Accede a `/admin` con el usuario admin
4. **Configurar Email**: Integra SendGrid/Mailgun para códigos reales

---

**Nota**: Después de hacer deploy, espera 2-3 minutos para que todo inicie correctamente.
