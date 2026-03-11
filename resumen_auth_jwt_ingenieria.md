# Sistema de Autenticación JWT Full Stack
### *React + Express + Prisma 6 + NeonDB — Análisis técnico desde fundamentos universitarios*

> **Proyecto:** NebulaWear — Mini e-commerce con autenticación  
> **Stack:** React (Vite) · Zustand · Axios · Node.js 20 · Express 5 · Prisma 6 · PostgreSQL (NeonDB)  
> **Fecha:** Febrero 2026 | **Autor:** Mijael  
> **Documento anterior:** `resumen_fullstack_ingenieria.md`

---

## Tabla de Contenidos

1. [Qué se construyó: Vista General del Sistema](#1-qué-se-construyó-vista-general-del-sistema)
2. [Modelo Relacional: Las tres tablas y sus relaciones](#2-modelo-relacional-las-tres-tablas-y-sus-relaciones)
3. [Criptografía Aplicada: bcrypt y el problema del almacenamiento de contraseñas](#3-criptografía-aplicada-bcrypt-y-el-problema-del-almacenamiento-de-contraseñas)
4. [JWT: Autenticación sin Estado (Stateless)](#4-jwt-autenticación-sin-estado-stateless)
5. [La Arquitectura Dual de Tokens: Access + Refresh](#5-la-arquitectura-dual-de-tokens-access--refresh)
6. [Flujo Completo del Sistema de Sesiones](#6-flujo-completo-del-sistema-de-sesiones)
7. [Seguridad en Capas: Defensa en Profundidad](#7-seguridad-en-capas-defensa-en-profundidad)
8. [Estado Persistente en el Frontend: Zustand + localStorage](#8-estado-persistente-en-el-frontend-zustand--localstorage)
9. [El Problema de las Cookies HttpOnly y CORS con Credenciales](#9-el-problema-de-las-cookies-httponly-y-cors-con-credenciales)
10. [Patrones de Diseño en el Sistema de Auth](#10-patrones-de-diseño-en-el-sistema-de-auth)
11. [Análisis de Seguridad: Vectores de Ataque y Mitigaciones](#11-análisis-de-seguridad-vectores-de-ataque-y-mitigaciones)
12. [Reflexión: Qué mejoraría un sistema en producción real](#12-reflexión-qué-mejoraría-un-sistema-en-producción-real)

---

## 1. Qué se construyó: Vista General del Sistema

### 1.1 Arquitectura del sistema completo

```
┌──────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React + Vite)                       │
│                                                                      │
│  ┌────────────┐  ┌────────────────┐  ┌──────────────────────────┐  │
│  │ authStore  │  │  authService   │  │  Páginas                 │  │
│  │ (Zustand)  │  │  (Axios)       │  │  /login  /register       │  │
│  │            │  │                │  │  /cart   /products       │  │
│  │ user       │  │ withCredentials│  │                          │  │
│  │ accessToken│  │ → envía cookie │  │  Nav.jsx: estado UI      │  │
│  │            │  │   automática   │  │  App.jsx: refresh init   │  │
│  │ persist    │  └────────────────┘  └──────────────────────────┘  │
│  │ localStorage│                                                     │
│  └────────────┘                                                      │
└──────────────────────────────────────┬───────────────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │ POST /auth/login       │ POST /auth/refresh      │
              │ Authorization: Bearer  │ Cookie: refreshToken    │
              └────────────────────────┼────────────────────────┘
                                       │ HTTP/1.1 + TLS
┌──────────────────────────────────────▼───────────────────────────────┐
│                     EXPRESS 5 (Node.js 20 — Puerto 3001)             │
│                                                                      │
│  helmet()  →  cors(credentials)  →  cookieParser()  →  Router       │
│                                                                      │
│  /auth/register  [express-validator] → bcrypt.hash() → Prisma       │
│  /auth/login     [loginLimiter]      → bcrypt.compare() → JWT       │
│  /auth/refresh   [cookie lectura]    → BD check → nuevo accessToken  │
│  /auth/logout    [cookie borrado]    → BD delete → clearCookie       │
│                                                                      │
│  /compras  [protect middleware] → JWT verify → prisma.create()       │
│                                                                      │
│  Middleware: protect(req,res,next) → jwt.verify(JWT_SECRET)         │
│  Error Handler: (err,req,res,next) → P2002 → Winston log            │
└──────────────────────────────────────┬───────────────────────────────┘
                                       │
                              TCP/TLS + PostgreSQL Wire Protocol
                                       │
┌──────────────────────────────────────▼───────────────────────────────┐
│                        NeonDB (PostgreSQL 16)                        │
│                        AWS sa-east-1 + pgBouncer                     │
│                                                                      │
│  tabla: User          tabla: RefreshToken     tabla: Compra          │
│  id, name, email      id, token, userId(FK)   id, usuario, total     │
│  passwordHash         createdAt               fecha                  │
│  createdAt                                                           │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 Nuevas dependencias del backend y su propósito

| Librería | Versión | Propósito técnico |
|----------|---------|------------------|
| `bcryptjs` | ^3.0.3 | Hash de contraseñas con salt adaptativo (algoritmo bcrypt) |
| `jsonwebtoken` | ^9.0.3 | Creación y verificación de tokens JWT (HMAC-SHA256) |
| `cookie-parser` | ^1.4.7 | Deserializa la cookie `refreshToken` del header HTTP |
| `helmet` | ^8.1.0 | Establece ~15 headers HTTP de seguridad automáticamente |
| `express-rate-limit` | ^8.2.1 | Throttling por IP — ventana deslizante: 5 req / 15 min |
| `express-validator` | ^7.3.1 | Cadena de validación y sanitización en el middleware |

---

## 2. Modelo Relacional: Las tres tablas y sus relaciones

### 2.1 Del Diagrama ER al Schema Prisma real

Lo que estudiaste en **Base de Datos I y II** como entidad-relación se expresa directamente en tu `prisma/schema.prisma`:

```prisma
model User {
  id            Int            @id @default(autoincrement())
  name          String
  email         String         @unique         // → UNIQUE CONSTRAINT en PostgreSQL
  passwordHash  String                          // NUNCA guardamos la contraseña plana
  createdAt     DateTime       @default(now())
  refreshTokens RefreshToken[]                  // relación 1:N → un User tiene muchos tokens
}

model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int                                  // Clave foránea
  user      User     @relation(
              fields: [userId],
              references: [id],
              onDelete: Cascade                  // Si el User se borra → tokens se borran en cascada
            )
  createdAt DateTime @default(now())
}

model Compra {
  id      Int      @id @default(autoincrement())
  usuario String
  total   Float
  fecha   DateTime @default(now())
}
```

### 2.2 SQL generado por `prisma db push`

Prisma traduce el schema a DDL ejecutado contra NeonDB:

```sql
CREATE TABLE "User" (
  "id"           SERIAL PRIMARY KEY,
  "name"         TEXT NOT NULL,
  "email"        TEXT NOT NULL UNIQUE,    -- UNIQUE INDEX implícito
  "passwordHash" TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "RefreshToken" (
  "id"        SERIAL PRIMARY KEY,
  "token"     TEXT NOT NULL UNIQUE,
  "userId"    INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RefreshToken_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User"("id")
    ON DELETE CASCADE          -- Integridad referencial garantizada
    ON UPDATE CASCADE
);
```

### 2.3 La relación 1:N y por qué es necesaria

```
Un User puede tener MUCHOS RefreshTokens

 User ──────────────────────────────┐
  id=1, email="mijael@..."          │
        │                           │
        ├── RefreshToken (id=1) ────┤  Session desde Chrome en Windows
        ├── RefreshToken (id=2) ────┤  Session desde Firefox en celular
        └── RefreshToken (id=3) ────┘  Session desde otro dispositivo
```

Esta relación permite **sesiones múltiples simultáneas** (multi-device). Cada dispositivo tiene su propio refresh token activo. Al hacer logout, solo se elimina el token de ese dispositivo — las otras sesiones se mantienen. Esto es exactamente el modelo que usan Gmail, GitHub, etc.

---

## 3. Criptografía Aplicada: bcrypt y el problema del almacenamiento de contraseñas

### 3.1 Por qué NUNCA se guarda la contraseña en texto plano

Este es uno de los problemas fundamentales de seguridad en sistemas de información that se cruza con **Base de Datos II** (integridad de datos) y teoría de seguridad.

Si la base de datos es comprometida (SQL Injection, backup expuesto, empleado malicioso), y las contraseñas están en texto plano:
- El atacante tiene **acceso inmediato** a todas las cuentas
- Los usuarios reutilizan contraseñas → compromete otras plataformas
- Violación legal (RGPD, PCI-DSS, etc.)

### 3.2 Cómo funciona bcrypt

```
REGISTRO:
password = "miClave123"
         │
         ▼
bcrypt.hash(password, 10)
         │
         ├── Genera un salt aleatorio de 128 bits
         │   salt = "$2a$10$N9qo8uLOickgx2ZMRZoMyO"  (22 caracteres base64)
         │
         ├── Aplica la función Blowfish derivada:
         │   for (i = 0; i < 2^10; i++) { // 2^saltRounds = 1024 iteraciones
         │     hash = blowfish(hash, salt)
         │   }
         │
         ▼
passwordHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeRnpBXnMfJaRIGiXU0JGHv9..."
               ├──┤ ├─┤ ├──────────────────────────────────────────────┤
              alg cost       salt (22c) + hash (31c)
```

La función bcrypt es **deliberadamente lenta** (el `cost factor` = 10 significa 2^10 = 1024 iteraciones). Esto es intencional:
- Una GPU moderna puede probar **10 mil millones** de hashes MD5/SHA por segundo
- Con bcrypt (cost=10) puede probar ~**100 hashes por segundo**
- Esto hace los ataques de fuerza bruta computacionalmente inviables a escala

### 3.3 El proceso de verificación

```javascript
// En authRoutes.js → POST /auth/login
const passwordMatch = await bcrypt.compare(password, user.passwordHash);
//                                ↑                        ↑
//                          texto plano del               hash guardado en BD
//                          request actual

// bcrypt extrae el salt del hash guardado,
// aplica la misma función con ese salt,
// compara el resultado → true/false
// SIN necesidad de "desencriptar" (el hash es irreversible)
```

Este es el principio de las **funciones hash criptográficas** (one-way functions): fáciles de computar en una dirección, computacionalmente imposibles de invertir. Concepto central en **Matemática Discreta** y teoría de la computación.

---

## 4. JWT: Autenticación sin Estado (Stateless)

### 4.1 Estructura de un JWT

Un JWT (JSON Web Token — RFC 7519) es una cadena de texto con tres partes separadas por puntos:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.
eyJpZCI6MSwiZW1haWwiOiJtaWphZWxAZ21haWwuY29tIiwiaWF0IjoxNzQwNTI2MDAwLCJleHAiOjE3NDA1MjY5MDB9
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
│──────────────────┤ │──────────────────────────────────────────────────────────────────┤ │───────────────────────────────┤
      HEADER                                    PAYLOAD                                          SIGNATURE
 (base64url)                                 (base64url)                                       (HMAC-SHA256)
```

**Decodificado:**

```json
// HEADER
{ "alg": "HS256", "typ": "JWT" }

// PAYLOAD (lo que definimos en generateAccessToken)
{
  "id": 1,
  "email": "mijael@gmail.com",
  "iat": 1740526000,  // issued at (Unix timestamp)
  "exp": 1740526900   // expires at: iat + 15 minutos = 900 segundos
}

// SIGNATURE
HMAC-SHA256(
  base64url(header) + "." + base64url(payload),
  JWT_SECRET               // ← La clave secreta solo el servidor conoce
)
```

### 4.2 Verificación sin consultar la base de datos

Aquí está la propiedad más importante de JWT: el servidor puede **verificar la autenticidad del token sin ninguna consulta a la base de datos**:

```javascript
// En authMiddleware.js:
const payload = jwt.verify(token, process.env.JWT_SECRET);
//                   ↑               ↑
//           Solo recalcula        La misma clave
//           la firma HMAC         con la que se firmó

// Si alguien modifica el payload (cambiar "id": 1 → "id": 999):
// → La firma ya no coincide → jwt.verify() lanza JsonWebTokenError
// → 401 Unauthorized
```

Esta es la diferencia fundamental entre **autenticación stateless** (JWT) y **stateful** (sessions con cookies de sesión):

```
STATEFUL (Sessions tradicionales):
  Client → servidor: "Soy el usuario de sesión X"
  Servidor → BD: SELECT * FROM sessions WHERE id = X   ← Consulta obligatoria
  BD → Servidor: { userId: 1, expiry: ... }

STATELESS (JWT):
  Client → servidor: Bearer eyJ... (token firmado)
  Servidor: recalcula HMAC, compara firma    ← Sin BD, O(1)
  Si coincide → usuario autenticado
```

La autenticación stateless escala horizontalmente sin sesiones compartidas: cualquier instancia del servidor puede verificar cualquier token sin coordinación.

---

## 5. La Arquitectura Dual de Tokens: Access + Refresh

### 5.1 El problema que resuelve

Si el JWT Access Token tuviera una expiración muy larga (ej. 30 días), el sistema sería inseguro: si alguien roba el token, tiene acceso durante 30 días sin posibilidad de revocarlo (JWT es stateless — no se puede "invalidar" un token sin consultar la BD).

Si tuviera expiración muy corta (ej. 5 minutos), el usuario tendría que hacer login cada 5 minutos — terrible UX.

**Solución:** arquitectura de dos tokens con propiedades distintas:

```
ACCESS TOKEN  ─────────────────────────────────────────────┐
  Firmado con: JWT_SECRET                                   │
  Expiración:  15 minutos                                   │
  Almacenado:  Zustand (memoria RAM del browser)            │
  Se envía en: Authorization: Bearer <token>               │
  Verificación: stateless (sin BD)                         │
  Si robado:   acceso máximo 15 minutos                    │
                                                           │
REFRESH TOKEN ─────────────────────────────────────────────┤
  Firmado con: REFRESH_SECRET (diferente al JWT_SECRET)    │
  Expiración:  7 días                                      │
  Almacenado:  Cookie HttpOnly (no accesible desde JS)     │
  Se envía en: Cookie automática                           │
  Verificación: stateful (requiere BD → tabla RefreshToken)│
  Si robado:   se puede revocar borrando de la BD          │
```

### 5.2 El flujo de renovación silenciosa

```
Usuario abre el browser (F5 / nueva pestaña):

App.jsx useEffect:
  │
  ├── ¿Hay accessToken en Zustand/localStorage?
  │        │
  │        ├── NO → POST /auth/refresh (el browser envía cookie automáticamente)
  │        │          │
  │        │          ├── Backend verifica cookie y BD
  │        │          ├── Si válido → devuelve nuevo accessToken (15min)
  │        │          ├── setToken(nuevoToken) → Zustand actualiza
  │        │          └── Si inválido → logout() → limpia estado
  │        │
  │        └── SÍ → ¿Expiró? (lo verifica cart.jsx/axios interceptor)
  │                     └── 401 → redirige a /login
  │
  └── Usuario navega normalmente con el accessToken vigente
```

Este patrón se llama **Token Rotation** o **Silent Refresh** y es el estándar de la industria (lo usa OAuth 2.0).

---

## 6. Flujo Completo del Sistema de Sesiones

### 6.1 REGISTRO

```
Browser                     Express                      NeonDB
  │                            │                            │
  │── POST /auth/register ────►│                            │
  │   { name, email, password }│                            │
  │                            │── express-validator ──────►│ (no BD aún)
  │                            │   ✓ email válido           │
  │                            │   ✓ password ≥ 6 chars     │
  │                            │                            │
  │                            │── findUnique({ email }) ──►│
  │                            │◄── null (no existe) ───────│
  │                            │                            │
  │                            │── bcrypt.hash(pass, 10) ──►│ (CPU, ~100ms)
  │                            │                            │
  │                            │── prisma.user.create() ───►│
  │                            │                            │── INSERT INTO "User"...
  │                            │◄── { id: 1, name, email } ─│
  │                            │                            │
  │◄── 201 { message, userId } │                            │
```

### 6.2 LOGIN

```
Browser                     Express                      NeonDB
  │                            │                            │
  │── POST /auth/login ───────►│                            │
  │   { email, password }      │── loginLimiter check ──────│ (en memoria Express)
  │                            │   Máx 5 req / 15min por IP │
  │                            │                            │
  │                            │── findUnique({ email }) ──►│
  │                            │◄── User { passwordHash }───│
  │                            │                            │
  │                            │── bcrypt.compare() ────────│ (CPU, ~100ms)
  │                            │   password vs passwordHash │
  │                            │                            │
  │                            │── jwt.sign(payload, JWT_SECRET, 15m)
  │                            │── jwt.sign(payload, REFRESH_SECRET, 7d)
  │                            │                            │
  │                            │── prisma.refreshToken.create()──►│
  │                            │   { token, userId }        │── INSERT INTO "RefreshToken"...
  │                            │◄───────────────────────────│
  │                            │                            │
  │◄── 200 Set-Cookie: refreshToken=... (HttpOnly, 7d) ─────│
  │        { accessToken, user: {id, name, email} }         │
  │                            │                            │
  │ authStore.setAuth(user, accessToken)  → Zustand + localStorage
```

### 6.3 PETICIÓN PROTEGIDA (Comprar)

```
Browser                     Express                      NeonDB
  │                            │                            │
  │── POST /compras ──────────►│                            │
  │   Authorization: Bearer eyJ...
  │   { usuario, total }       │                            │
  │                            │── protect middleware ───────│
  │                            │   jwt.verify(token, JWT_SECRET)
  │                            │   → payload = { id: 1, email }
  │                            │   → req.user = { id: 1, email }
  │                            │   → next()                 │
  │                            │                            │
  │                            │── prisma.compra.create() ─►│
  │                            │◄── nuevaCompra ────────────│
  │◄── 200 { nuevaCompra } ───│                            │
```

### 6.4 LOGOUT

```
Browser                     Express                      NeonDB
  │                            │                            │
  │── POST /auth/logout ──────►│                            │
  │   Cookie: refreshToken=... │                            │
  │   (enviada automáticamente)│                            │
  │                            │── req.cookies.refreshToken │
  │                            │── prisma.refreshToken.deleteMany()──►│
  │                            │   { where: { token } }     │── DELETE FROM "RefreshToken"...
  │                            │◄───────────────────────────│
  │                            │── res.clearCookie("refreshToken")
  │◄── 200 { message } ───────│                            │
  │                            │                            │
  │ authStore.logout()  → user=null, accessToken=null → localStorage limpio
  │ navigate('/login')
```

---

## 7. Seguridad en Capas: Defensa en Profundidad

Este sistema implementa el principio de **Defense in Depth** — múltiples capas de seguridad independientes, de modo que si una falla, las otras contienen el daño.

### 7.1 Capa 1: helmet() — Headers HTTP de Seguridad

```javascript
app.use(helmet());
```

`helmet` configura automáticamente estos headers en cada respuesta:

| Header | Valor | Protege contra |
|--------|-------|----------------|
| `X-Content-Type-Options` | `nosniff` | MIME-type sniffing attacks |
| `X-Frame-Options` | `DENY` | Clickjacking (iframes maliciosos) |
| `Strict-Transport-Security` | `max-age=15552000` | Downgrade attacks (HTTP forzado) |
| `Content-Security-Policy` | restringida | XSS via scripts externos |
| `X-XSS-Protection` | `0` (desactivado en favor de CSP) | XSS legacy |

Desde la perspectiva de **Redes y Comunicación de Datos**: estos son controles a nivel de **capa de aplicación** (OSI Layer 7) que restringen el comportamiento del browser cliente.

### 7.2 Capa 2: CORS Restrictivo

```javascript
app.use(cors({
  origin: "http://localhost:5173",  // solo el frontend propio
  credentials: true,               // necesario para cookies
}));
```

En producción, `origin` se restringe al dominio del frontend. Esto evita que otros sitios web hagan peticiones a tu API desde el browser de un usuario autenticado (ataque CSRF).

### 7.3 Capa 3: Rate Limiting

```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // ventana de 15 minutos
  max: 5,                      // máximo 5 intentos por IP
});
```

Implementa la **ventana deslizante** (*sliding window*) para throttling. Es un algoritmo de control de flujo análogo al **control de congestión TCP** de redes:

```
IP: 192.168.1.50
Tiempo: t=0      → Intento 1 ✅ (contador: 1/5)
Tiempo: t=10s    → Intento 2 ✅ (contador: 2/5)
Tiempo: t=20s    → Intento 3 ✅ (contador: 3/5)
Tiempo: t=30s    → Intento 4 ✅ (contador: 4/5)
Tiempo: t=40s    → Intento 5 ✅ (contador: 5/5)
Tiempo: t=50s    → Intento 6 ❌ 429 Too Many Requests
                              (hasta t = 15 min desde el primer intento)
```

### 7.4 Capa 4: Cookie HttpOnly

```javascript
const COOKIE_OPTIONS = {
  httpOnly: true,      // JavaScript del browser NO puede acceder
  sameSite: "Strict",  // No se envía en navegación cross-site
  maxAge: 7 * 24 * 60 * 60 * 1000,
  // secure: true  ← en producción: solo sobre HTTPS
};
```

`httpOnly: true` significa que `document.cookie` en el browser **no puede leer** esta cookie. Un script XSS que se inyecte en la página no puede robar el refresh token. Es invisible para JavaScript — solo el browser la envía automáticamente en las peticiones HTTP.

### 7.5 Capa 5: Validación en el Servidor

```javascript
body("email").isEmail().normalizeEmail()
body("password").isLength({ min: 6 })
body("name").trim().notEmpty()
```

**Regla cardinal de seguridad:** nunca confíes en la validación del cliente. Toda validación del frontend es bypasseable (Burp Suite, curl, Postman). La validación del servidor con `express-validator` es la única que cuenta.

---

## 8. Estado Persistente en el Frontend: Zustand + localStorage

### 8.1 El problema que resuelve persist

Sin `persist`, al hacer F5 (recarga):
- React se re-monta desde cero
- Zustand inicializa con `user: null, accessToken: null`
- El usuario parece "deslogueado" aunque la cookie siga válida

```javascript
const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth:  (user, accessToken) => set({ user, accessToken }),
      setToken: (accessToken)       => set({ accessToken }),
      logout:   ()                  => set({ user: null, accessToken: null }),
    }),
    { name: 'auth-storage' }  // Clave en localStorage
  )
);
```

El middleware `persist` de Zustand serializa el estado a JSON y lo guarda en `localStorage['auth-storage']`. Al recargar, **rehidrata** el store antes del primer render.

### 8.2 Lo que se guarda y lo que no

```
localStorage['auth-storage']:
{
  "state": {
    "user": { "id": 1, "name": "Mijael", "email": "mijael@..." },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "version": 0
}
```

**Importante:** el `accessToken` en localStorage es accesible desde JavaScript (a diferencia de la cookie HttpOnly). Esto lo hace teóricamente vulnerable a XSS. Por eso el `accessToken` tiene duración corta (15 min) — minimiza la ventana de exposición. El `refreshToken` (7 días) está protegido en cookie HttpOnly.

### 8.3 El ciclo de vida del estado de auth

```
App monta (F5):
  Zustand lee localStorage → user = "Mijael", accessToken = "eyJ..."
  useEffect en App.jsx:
    if (!accessToken) → /auth/refresh   [si expiró o no hay token]
    else → no hace nada    [el token puede aún ser válido]

Usuario interactúa:
  POST /compras → Authorization: Bearer eyJ... → protect → ✅

Token expira (15 min pasan):
  POST /compras → 401 → cart.jsx navega a /login
  (ideal: interceptor axios que automáticamente llame /refresh)

Logout:
  logoutUser() → /auth/logout → BD borra token → clearCookie
  authStore.logout() → localStorage se limpia
  navigate('/login')
```

---

## 9. El Problema de las Cookies HttpOnly y CORS con Credenciales

### 9.1 Por qué se necesita `withCredentials: true`

Por defecto, el browser aplica la política **same-origin** también a las cookies: no envía cookies de un dominio A hacia un servidor en dominio B.

```
Frontend:  http://localhost:5173  (origen A)
Backend:   http://localhost:3001  (origen B → puerto diferente = origen diferente)
```

Sin `withCredentials: true`, cuando axios hace `POST /auth/refresh`:
- El browser **no envía** la cookie `refreshToken`
- El backend recibe `req.cookies.refreshToken = undefined`
- → 401 "No hay refresh token"

Con `withCredentials: true` en axios + `credentials: true` en el servidor:
```javascript
// authService.js
const authAxios = axios.create({
  baseURL: 'http://localhost:3001/auth',
  withCredentials: true,   // ← Habilita envío de cookies cross-origin
});

// server.js
app.use(cors({
  origin: "http://localhost:5173",  // origen exacto (no '*' — incompatible con credentials)
  credentials: true,
}));
```

Esta es la interacción entre **CORS Level 2** y el manejo de sesiones a nivel de aplicación, vinculado a lo estudiado en **Redes** sobre el modelo de seguridad del browser.

---

## 10. Patrones de Diseño en el Sistema de Auth

### 10.1 Chain of Responsibility (Cadena de Responsabilidad)

El pipeline de Express es la implementación más directa de este patrón:

```
Request → helmet() → cors() → json() → cookieParser() → loginLimiter → validator → protect → handler → errorHandler
            │           │        │           │               │              │           │          │           │
         Seguridad    CORS    Parsea      Parsea          Rate          Valida      Verifica   Lógica    Captura
         headers     filter   body        cookie          limit         input       JWT       negocio    errores
```

Cada middleware decide: procesar y pasar (`next()`), o cortar la cadena (`res.status().json()`).

### 10.2 Strategy Pattern (implícito en la validación)

`express-validator` implementa Strategy: cada regla (`isEmail()`, `isLength()`, `notEmpty()`) es una estrategia de validación intercambiable:

```javascript
// Estrategias de validación configuradas declarativamente:
body("email").isEmail().withMessage("Email inválido").normalizeEmail()
body("password").isLength({ min: 6 }).withMessage("Contraseña muy corta")
```

### 10.3 Observer Pattern (Zustand)

Los componentes React son **observadores** del authStore. Cuando `logout()` cambia el estado:

```
authStore.logout()
    │
    ├── Nav.jsx (observa `user`) → re-renderiza mostrando "Iniciar sesión"
    ├── Cart.jsx (observa `accessToken`) → bloquea el botón "Pagar"
    └── App.jsx (observa `accessToken`) → dispara efecto de refresh
```

Sin ningún código de "notificación" explícito — Zustand gestiona las suscripciones internamente.

### 10.4 Facade Pattern (authService.js)

`authService.js` es una **fachada** que simplifica la interfaz de axios para el resto del frontend:

```javascript
// Sin fachada (los componentes tendrían que saber todo esto):
axios.post('http://localhost:3001/auth/login', data, {
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

// Con fachada (interfaz simple):
loginUser(data)  // 1 línea
```

---

## 11. Análisis de Seguridad: Vectores de Ataque y Mitigaciones

### 11.1 Tabla de vectores y mitigaciones implementadas

| Vector de ataque | Descripción | Mitigación implementada |
|-----------------|-------------|------------------------|
| **Fuerza bruta en login** | Script prueba 10,000 contraseñas/seg | `loginLimiter`: 5 req/15min por IP |
| **Contraseñas filtradas (DB leak)** | BD expuesta, contraseñas visibles | `bcrypt` con cost=10: ~100 hash/s |
| **XSS roba tokens** | Script malicioso roba accessToken de localStorage | RefreshToken en `httpOnly` cookie (inaccesible a JS). AccessToken dura solo 15min |
| **CSRF** | Sitio malicioso hace petición usando cookies del usuario | `sameSite: "Strict"` + CORS restrictivo en backend |
| **JWT falsificado** | Atacante crea token falso con userId arbitrario | Firma HMAC-SHA256 con `JWT_SECRET` — sin clave secreta, la firma no coincide |
| **Token robado en tránsito** | Man-in-the-Middle intercepta el token | En prod: `secure: true` en cookie (solo HTTPS) + HSTS via helmet |
| **Sesión persistente tras logout** | Refresh token robado antes del logout | Token en BD: al hacer logout se borra → el servidor rechaza tokens revocados |
| **Email duplicado** | Registro con email ya existente | `@unique` en Prisma + check explícito + error P2002 handler |
| **Input malicioso** | `"email": "<script>alert(1)</script>"` | `express-validator` normaliza y rechaza inputs inválidos |
| **Headers que revelan info** | `X-Powered-By: Express` expone la tecnología | `helmet()` elimina este y otros headers innecesarios |

### 11.2 Vulnerabilidades pendientes (lo que faltaría en producción)

```
Estado actual:
  ✅ bcrypt hash de contraseñas
  ✅ JWT de corta duración
  ✅ Refresh token en HttpOnly cookie
  ✅ Rate limiting en login
  ✅ Validación de inputs
  ✅ CORS restrictivo
  ✅ helmet() headers

Pendiente para producción:
  ❌ HTTPS + TLS (secure: true en cookies)
  ❌ Refresh token rotation (invalidar y reemitir cada uso)
  ❌ Blacklist de tokens (para logout inmediato de accessToken)
  ❌ Logging estructurado (Winston/Pino) con alertas
  ❌ Variables de entorno validadas al inicio (fail-fast)
  ❌ Dos instancias de PrismaClient (server.js y authRoutes.js — debería ser una)
```

---

## 12. Reflexión: Qué mejoraría un sistema en producción real

### 12.1 Unificación de la instancia PrismaClient

En el proyecto actual existen **dos instancias separadas** de `PrismaClient`:

```javascript
// server.js      → const prisma = new PrismaClient();
// authRoutes.js  → const prisma = new PrismaClient();
```

Cada instancia abre su propio **connection pool** hacia NeonDB. En producción con tráfico real, esto puede agotar las conexiones disponibles del pgBouncer. La solución es un módulo singleton compartido:

```javascript
// lib/prisma.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;

// En todos los archivos:
const prisma = require('../lib/prisma');
```

### 12.2 Separación de responsabilidades: Controllers

```
Estado actual:                    Arquitectura objetivo:
──────────────                    ────────────────────────
authRoutes.js                     authRoutes.js  → solo define rutas
│ validaciones                    authController.js → lógica de handlers
│ lógica de negocio               authService.js → lógica de negocio
│ acceso a BD                     authRepository.js → acceso a BD (Prisma)
└─── todo mezclado
```

Esta separación aplica el **Single Responsibility Principle** (SOLID) y facilita el testing unitario de cada capa de forma aislada.

### 12.3 Conexión con materias futuras

| Lo que implementaste | Materia universitaria relacionada |
|---------------------|----------------------------------|
| JWT HMAC-SHA256 | Seguridad Informática (criptografía simétrica) |
| bcrypt / funciones hash | Análisis de Algoritmos (complejidad temporal intencionada) |
| Rate limiting / sliding window | Análisis y Diseño de Algoritmos (ventana deslizante) |
| Refresh token en BD | Base de Datos II (gestión de sesiones, consistencia) |
| CORS / same-origin policy | Redes (políticas de seguridad a nivel HTTP) |
| PrismaClient singleton | Diseño de Patrones (Singleton, Factory) |
| Middleware chain | Diseño de Patrones (Chain of Responsibility) |
| Multi-device sessions (1:N) | Base de Datos I (cardinalidad, relaciones) |
| Stateless auth (JWT) | Redes / Sistemas Distribuidos (escalabilidad horizontal) |

---

## Resumen: El Flujo Completo en 5 líneas

```
REGISTRO  : password → bcrypt.hash(10) → BD guarda hash, nunca plano
LOGIN     : bcrypt.compare() → JWT accessToken (15min, en RAM) + refreshToken (7d, cookie HttpOnly)
PETICIÓN  : Authorization: Bearer <JWT> → protect → jwt.verify() sin BD → req.user disponible
F5/RELOAD : Zustand rehidrata localStorage → si expiró → /auth/refresh usa cookie automática
LOGOUT    : BD borra refreshToken → clearCookie → authStore.logout() → localStorage limpio
```

La seguridad no es un feature adicional — es la suma de decisiones pequeñas y correctas aplicadas en cada capa del sistema.

---

*Documento basado en código real del proyecto. Stack: React 18 + Express 5 + Prisma 6 + NeonDB (PostgreSQL 16) — Febrero 2026*
