// En api/analyze-code/index.js - REEMPLAZAR con:
import { GoogleGenerativeAI } from '@google/generative-ai';

const ANALYSIS_MODES = {
  refactor: "refactorización y mejoras de código",
  tests: "generación de pruebas unitarias",
  security: "análisis de seguridad",
  performance: "optimización de rendimiento",
  documentation: "generación de documentación",
  debug: "detección de errores y bugs",
  modularization: "sugerencias de modularización"
};

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { code, language, outputLanguage, mode } = request.body;

    if (!code || !language || !mode) {
      return response.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no configurada');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp'
    });

    // Construir el prompt basado en tu estructura excelente
    const fullPrompt = buildAnalysisPrompt(code, language, outputLanguage, mode);

    console.log('Enviando prompt estructurado a Gemini...');
    const result = await model.generateContent(fullPrompt);
    const geminiResponse = await result.response;
    const responseText = geminiResponse.text();

    // Intentar parsear el JSON de la respuesta
    // SOLUCIÓN SIMPLIFICADA - Siempre devolver respuesta válida
    let finalAnalysis = responseText;

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        finalAnalysis = parsed.refactoredCode || responseText;
      }
    } catch (parseError) {
      console.error('Error parseando JSON, usando texto plano:', parseError);
      // Mantenemos responseText como fallback
    }

    console.log('Análisis completado exitosamente');

    // Formato compatible con el frontend actual
    const frontendResponse = {
      success: true,
      analysis: finalAnalysis,  // ← CAMBIADO: usar finalAnalysis en lugar de jsonResponse.refactoredCode
      mode: mode,
      language: language,
      outputLanguage: outputLanguage || language,
      isTranslation: !!(outputLanguage && outputLanguage !== language),
      // Mantener datos estructurados para futuro uso
      structuredData: { result: finalAnalysis }
    };

    response.status(200).json(frontendResponse);

  } catch (error) {
    console.error('Error en analyze-code:', error);
    response.status(500).json({
      error: error.message || 'Error interno del servidor',
      details: 'Error al comunicarse con Gemini AI'
    });
  }
}

