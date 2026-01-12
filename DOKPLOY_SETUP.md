# Guía de Deployment con Dokploy en Hostinger VPS

Esta guía explica cómo desplegar ABSA University en tu VPS de Hostinger usando Dokploy.

## Requisitos Previos

1. **VPS de Hostinger** con acceso SSH
2. **Dokploy** instalado en el VPS
3. **Repositorio GitHub** conectado a Dokploy
4. **Docker y Docker Compose** instalados en el VPS

## Instalación de Dokploy (si no está instalado)

```bash
# SSH a tu VPS
ssh root@tu-vps-ip

# Instalar Dokploy
curl -sSL https://dokploy.com/install.sh | bash

# Iniciar Dokploy
dokploy start
```

## Pasos de Deployment

### 1. Conectar Repositorio a Dokploy

1. Accede a la interfaz de Dokploy (http://tu-vps-ip:3000)
2. Ve a **Projects** → **New Project**
3. Selecciona **GitHub** como fuente
4. Autoriza el acceso a GitHub
5. Selecciona el repositorio `abez123/absauniversity`
6. Selecciona la rama `main`

### 2. Configurar Variables de Entorno

En Dokploy, ve a **Environment Variables** y configura:

```bash
# Base de Datos
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
DB_NAME=absa_lms
DB_USER=absa_user
DB_PASSWORD=${DB_PASSWORD}
DB_PORT=3306

# Aplicación
NODE_ENV=production
JWT_SECRET=${JWT_SECRET}
VITE_APP_TITLE=ABSA UNIVERSITY
VITE_APP_LOGO=/logo-absa.png

# OAuth
VITE_APP_ID=${VITE_APP_ID}
OAUTH_SERVER_URL=${OAUTH_SERVER_URL}
VITE_OAUTH_PORTAL_URL=${VITE_OAUTH_PORTAL_URL}
OWNER_OPEN_ID=${OWNER_OPEN_ID}
OWNER_NAME=${OWNER_NAME}

# Manus APIs
BUILT_IN_FORGE_API_URL=${BUILT_IN_FORGE_API_URL}
BUILT_IN_FORGE_API_KEY=${BUILT_IN_FORGE_API_KEY}
VITE_FRONTEND_FORGE_API_KEY=${VITE_FRONTEND_FORGE_API_KEY}
VITE_FRONTEND_FORGE_API_URL=${VITE_FRONTEND_FORGE_API_URL}

# Qdrant (RAG)
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=${QDRANT_API_KEY}

# OpenAI (para embeddings)
OPENAI_API_KEY=${OPENAI_API_KEY}

# Analytics (opcional)
VITE_ANALYTICS_ENDPOINT=${VITE_ANALYTICS_ENDPOINT}
VITE_ANALYTICS_WEBSITE_ID=${VITE_ANALYTICS_WEBSITE_ID}
```

### 3. Configurar Docker Compose

1. En Dokploy, selecciona **Docker Compose** como tipo de deployment
2. Copia el contenido de `docker-compose.prod.yml`
3. Pega en la sección de configuración de Dokploy
4. Asegúrate de que el puerto esté configurado a `3000`

### 4. Configurar Dominio

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado
3. Configura DNS records según las instrucciones de Dokploy
4. Habilita HTTPS/SSL

### 5. Iniciar Deployment

1. Haz clic en **Deploy**
2. Dokploy clonará el repositorio
3. Construirá la imagen Docker
4. Iniciará los contenedores
5. Ejecutará migraciones de BD automáticamente

## Monitoreo

### Ver Logs

```bash
# En el VPS
dokploy logs -f absa-app-prod
```

### Verificar Salud

```bash
# Verificar que la app está corriendo
curl http://localhost:3000

# Verificar BD
docker exec absa-mysql-prod mysqladmin ping -h localhost -u root -p${DB_ROOT_PASSWORD}
```

## Actualizaciones

Cuando hagas push a GitHub:

1. Dokploy detectará automáticamente los cambios
2. Reconstruirá la imagen Docker
3. Desplegará la nueva versión
4. Ejecutará migraciones si es necesario

## Troubleshooting

### La app no inicia

```bash
# Ver logs detallados
docker logs absa-app-prod

# Verificar que la BD está lista
docker logs absa-mysql-prod
```

### Error de conexión a BD

```bash
# Verificar que MySQL está corriendo
docker ps | grep mysql

# Reiniciar MySQL
docker restart absa-mysql-prod
```

### Qdrant no disponible

```bash
# Iniciar Qdrant
docker run -d -p 6333:6333 qdrant/qdrant:latest

# O usar Qdrant Cloud: https://qdrant.io
```

## Backup de Base de Datos

```bash
# Backup manual
docker exec absa-mysql-prod mysqldump -u root -p${DB_ROOT_PASSWORD} absa_lms > backup.sql

# Restaurar
docker exec -i absa-mysql-prod mysql -u root -p${DB_ROOT_PASSWORD} absa_lms < backup.sql
```

## Escala y Optimización

### Aumentar recursos

En `docker-compose.prod.yml`, agrega limits:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Usar Reverse Proxy (Nginx)

```bash
# Instalar Nginx
apt-get install nginx

# Configurar proxy a http://localhost:3000
# Ver ejemplos en /etc/nginx/sites-available/
```

## Seguridad

1. **Cambiar contraseñas por defecto** en todas las variables de entorno
2. **Habilitar firewall** en el VPS
3. **Usar HTTPS** (Dokploy lo configura automáticamente)
4. **Mantener Docker actualizado**: `apt-get update && apt-get upgrade`
5. **Revisar logs regularmente** para detectar intentos de acceso no autorizados

## Próximos Pasos

1. **Configurar email**: Integrar SendGrid/Mailgun para enviar códigos de verificación reales
2. **Agregar CDN**: Usar Cloudflare para cachear assets estáticos
3. **Implementar CI/CD**: GitHub Actions para tests automáticos antes de deploy
4. **Monitoreo**: Configurar alertas con Sentry o similar

---

**Última actualización**: Enero 2026
