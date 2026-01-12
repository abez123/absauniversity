# ABSA University - Setup Self-Hosted (Sin Manus)

Esta guía te ayuda a desplegar ABSA University completamente en tu Docker instance sin dependencias de Manus.

## Servicios Incluidos

| Servicio | Propósito | Puerto | Acceso |
|----------|-----------|--------|--------|
| **MySQL** | Base de datos | 3306 | Interno |
| **Ollama** | LLM local (IA) | 11434 | Interno |
| **Qdrant** | Vector DB (RAG) | 6333 | http://localhost:6333 |
| **MinIO** | Almacenamiento S3 | 9000/9001 | http://localhost:9001 |
| **Mailhog** | Email testing | 8025 | http://localhost:8025 |
| **Redis** | Caché | 6379 | Interno |
| **ABSA App** | Aplicación | 8082 | http://localhost:8082 |

## Requisitos Previos

- Docker y Docker Compose instalados
- Mínimo 8GB RAM (para Ollama)
- 30GB espacio en disco (para modelos de IA)
- Puerto 8082 disponible

## Paso 1: Clonar Repositorio

```bash
git clone https://github.com/abez123/absauniversity.git
cd absauniversity
```

## Paso 2: Configurar Variables de Entorno

```bash
# Copia el archivo de configuración self-hosted
cp .env.dokploy.self-hosted .env

# Edita el archivo .env con tus valores
nano .env
```

**Variables Críticas a Actualizar:**

```env
DB_ROOT_PASSWORD=tu_contraseña_segura
DB_PASSWORD=tu_contraseña_segura
JWT_SECRET=tu_jwt_secret_seguro
VITE_APP_TITLE=ABSA UNIVERSITY
```

Genera un JWT_SECRET seguro:
```bash
openssl rand -base64 32
```

## Paso 3: Iniciar Servicios

```bash
# Inicia todos los servicios
docker-compose -f docker-compose.self-hosted.yml up -d

# Verifica que todo está corriendo
docker-compose -f docker-compose.self-hosted.yml ps
```

Espera 2-3 minutos para que todos los servicios estén listos.

## Paso 4: Descargar Modelo de IA (Ollama)

```bash
# Descarga el modelo Mistral (recomendado)
docker exec absa-ollama ollama pull mistral

# O descarga Llama 2 (más pesado pero más potente)
# docker exec absa-ollama ollama pull llama2

# Verifica que se descargó
docker exec absa-ollama ollama list
```

**Tiempo estimado**: 5-15 minutos según tu conexión.

## Paso 5: Crear Bucket en MinIO

```bash
# Accede a MinIO y crea el bucket
docker exec absa-minio mc mb minio/absa-lms

# Verifica
docker exec absa-minio mc ls minio/
```

## Paso 6: Verificar Servicios

### Qdrant
```bash
curl http://localhost:6333/health
# Respuesta: {"status":"ok"}
```

### MinIO
```bash
# Accede a: http://localhost:9001
# Usuario: minioadmin
# Contraseña: minioadmin
```

### Mailhog
```bash
# Accede a: http://localhost:8025
# Aquí verás todos los emails enviados
```

### Ollama
```bash
curl http://localhost:11434/api/tags
# Verifica que tu modelo está listado
```

## Paso 7: Acceder a la Aplicación

```bash
# Abre en tu navegador
http://localhost:8082
```

**Credenciales de Prueba:**
- Email: `estudiante@absa.edu`
- Código: `123456`

## Configuración de Producción

### 1. Cambiar Contraseñas

En `.env`, actualiza:
```env
DB_ROOT_PASSWORD=contraseña_muy_segura_aqui
DB_PASSWORD=otra_contraseña_segura_aqui
MINIO_ACCESS_KEY=tu_minio_key_segura
MINIO_SECRET_KEY=tu_minio_secret_segura
JWT_SECRET=tu_jwt_muy_seguro
```

### 2. Configurar Email Real

Reemplaza Mailhog con tu servidor SMTP:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=tu-servidor-smtp.com
SMTP_PORT=587
SMTP_USER=tu-usuario@example.com
SMTP_PASSWORD=tu-contraseña
SMTP_FROM_EMAIL=noreply@university.grupoabsa.ai
```

### 3. Usar Dominio Personalizado

Configura Nginx como reverse proxy:

```bash
# Edita nginx.conf
nano nginx.conf

