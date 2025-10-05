// Crea este archivo: src/lib/api-client.ts
export class ApiClient {
  private baseUrl = '/api';
  // private baseUrl = 'http://localhost:3001/api';
  async analyzeCode(params: { 
    code: string; 
    language: string; 
    outputLanguage?: string; 
    mode: string; 
  }) {
    const response = await fetch(`${this.baseUrl}/analyze-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async chat(params: {
    messages: Array<{ role: string; content: string }>;
    code?: string;
    language?: string;
    context?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();