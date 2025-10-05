# 🚀 AI Code Assistant ☠️

Una aplicación moderna para análisis y refactorización de código impulsada por IA, construida con React, TypeScript, Gemini AI y Vercel.

## ✨ Características

- **🤖 Análisis de Código con Gemini AI** - Refactorización, tests, seguridad, documentación
- **💬 Chat Inteligente** - Asistente de programación en tiempo real  
- **🔧 Multi-Lenguaje** - Soporte para Python, JavaScript, TypeScript, Java, y más
- **📁 Gestión de Proyectos** - Guarda y organiza tus consultas de código
- **🎨 Interface Moderna** - Diseño elegante con shadcn/ui y Tailwind CSS

## 🛠️ Tecnologías

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Vercel API Routes, Express
- **IA**: Google Gemini AI
- **Auth**: Supabase
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Vercel

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- Cuenta en [Google AI Studio](https://makersuite.google.com/app/apikey) para Gemini API
- Cuenta en [Supabase](https://supabase.com) para Auth y Database
- Cuenta en [Vercel](https://vercel.com) para deployment

### 1. Clonar el repositorio
\`\`\`bash
git clone https://github.com/tu-usuario/code-ai-assistant.git
cd code-ai-assistant
\`\`\`

### 2. Instalar dependencias
\`\`\`bash
npm install
\`\`\`

### 3. Configurar variables de entorno
Crea un archivo \`.env\` en la raíz del proyecto:

\`\`\`env
# ============================================================================
# SUPABASE CONFIGURATION (Auth & Database)
# ============================================================================
# Obtén estos valores desde tu dashboard de Supabase > Settings > API
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...tu_anon_key

# ============================================================================
# GEMINI AI CONFIGURATION 
# ============================================================================
# Obtén tu API key desde: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=AIzaSyD...tu_clave_gemini_ai

# ============================================================================
# OPCIONAL: Migración desde Lovable AI
# ============================================================================
LOVABLE_API_KEY=opcional_solo_para_migracion
\`\`\`

### 4. Ejecutar en desarrollo
\`\`\`bash
npm run dev
\`\`\`

## 🔧 Configuración de Supabase

### 1. Crear proyecto en Supabase
- Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto
- En Settings > API, copia:
  - **URL** → \`VITE_SUPABASE_URL\`
  - **anon public** → \`VITE_SUPABASE_PUBLISHABLE_KEY\`

### 2. Configurar la base de datos
El proyecto incluye migraciones automáticas para:
- Tabla \`profiles\` (información de usuarios)
- Tabla \`queries\` (consultas guardadas)
- Políticas de seguridad (RLS)
- Triggers automáticos

## 🤖 Configuración de Gemini AI

### 1. Obtener API Key
- Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
- Crea una nueva API key
- Cópiala en \`GEMINI_API_KEY\`

### 2. Modelos soportados
- \`gemini-2.0-flash-exp\` (recomendado - más rápido y económico)
- \`gemini-1.5-pro\` (para tareas complejas)
- \`gemini-2.0-flash-thinking-exp\` (para razonamiento complejo)

## 🚀 Deployment

### Vercel (Recomendado)

1. **Conectar repositorio**
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio de GitHub

2. **Configurar variables de entorno**
   En el dashboard de Vercel, añade:
   - \`GEMINI_API_KEY\` = tu_clave_gemini_ai
   - \`VITE_SUPABASE_URL\` = tu_url_supabase
   - \`VITE_SUPABASE_PUBLISHABLE_KEY\` = tu_anon_key

3. **Deployment automático**
   - Vercel detectará la configuración automáticamente
   - Las API routes estarán en: \`/api/analyze-code\` y \`/api/chat\`

### Variables de entorno en producción:
\`\`\`env
GEMINI_API_KEY=AIzaSyD...tu_clave_gemini_ai
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

## 📝 Uso

### Análisis de Código
1. **Ingresa tu código** en el editor principal
2. **Selecciona el lenguaje** (Python, JavaScript, TypeScript, Java, etc.)
3. **Elige el modo de análisis**:
   - 🔧 **Refactorización** - Mejora legibilidad y eficiencia
   - 🧪 **Tests Unitarios** - Genera casos de prueba completos
   - 🛡️ **Seguridad** - Detecta vulnerabilidades
   - 📊 **Rendimiento** - Optimiza el código
   - 📚 **Documentación** - Genera documentación completa
   - 🐛 **Debug** - Encuentra errores y problemas
   - 🧩 **Modularización** - Sugiere estructura de módulos

4. **Ejecuta el análisis** - La IA procesará tu código y generará resultados

### Chat Inteligente
- **Conversa en tiempo real** sobre tu código
- **Haz preguntas técnicas** específicas
- **Consulta sobre mejores prácticas**
- **Pide explicaciones** de conceptos complejos

### Gestión de Proyectos
- **Guarda consultas** para referencia futura
- **Organiza por lenguajes** y etiquetas
- **Marca como favoritos** los análisis más útiles

## 🏗️ Estructura del Proyecto

\`\`\`
code-ai-assistant/
├── src/
│   ├── components/          # Componentes React
│   │   ├── CodeEditorAdvanced.tsx
│   │   ├── ChatSidebar.tsx
│   │   └── InteractiveChatbot.tsx
│   ├── lib/
│   │   ├── api-client.ts    # Cliente para APIs
│   │   └── utils.ts
│   ├── integrations/
│   │   └── supabase/        # Configuración de Supabase
│   └── hooks/               # Custom hooks
├── api/                     # Vercel API Routes
│   ├── analyze-code/
│   │   └── index.js
│   └── chat/
│       └── index.js
├── supabase/
│   ├── migrations/          # Esquema de base de datos
│   └── config.toml
└── server/                  # Servidor de desarrollo
    └── index.js
\`\`\`

## 🔒 Seguridad

- **Detección de secretos** - Hook pre-commit para prevenir leaks
- **Row Level Security** - En Supabase para protección de datos
- **Variables de entorno** - Configuración sensible fuera del código
- **CORS configurado** - Para APIs

## 🤝 Contribución

1. **Fork** el proyecto
2. **Crea una rama** para tu feature (\`git checkout -b feature/AmazingFeature\`)
3. **Commit** tus cambios (\`git commit -m 'Add some AmazingFeature'\`)
4. **Push** a la rama (\`git push origin feature/AmazingFeature\`)
5. **Abre un Pull Request**

### Guidelines
- Sigue el código de conducta
- Mantén tests actualizados
- Documenta nuevos features
- Usa el hook de seguridad pre-commit

## 🐛 Solución de Problemas

### Error: "API key no configurada"
- Verifica que \`GEMINI_API_KEY\` esté en tus variables de entorno
- Reinicia el servidor después de cambios en \`.env\`

### Error: "Supabase connection failed"
- Revisa \`VITE_SUPABASE_URL\` y \`VITE_SUPABASE_PUBLISHABLE_KEY\`
- Verifica que tu proyecto de Supabase esté activo

### Error: "CORS policy"
- Las APIs están configuradas con CORS para \`*\`
- Verifica que estés usando las URLs correctas

## 📄 Licencia

Distribuido bajo la Licencia MIT. Ver \`LICENSE\` para más información.

## 🆘 Soporte

Si encuentras algún problema:
1. Revisa la documentación anterior
2. Busca issues existentes en GitHub
3. Abre un nuevo issue con:
   - Descripción detallada
   - Pasos para reproducir
   - Logs de error
   - Entorno (OS, Node version, etc.)

---

**¿Te gusta el proyecto? ¡Dale una ⭐ en GitHub!**

## ©️ Copyright

**Copyright © 2025 AI Code Assistant.** Todos los derechos reservados.

Este proyecto es de código abierto bajo la Licencia MIT. Puedes usar, modificar y distribuir el código, pero se requiere atribución apropiada.

**Atribución requerida:**
- Incluir el copyright original en distribuciones
- Mencionar el proyecto original en trabajos derivados
- No usar el nombre del proyecto para promover productos sin permiso

**Desarrollado con ❤️ usando React, Gemini AI y Vercel**
