# Configuración de Dokploy con Dominio Personalizado

## Tu Configuración
- **Dominio**: `university.grupoabsa.ai`
- **Puerto**: `8082`
- **SSL**: Automático (Dokploy lo maneja)

## Cambios Necesarios en Variables de Entorno

### 1. **Dominio y Puerto**
```env
APP_DOMAIN=university.grupoabsa.ai
APP_PORT=8082
```

### 2. **URLs de OAuth (IMPORTANTE)**
Cuando configures OAuth en Manus, usa este Redirect URI:
```
https://university.grupoabsa.ai/api/oauth/callback
```

**NO uses:**
- `http://localhost:8082/api/oauth/callback`
- `http://tu-vps-ip:8082/api/oauth/callback`

### 3. **Variables Críticas a Actualizar**

| Variable | Valor Actual | Cambio Necesario |
|----------|-------------|------------------|
| `VITE_APP_ID` | `your_app_id` | Obtén de Manus Dashboard |
| `OWNER_OPEN_ID` | `your_owner_open_id` | Obtén de Manus Dashboard |
| `OWNER_NAME` | `Your Name` | Tu nombre real |
| `BUILT_IN_FORGE_API_KEY` | `your_forge_api_key` | Obtén de Manus Dashboard |
| `VITE_FRONTEND_FORGE_API_KEY` | `your_frontend_forge_api_key` | Obtén de Manus Dashboard |
| `JWT_SECRET` | `your_jwt_secret_key_change_this_in_production` | Genera uno seguro |
| `OPENAI_API_KEY` | `sk-your_openai_api_key_here` | Obtén de OpenAI |

### 4. **Generar JWT_SECRET Seguro**

En tu terminal local o VPS:
```bash
openssl rand -base64 32
```

Copia el resultado y úsalo como `JWT_SECRET`.

### 5. **Base de Datos**

La URL de conexión debe ser:
```env
DATABASE_URL=mysql://absa_user:absa_user_secure_password_change_me@db:3306/absa_lms
```

**Nota**: Si usas una base de datos externa (no Docker), cambia `db` por la IP/hostname de tu servidor MySQL.

## Pasos en Dokploy

### Paso 1: Configurar Variables de Entorno
1. En Dokploy, ve a tu aplicación
2. Haz clic en **Environment Variables**
3. Copia y pega TODAS las variables del archivo `.env.dokploy.production`
4. Actualiza los valores que dicen `your_*` con tus credenciales reales

### Paso 2: Configurar Dominio
1. Ve a **Ingress** o **Domains**
2. Agrega un nuevo dominio: `university.grupoabsa.ai`
3. Apunta al puerto: `8082`
4. Habilita SSL (Dokploy lo hace automáticamente con Let's Encrypt)

### Paso 3: Configurar DNS
En tu proveedor de dominio (GoDaddy, Namecheap, etc.):
1. Crea un registro `A` que apunte a la IP de tu VPS
   - **Nombre**: `university`
   - **Tipo**: `A`
   - **Valor**: `tu-vps-ip`

O si usas CNAME:
   - **Nombre**: `university`
   - **Tipo**: `CNAME`
   - **Valor**: `tu-vps-hostname.com`

### Paso 4: Hacer Deploy
1. En Dokploy, haz clic en **Deploy** o **Redeploy**
2. Espera a que termine (5-10 minutos)
3. Accede a `https://university.grupoabsa.ai`

## Verificación

### ✅ Checklist de Configuración
- [ ] Variables de entorno configuradas en Dokploy
- [ ] `VITE_APP_ID` obtenido de Manus Dashboard
- [ ] `OWNER_OPEN_ID` configurado
- [ ] `JWT_SECRET` generado y configurado
- [ ] `OPENAI_API_KEY` agregado
- [ ] Dominio `university.grupoabsa.ai` configurado en Dokploy
- [ ] DNS apunta a la IP de tu VPS
- [ ] SSL está habilitado (debería ser automático)
- [ ] Deploy completado sin errores

### Pruebas
1. Accede a `https://university.grupoabsa.ai`
2. Deberías ver la página de login
3. Intenta login con: `estudiante@absa.edu` y código `123456`
4. Si funciona, ¡está todo configurado correctamente!

## Solución de Problemas

### Error: "Connection refused"
- Verifica que el puerto 8082 esté abierto en el firewall
- Comprueba que el DNS está resolviendo correctamente

### Error: "SSL certificate error"
- Espera 5-10 minutos para que Let's Encrypt genere el certificado
- Recarga la página con `Ctrl+Shift+R` (hard refresh)

### Error: "OAuth redirect mismatch"
- Verifica que el Redirect URI en Manus sea exactamente: `https://university.grupoabsa.ai/api/oauth/callback`
- No olvides el `/api/oauth/callback` al final

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` sea correcto
- Si usas BD externa, asegúrate de que sea accesible desde el VPS

## Soporte

Si necesitas ayuda, revisa:
1. Los logs de Dokploy (botón Logs en la interfaz)
2. El archivo `DOKPLOY_SETUP.md` en el repositorio
3. La documentación de Dokploy: https://dokploy.com/docs