# Reinicia Nginx
docker-compose -f docker-compose.self-hosted.yml restart nginx
```

### 4. Habilitar SSL

```bash
# Genera certificados Let's Encrypt
certbot certonly --standalone -d university.grupoabsa.ai

# Copia los certificados a ./ssl/
cp /etc/letsencrypt/live/university.grupoabsa.ai/fullchain.pem ./ssl/
cp /etc/letsencrypt/live/university.grupoabsa.ai/privkey.pem ./ssl/

# Reinicia Nginx
docker-compose -f docker-compose.self-hosted.yml restart nginx
```

## Mantenimiento

### Backup de Base de Datos

```bash
# Backup MySQL
docker exec absa-mysql mysqldump -u absa_user -p absa_lms > backup.sql

# Restore
docker exec -i absa-mysql mysql -u absa_user -p absa_lms < backup.sql
```

### Backup de MinIO

```bash
# Descarga todos los archivos
docker exec absa-minio mc mirror minio/absa-lms ./backup/
```

### Actualizar Aplicación

```bash
# Descarga cambios
git pull origin main

# Rebuild
docker-compose -f docker-compose.self-hosted.yml build --no-cache app

# Reinicia
docker-compose -f docker-compose.self-hosted.yml up -d app
```

### Ver Logs

```bash
# Todos los servicios
docker-compose -f docker-compose.self-hosted.yml logs -f

# Solo la app
docker-compose -f docker-compose.self-hosted.yml logs -f app

# Solo Ollama
docker-compose -f docker-compose.self-hosted.yml logs -f ollama
```

## Solución de Problemas

### Error: "Port already in use"
```bash
# Cambia el puerto en .env
APP_PORT=8083

# O libera el puerto
lsof -i :8082
kill -9 <PID>
```

### Ollama no descarga modelo
```bash
# Aumenta timeout y reinicia
docker-compose -f docker-compose.self-hosted.yml restart ollama

# Intenta nuevamente
docker exec absa-ollama ollama pull mistral
```

### MinIO no crea bucket
```bash
# Verifica credenciales
docker logs absa-minio

# Intenta manualmente
docker exec absa-minio mc ls minio/
```

### App no conecta a BD
```bash
# Verifica que MySQL está corriendo
docker-compose -f docker-compose.self-hosted.yml ps db

# Verifica logs
docker-compose -f docker-compose.self-hosted.yml logs db
```

### Qdrant no responde
```bash
# Reinicia Qdrant
docker-compose -f docker-compose.self-hosted.yml restart qdrant

# Verifica salud
curl http://localhost:6333/health
```

## Optimizaciones

### Para Producción

1. **Aumenta recursos de Ollama**
   ```yaml
   # En docker-compose.self-hosted.yml
   ollama:
     deploy:
       resources:
         limits:
           cpus: '4'
           memory: 8G
   ```

2. **Usa modelo más pequeño si RAM es limitada**
   ```bash
   docker exec absa-ollama ollama pull orca-mini
   ```

3. **Habilita compresión en Nginx**
   ```nginx
   gzip on;
   gzip_types text/plain application/json;
   ```

4. **Configura backups automáticos**
   ```bash
   # Cron job para backup diario
   0 2 * * * cd /path/to/absauniversity && docker exec absa-mysql mysqldump -u absa_user -p absa_lms > backups/backup-$(date +\%Y\%m\%d).sql
   ```

## Monitoreo

### Usar Portainer (UI para Docker)

```bash
docker run -d -p 8000:8000 -p 9000:9000 \
  --name=portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# Accede a: http://localhost:9000
```

### Usar Prometheus + Grafana

```bash
# Agrega a docker-compose.self-hosted.yml
prometheus:
  image: prom/prometheus:latest
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana:latest
  ports:
    - "3000:3000"
```

## Soporte

Si necesitas ayuda:

1. Revisa los logs: `docker-compose -f docker-compose.self-hosted.yml logs -f`
2. Verifica que todos los servicios estén corriendo: `docker-compose -f docker-compose.self-hosted.yml ps`
3. Abre un issue en GitHub: https://github.com/abez123/absauniversity/issues

## Próximos Pasos

1. **Crear Cursos**: Accede como admin y crea cursos de prueba
2. **Configurar Email Real**: Reemplaza Mailhog con tu servidor SMTP
3. **Habilitar SSL**: Configura certificados Let's Encrypt
4. **Monitorear**: Instala Portainer o Prometheus + Grafana
5. **Hacer Backup**: Configura backups automáticos
