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

## Licencia


