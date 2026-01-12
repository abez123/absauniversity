# Guía de Deployment en Dokploy - Hostinger VPS

Esta guía te ayudará a desplegar ABSA UNIVERSITY en tu VPS de Hostinger usando Dokploy.

## 📋 Requisitos Previos

1. **VPS de Hostinger** con acceso SSH
2. **Dokploy** instalado en el VPS
3. **Git** configurado en el VPS
4. **Docker** instalado (Dokploy lo instala automáticamente)
5. **MySQL/MariaDB** disponible (puede ser local o administrado)

## 🚀 Pasos de Instalación

### 1. Instalar Dokploy en tu VPS

```bash
# Conectarse al VPS
ssh root@tu-vps-ip

# Descargar e instalar Dokploy
curl -sSL https://dokploy.com/install.sh | bash

# Dokploy estará disponible en: http://tu-vps-ip:3000
```

### 2. Clonar el Repositorio

```bash
# En tu VPS
cd /opt
git clone https://github.com/abez123/absauniversity.git
cd absauniversity
```

### 3. Configurar Variables de Entorno en Dokploy

En la interfaz de Dokploy, crea un nuevo proyecto y configura las siguientes variables de entorno usando la sintaxis `${}`:

#### Variables Requeridas

```
NODE_ENV=production
DATABASE_URL=mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Database
DB_HOST=tu-mysql-host
DB_PORT=3306
DB_NAME=absa_lms
DB_USER=absa_user
DB_PASSWORD=tu-contraseña-segura

# JWT Secret (genera uno seguro)
JWT_SECRET=tu-jwt-secret-muy-largo-y-seguro

# OAuth (si usas Manus)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_APP_ID=tu-app-id

# Owner Info
OWNER_NAME=ABSA Administrator
OWNER_OPEN_ID=tu-owner-id

# Branding
VITE_APP_TITLE=ABSA UNIVERSITY
VITE_APP_LOGO=/logo-absa.png

# APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=tu-api-key

VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=tu-frontend-api-key

# Analytics (opcional)
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

### 4. Configurar Base de Datos

#### Opción A: MySQL Local en Docker

Si quieres ejecutar MySQL en el mismo VPS:

```bash
# En el VPS, crear un contenedor MySQL
docker run -d \
  --name absa-mysql \
  -e MYSQL_ROOT_PASSWORD=root-password \
  -e MYSQL_DATABASE=absa_lms \
  -e MYSQL_USER=absa_user \
  -e MYSQL_PASSWORD=absa-password \
  -p 3306:3306 \
  -v mysql-data:/var/lib/mysql \
  mysql:8.0
```

#### Opción B: MySQL Administrado de Hostinger

Si usas la BD administrada de Hostinger:

1. Crea una base de datos en el panel de Hostinger
2. Obtén las credenciales
3. Usa esas credenciales en las variables de entorno

### 5. Crear la Aplicación en Dokploy

1. Accede a la interfaz de Dokploy: `http://tu-vps-ip:3000`
2. Haz clic en "Crear Proyecto"
3. Selecciona "Docker"
4. Configura:
   - **Nombre**: absa-university
   - **Dockerfile**: Usa el Dockerfile del proyecto
   - **Puerto**: 3000
   - **Dominio**: tu-dominio.com (opcional)

### 6. Configurar SSL/HTTPS

En Dokploy:

1. Ve a "Configuración" → "Dominios"
2. Agrega tu dominio
3. Dokploy configurará automáticamente Let's Encrypt

### 7. Ejecutar Migraciones de BD

Antes del primer deploy, ejecuta las migraciones:

```bash
# En el contenedor
docker exec absa-lms bun run db:push
```

O en Dokploy, agrega un hook de pre-inicio:

```bash
bun run db:push
```

### 8. Deploy

```bash
# En Dokploy, haz clic en "Deploy"
# O desde CLI:
dokploy deploy --project absa-university
```

## 🔧 Configuración Avanzada

### Variables de Entorno en Dokploy

Dokploy usa la sintaxis `${}` para variables:

```yaml
DATABASE_URL: mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
```

Esto se expande automáticamente cuando defines:
- `DB_USER=absa_user`
- `DB_PASSWORD=secure-password`
- `DB_HOST=mysql.example.com`
- `DB_PORT=3306`
- `DB_NAME=absa_lms`

### Health Check

El Dockerfile incluye un health check automático. Dokploy lo usará para monitorear la aplicación.

### Logs

Ver logs en Dokploy:

```bash
# O desde SSH
docker logs -f absa-lms
```

## 📊 Monitoreo

### CPU y Memoria

Dokploy proporciona métricas en tiempo real. Recomendaciones:

- **CPU**: 1-2 cores
- **RAM**: 1-2 GB
- **Almacenamiento**: 20 GB mínimo

### Backups

Configura backups automáticos de la BD:

```bash
# Script de backup
docker exec absa-mysql mysqldump -u absa_user -p absa_lms > backup.sql
```

## 🆘 Solución de Problemas

### Aplicación no inicia

```bash
# Ver logs
docker logs absa-lms

# Verificar variables de entorno
docker inspect absa-lms | grep -A 20 Env
```

### Error de conexión a BD

```bash
# Verificar conectividad
docker exec absa-lms mysql -h ${DB_HOST} -u ${DB_USER} -p${DB_PASSWORD} -e "SELECT 1"
```

### Puerto ya en uso

```bash
# Cambiar puerto en Dokploy
# O liberar el puerto:
lsof -i :3000
kill -9 <PID>
```

## 📝 Mantenimiento

### Actualizar Aplicación

```bash
# Pull cambios
git pull origin main

# Redeploy
dokploy deploy --project absa-university
```

### Actualizar Dependencias

```bash
# En el VPS
bun update
git commit -am "Update dependencies"
git push origin main

# Redeploy
dokploy deploy --project absa-university
```

## 🔐 Seguridad

### Cambiar JWT Secret

1. Genera un nuevo secret: `openssl rand -base64 32`
2. Actualiza en Dokploy
3. Redeploy

### Credenciales de BD

- Usa contraseñas fuertes (mínimo 16 caracteres)
- Cambia regularmente
- Usa variables de entorno, nunca hardcodes

### Firewall

```bash
# Permitir solo puertos necesarios
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

## 📞 Soporte

Para problemas:

1. Revisa los logs de Dokploy
2. Verifica las variables de entorno
3. Consulta la documentación de Dokploy: https://dokploy.com/docs
4. Abre un issue en GitHub: https://github.com/abez123/absauniversity/issues

---

**Última actualización**: Enero 2026
**Versión**: 1.0.0
