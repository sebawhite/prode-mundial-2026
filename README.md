# PRODE Mundial 2026 ⚽🏆

¡Bienvenido al código fuente de **PRODE Mundial 2026**! Esta es una Progressive Web App (PWA) diseñada y pulida especialmente para un círculo cerrado de **~50 a 100 participantes** (amigos, familiares y conocidos de la organización) para divertirse pronosticando marcadores exactos en la Fase de Grupos de la Copa del Mundo de la FIFA 2026 (USA, México, Canadá).

---

## 🎯 Contexto e Impacto Social

Este torneo está organizado por **Felix Blanco** en Buenos Aires. Tiene un fin doble: diversión competitiva y un propósito noble.
- **Inscripción única (Buy-in):** $6.000 ARS.
- **Comisión solidaria (50%):** El **50%** de todo lo recaudado será donado de forma directa para sostener la compra de bancos de madera y raciones de comida de una escuela necesitada de **Zanzíbar, Tanzania** (**Wonderful School**).
- **Pozo para Premios (50%):** El restante **50%** se distribuye íntegramente de forma transparente entre las 3 posiciones más altas en el ranking final de la siguiente forma:
  - **1° de la tabla:** 60% del pozo acumulado.
  - **2° de la tabla:** 25% del pozo acumulado.
  - **3° de la tabla:** 15% del pozo acumulado.

---

## 🎨 Identidad Visual (Estilo Retro Vintage)

La interfaz de usuario ha sido profundamente pulida respetando un estilo **Cartel Retro Vintage**:
- **Paleta de Colores de Época:** Fondo color papel crema antiguo envejecido (`#F4EAD5`), tinta negra carbón (`#2A1F17`), rojo lacre fuerte (`#C8442F`), y acentos dorados vintage (`#C89832`).
- **Superposición de Grano SVG:** Simula la textura rugosa de papel poroso impreso.
- **Detalles Tipográficos:** Combinación de fuentes Serif elegantes ("DM Serif Display") y Sans minimalista ("Space Grotesk" y "Inter") con espaciado amplio y tracking ajustado.
- **Marcas de Registro:** Cruces de corte e identificación impresas en los bordes de la pantalla.

---

## 🚀 Arquitectura y Modo Sandbox

Para garantizar que el sistema funcione perfectamente de forma local sin configurar bases de datos online, la aplicación cuenta con un **Modo Sandbox por defecto**:
- Si no se configuran las variables de entorno de Firebase, la app almacena localmente los datos de registro, partidos, predicciones e invite codes dentro del `localStorage` del navegador.
- Esto te permite probar el 100% de los flujos de jugador y de administración al instante sin romper nada.

---

## 🛠️ Instalación y Desarrollo Local

Seguí estos pasos para clonar e instalar el entorno de desarrollo local de Vite de forma rápida:

### 1. Clonar el repositorio e instalar dependencias
```bash
npm install
```

### 2. Ejecutar el servidor de desarrollo de Vite
```bash
npm run dev
```
El servidor se iniciará en `http://localhost:3000`.

### 3. Compilar para producción (produces estáticos en `dist/`)
```bash
npm run build
```

---

## 🔥 Integración y Despliegue con Firebase

Cuando estés listo para desplegar el proyecto a producción para tus ~100 amigos, seguí estos pasos para activar la persistencia multiusuario de Firebase Firestore y Authentication.

### 1. Obtener Credenciales de Firebase
1. Entrá a [Firebase Console](https://console.firebase.google.com/) y creá un proyecto nuevo llamado `Prode-Mundial-2026`.
2. Habilitá **Firestore Database** en modo producción. Seleccioná la región más cercana a Sudamérica (ej. `southamerica-east1` o `us-east1`).
3. Habilitá **Authentication** y activa el proveedor de inicio de sesión de **Correo electrónico/Contraseña**.
4. Creá una Web App para obtener las credenciales (`firebaseConfig`).

### 2. Declarar Environment Variables
Copia las credenciales a un archivo `.env` en la raíz de tu proyecto:

```env
# .env
VITE_FIREBASE_API_KEY="AIzaSyA..."
VITE_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="tu-proyecto"
VITE_FIREBASE_STORAGE_BUCKET="tu-proyecto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:1234:web:5678"
```

### 3. Configurar el JSON local
Colocamos el archivo `firebase-applet-config.json` también en la raíz del proyecto para uso de los scripts del servidor:
```json
{
  "apiKey": "AIzaSyA...",
  "authDomain": "tu-proyecto.firebaseapp.com",
  "projectId": "tu-proyecto",
  "storageBucket": "tu-proyecto.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:1234:web:5678"
}
```

### 4. Sembrar (Seed) Partidos
Para que la base de datos se llene automáticamente con los 72 partidos de la Fase de Grupos del Mundial 2026 oficiales del fixture real y configures los códigos de invitación válidos por primera vez, ejecutá el script de siembra en tu terminal:

```bash
node scripts/seed-firestore.js
```
*Este comando creará automáticamente:*
- La colección `config/settings` con los alias de MercadoPago, buy-ins y códigos de invitación iniciales (`YELCHO2026-A8F3K2`).
- La colección `matches` con los 72 encuentros oficiales de la Fase de Grupos.

### 5. Desplegar de Reglas de Seguridad
Asegurá tu base de datos contra accesos no autorizados desplegando `firestore.rules`:
1. Asegurá que tengas instaladas las herramientas de Firebase (`npm install -g firebase-tools`).
2. Iniciá sesión con `firebase login`.
3. Ejecutá la subida oficial:
```bash
firebase deploy --only firestore:rules
```

---

## 🌐 Despliegue en Netlify

El proyecto cuenta con un archivo `netlify.toml` pre-configurado para que los routing internos de React Single Page Application no den errores de 404.

1. Conectá el repositorio de GitHub a tu cuenta de **Netlify**.
2. Configurá las siguientes variables de compilación:
   - **Build Command:** `npm run build`
   - **Publish directory:** `dist/`
3. Agregá tus variables de entorno `VITE_FIREBASE_*` en el panel de configuración de Netlify (Environment Variables).
4. ¡Listo! Tu app se desplegará de forma instantánea.

---

## 🛠️ Panel de Felix Blanco (Administración)

### ¿Cómo accedo al Panel de Felix?
Por cuestiones de seguridad y sencillez, el email **`felixblancovolpe@gmail.com`** (y también `sebahotelmkt@gmail.com`) está declarado como el Administrador Maestro absoluto de la quiniela.
- Al registrarse o ingresar en la aplicación con este email, la interfaz desbloqueará automáticamente el botón **🛠️ Panel Admin** y su respectiva insignia dorada.

### Acciones Administrativas Disponibles:
1. **Aprobación de Transferencias:** Verás el nombre real completo, email, nro de WhatsApp e indicación de pago de los registrados. Con un solo clic podés cambiar su estado a **Habilitado (Confirmado)** para liberarles el fixtures.
2. **Resultados Oficiales:** Podrás cargar los resultados oficiales e indicar partidos como "Terminado". Al instante se recalculan los puntos de los participantes de forma automática y se reordena la tabla general.
3. **Generación de Códigos:** Podés ingresar nuevos códigos de invitación personalizados para que se agreguen a la lista de registros habilitados.
