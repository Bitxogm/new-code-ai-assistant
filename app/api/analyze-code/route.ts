import { NextResponse } from 'next/server';

export const runtime = 'edge';

const ANALYSIS_PROMPTS = {
  refactor: "Analiza el siguiente código y proporciona sugerencias de refactorización para mejorar la legibilidad, mantenibilidad y eficiencia. Incluye el código refactorizado si es necesario:",
  tests: "Analiza el siguiente código y genera casos de prueba unitarios completos. Incluye casos edge y diferentes escenarios de prueba:",
  security: "Realiza un análisis de seguridad del siguiente código. Identifica vulnerabilidades potenciales, malas prácticas de seguridad y proporciona recomendaciones para corregirlas:",
  performance: "Analiza el rendimiento del siguiente código. Identifica cuellos de botella, optimizaciones posibles y mejores prácticas para el rendimiento:",
  documentation: "Analiza el siguiente código y genera documentación completa. Incluye comentarios inline, documentación de funciones/métodos y guía de uso:",
  debug: "Analiza el siguiente código en busca de posibles errores, bugs o problemas lógicos. Proporciona soluciones y mejoras:",
  modularization: "Analiza el siguiente código y sugiere cómo modularizarlo. Identifica funciones que pueden separarse en módulos independientes, proporciona una estructura de archivos recomendada y explica cómo dividir el código para mejorar la organización y reutilización. Incluye ejemplos de cómo se vería la modularización:"
};

export async function POST(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers });
  }

  try {
    const { code, language, outputLanguage, mode } = await request.json();

    if (!code || !language || !mode) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: code, language, mode' },
        { status: 400, headers }
      );
    }

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    const isTranslation = outputLanguage && outputLanguage !== language;
    
    let fullPrompt;
    if (isTranslation) {
      fullPrompt = `Traduce el siguiente código de ${language} a ${outputLanguage}. Mantén la funcionalidad exactamente igual, pero adapta la sintaxis, convenciones y mejores prácticas del lenguaje de destino. Si hay librerías o funciones específicas del lenguaje original, sugiérelas equivalentes en ${outputLanguage}.

Lenguaje de origen: ${language}
Lenguaje de destino: ${outputLanguage}

Código a traducir:
\`\`\`${language}
${code}
\`\`\`

Por favor proporciona:
1. El código traducido a ${outputLanguage}
2. Explicación de cambios principales realizados
3. Dependencias o librerías necesarias en ${outputLanguage}
4. Comentarios sobre diferencias de implementación

Respuesta estructurada:`;
    } else {
      const prompt = ANALYSIS_PROMPTS[mode as keyof typeof ANALYSIS_PROMPTS];
      if (!prompt) {
        return NextResponse.json(
          { error: 'Modo de análisis no válido' },
          { status: 400, headers }
        );
      }

      fullPrompt = `${prompt}

Lenguaje: ${language}

Código:
\`\`\`${language}
${code}
\`\`\`

Por favor proporciona una respuesta detallada y estructura tu análisis de manera clara y organizada.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Eres un asistente experto en programación. Responde en español con claridad, citando líneas cuando sea útil.' 
          },
          { role: 'user', content: fullPrompt }
        ],
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Respuesta inválida del AI Gateway');
    }

    return NextResponse.json({
      result: content,
      language,
      outputLanguage: outputLanguage || language,
      mode,
      isTranslation
    }, { headers });

  } catch (error: any) {
    console.error('Error in analyze-code:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500, headers }
    );
  }
}