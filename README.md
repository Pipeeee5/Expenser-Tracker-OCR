# ExpenserTracker 💸

Rastreador de gastos personal con escaneo OCR de boletas y facturas usando IA.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google)

---

## Características

- **Escaneo OCR con IA** — Sube una foto de tu boleta o factura y Gemini 2.5 Flash extrae automáticamente el comercio, monto, fecha, IVA y lista de productos
- **Fallback local con Tesseract.js** — Si Gemini no está disponible, el OCR se procesa localmente sin límites ni API key
- **Categorización automática** — Clasifica cada gasto en categorías (alimentos, transporte, salud, etc.) con soporte para categorías personalizadas
- **Presupuesto con alertas** — Define límites mensuales por categoría y recibe alertas visuales al acercarte al límite
- **Reportes fiscales** — Exporta tus gastos en **PDF** y **CSV** filtrados por fecha, categoría o período
- **Autenticación** — Registro e inicio de sesión con cuentas privadas por usuario
- **Modo claro/oscuro** — Tema adaptable con soporte para preferencias del sistema
- **Almacenamiento en Cloudinary** — Las imágenes de boletas se guardan en la nube
- **Landing page** — Página de inicio con descripción de todas las funciones

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS 3 |
| Base de datos | SQLite (dev) · PostgreSQL (prod) via Prisma |
| OCR IA | Google Gemini 2.5 Flash |
| OCR local | Tesseract.js (fallback sin API) |
| Imágenes | Cloudinary |
| Autenticación | NextAuth.js |
| Gráficas | Recharts |
| Exportación | jsPDF + jspdf-autotable |

---

## Inicio rápido

### 1. Clona el repositorio

```bash
git clone https://github.com/Pipeeee5/Expense-Tracker-OCR.git
cd Expense-Tracker-OCR
```

### 2. Instala dependencias

```bash
npm install
```

### 3. Configura las variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Google Gemini API Key — https://aistudio.google.com/apikey
GEMINI_API_KEY=tu_api_key_aqui

# Base de datos
DATABASE_URL="file:./dev.db"
# Para producción usa PostgreSQL:
# DATABASE_URL="postgresql://user:password@host:5432/expenser_tracker"

# Cloudinary — https://cloudinary.com
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=genera_un_secreto_largo_aqui
```

### 4. Inicializa la base de datos

```bash
npx prisma db push
```

### 5. Ejecuta el servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo en el puerto 3000
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run db:push      # Sincronizar schema con la base de datos
npm run db:studio    # Abrir Prisma Studio (interfaz visual de la BD)
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/          # Páginas de login y registro
│   ├── api/             # API Routes (expenses, budgets, ocr, reports, categories)
│   ├── dashboard/       # Panel principal con estadísticas
│   ├── expenses/        # Gestión de gastos + escáner OCR
│   ├── budget/          # Presupuestos por categoría
│   ├── reports/         # Reportes exportables
│   └── page.tsx         # Landing page
├── components/
│   ├── OCRScanner.tsx   # Componente de escaneo con drag & drop
│   ├── ExpenseModal.tsx # Modal para crear/editar gastos
│   ├── BudgetModal.tsx  # Modal para crear/editar presupuestos
│   ├── Sidebar.tsx      # Navegación lateral
│   └── charts/          # Gráficas de barras y pastel
├── lib/
│   ├── gemini.ts        # Integración con Gemini API + fallback chain
│   ├── ocr-local.ts     # OCR local con Tesseract.js + parser de recibos
│   ├── cloudinary.ts    # Upload de imágenes a Cloudinary
│   ├── categories.ts    # Definición de categorías
│   ├── export.ts        # Exportación PDF y CSV
│   ├── auth.ts          # Configuración de NextAuth
│   └── prisma.ts        # Cliente de Prisma
└── middleware.ts        # Protección de rutas autenticadas
```

---

## Flujo de OCR

Cuando Gemini no está disponible (cuota agotada o sobrecarga), la app no se detiene:

```
Imagen subida
    │
    ▼
gemini-2.0-flash-lite  ── (1.500 req/día gratis) ──▶ ✓ Resultado IA
    │ falla
    ▼
gemini-1.5-flash-8b    ── (1.500 req/día gratis) ──▶ ✓ Resultado IA
    │ falla
    ▼
gemini-2.0-flash       ── (200 req/día gratis)   ──▶ ✓ Resultado IA
    │ falla
    ▼
Tesseract.js local     ── (sin límites, sin API)  ──▶ ✓ OCR Local
    │ falla
    ▼
Formulario vacío       ── (siempre funciona)      ──▶ Completar manual
```

---

## Base de datos

El proyecto usa **SQLite** por defecto (sin configuración extra) y **PostgreSQL** en producción.

Opciones gratuitas de PostgreSQL en la nube:
- [Neon](https://neon.tech) — 512 MB gratis
- [Supabase](https://supabase.com) — 500 MB gratis
- [Railway](https://railway.app) — 1 GB gratis

---

## Licencia

MIT