// Función para construir el prompt basado en tu estructura excelente
function buildAnalysisPrompt(code, inputLanguage, outputLanguage, analysisMode) {
  // Base de tu prompt excelente
  let instruction = '';

  if (analysisMode === "tests") {
    instruction = `
Eres un Full Stack Developer con amplia experiencia en Testing.
Analiza cuidadosamente el siguiente código en \`${inputLanguage}\`.
Genera pruebas unitarias ejecutables en \`${outputLanguage}\`.

Requisitos:
- Usa el framework más común en \`${outputLanguage}\` (ej: Jest para JS, JUnit para Java).
- Incluye pruebas para casos normales, límites y errores.
- Devuelve SOLO el código — sin texto introductorio ni explicaciones extra.
- No uses bloques markdown (\`\`\`java...\`\`\`).
- Añade comentarios en el código explicando qué prueba se realiza y por qué es importante.
`;
  } else if (analysisMode === "security") {
    instruction = `
Eres un experto Code Security Analyst.
Tu enfoque es analizar código fuente en múltiples lenguajes para detectar vulnerabilidades comunes (XSS, SQLi, CSRF, RCE, etc.).
Dominio profundo de OWASP Top 10 y estándares CWE, CVE, NIST.
Analiza el siguiente código escrito en \`${inputLanguage}\`.

Requisitos:
- Si detectas vulnerabilidades, corrige directamente el código e incluye comentarios específicos que expliquen cada riesgo y cómo la corrección lo mitiga.
- Si no hay problemas, indica claramente qué partes son seguras, con comentarios en el código.
- Devuelve SOLO el código corregido o revisado — sin texto introductorio.
- No uses bloques markdown.
`;
  } else if (analysisMode === "performance") {
    instruction = `
Eres un experto en Optimización de Rendimiento.
Analiza el siguiente código en \`${inputLanguage}\` para identificar cuellos de botella y oportunidades de optimización.

Requisitos:
- Identifica operaciones costosas, algoritmos ineficientes, y patrones que afecten el rendimiento.
- Proporciona optimizaciones específicas con explicaciones de los beneficios esperados.
- Considera complejidad algorítmica, uso de memoria, y eficiencia de E/S.
`;
  } else if (analysisMode === "documentation") {
    instruction = `
Eres un Technical Writer experto en documentación de código.
Genera documentación completa y profesional para el siguiente código en \`${inputLanguage}\`.

Requisitos:
- Documenta todas las funciones/métodos, clases, y componentes principales.
- Incluye descripciones de parámetros, valores de retorno, y ejemplos de uso.
- Añade comentarios inline explicando lógica compleja.
- Proporciona una visión general de la arquitectura y flujo del programa.
`;
  } else if (analysisMode === "modularization") {
    instruction = `
Eres un Software Architect experto en diseño de sistemas modulares.
Analiza el siguiente código en \`${inputLanguage}\` y sugiere una estructura modular optimizada.

Requisitos:
- Identifica responsabilidades que pueden separarse en módulos independientes.
- Propone una estructura de archivos y directorios.
- Incluye ejemplos de imports/exports entre módulos.
- Explica los beneficios de la modularización propuesta.
`;
  } else {
    // Modo refactor por defecto
    instruction = `
Refactoriza este código escrito en \`${inputLanguage}\` y devuélvelo en \`${outputLanguage}\`.

Mejoras esperadas:
- Código más legible, mantenible y escalable.
- Uso de buenas prácticas propias de \`${outputLanguage}\`.
- Modularidad mejorada si corresponde.
- Añade comentarios **dentro del código** que expliquen:
  - Qué cambios o validaciones se hicieron.
  - Por qué se hicieron esos cambios (beneficios y problemas que resuelven).
  - Puntos clave para entender la estructura o lógica importante.

Requisitos:
- Devuelve SOLO el código refactorizado — sin texto introductorio ni bloques markdown.
- Los comentarios deben ser claros, breves y educativos.
- Al final del código, añade un bloque de comentarios separados con una explicación resumida de las mejoras generales realizadas.
`;
  }

  return `Eres un ingeniero de software experto en múltiples lenguajes de programación, refactorización, desarrollo de pruebas unitarias y análisis de seguridad.
Tu tarea es procesar el código proporcionado por el usuario y devolver una respuesta estructurada **EXCLUSIVAMENTE en formato JSON**.

El JSON debe contener los siguientes campos obligatorios, cada uno como una cadena de texto (excepto \`inlineComments\` que es un array de objetos):

1.  \`refactoredCode\` (string):
    * Contendrá el código ${inputLanguage} refactorizado, con comentarios claros **dentro del código** explicando cada cambio y mejora realizada.
    * La refactorización debe buscar mejorar la legibilidad, la eficiencia, la modularidad y la adherencia a las mejores prácticas de ${inputLanguage}.
    * Este campo siempre contendrá el código principal refactorizado, incluso si no se selecciona específicamente el modo de refactorización.

2.  \`refactoringSummary\` (string):
    * Contendrá un resumen conciso en texto plano de las **mejoras generales** realizadas en la refactorización del código.
    * Si el modo seleccionado es 'test' o 'security' y no se aplica una refactorización significativa, este campo puede indicar 'No se requirieron cambios de refactorización significativos para este análisis.'

3.  \`inlineComments\` (Array<Object>):
    * Contendrá una lista de objetos JSON: \`{"lineNumber": <número>, "text": "<descripción>", "type": "<info|warning|error>"}\`
    * Genera estos comentarios para explicar cambios específicos, mejoras, optimizaciones, o puntos de atención.

4.  \`unitTests\` (string):
    * Si el \`analysisMode\` es 'test', este campo contendrá el código ${outputLanguage} completo de **pruebas unitarias exhaustivas**.
    * Si NO es 'test', este campo debe ser una cadena vacía \`""\`.

5.  \`securityAnalysis\` (string):
    * Si el \`analysisMode\` es 'security', este campo contendrá un informe detallado del **análisis de seguridad**.
    * Si NO es 'security', este campo debe ser una cadena vacía \`""\`.

6.  \`performanceAnalysis\` (string):
    * Si el \`analysisMode\` es 'performance', este campo contendrá un análisis detallado de optimizaciones de rendimiento.
    * Si NO es 'performance', este campo debe ser una cadena vacía \`""\`.

7.  \`documentation\` (string):
    * Si el \`analysisMode\` es 'documentation', este campo contendrá documentación completa del código.
    * Si NO es 'documentation', este campo debe ser una cadena vacía \`""\`.

8.  \`architecturalSuggestions\` (string):
    * Si el \`analysisMode\` es 'modularization', este campo contendrá sugerencias de modularización y estructura.
    * Si NO es 'modularization', este campo debe ser una cadena vacía \`""\`.

**Reglas Generales:**
- **Todos los valores de cadena DEBEN tener los caracteres especiales correctamente escapados.**
- La respuesta debe ser **EXCLUSIVAMENTE el objeto JSON**, sin ningún texto adicional.
- El JSON debe ser **válido** y estar bien formateado.
- **Todos los campos deben estar presentes** en el JSON final.

---

### **Instrucciones Adicionales Específicas para el Modo (${analysisMode}):**
${instruction}

### **Configuración del Lenguaje:**
-   El \`inputLanguage\` es: ${inputLanguage}.
-   El \`outputLanguage\` deseado es: ${outputLanguage}.

### **Código a Procesar:**

\`\`\`${inputLanguage}
${code}
\`\`\`

### **Formato de Respuesta Requerido (JSON):**
\`\`\`json
{
"refactoredCode": "",
"refactoringSummary": "",
"inlineComments": [],
"unitTests": "",
"securityAnalysis": "",
"performanceAnalysis": "",
"documentation": "",
"architecturalSuggestions": ""
}
\`\`\`
Por favor, rellena el JSON de arriba basándote en las instrucciones y el código proporcionado.
`;
}