// Crea este archivo: src/lib/api-client.ts
export class ApiClient {
    private baseUrl = import.meta.env.DEV 
    ? 'http://localhost:3001/api'
    : '/api';

    private async fetchWithTimeout(url: string, options: RequestInit, timeout = 30000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        console.log(`🔵 API Call: ${url}`, options.body); // DEBUG
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);

            console.log(`🟢 API Response Status: ${response.status}`); // DEBUG
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`🔴 API Error ${response.status}:`, errorText); // DEBUG
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('🟢 API Response Data:', data); // DEBUG
            return data;
            
        } catch (error) {
            clearTimeout(id);
            console.error('🔴 API Fetch Error:', error); // DEBUG
            if (error.name === 'AbortError') {
                throw new Error('Timeout: La solicitud tardó demasiado tiempo');
            }
            throw error;
        }
    }

    async analyzeCode(params: { 
        code: string; 
        language: string; 
        outputLanguage?: string; 
        mode: string; 
    }) {
        console.log('🔵 analyzeCode called with:', params); // DEBUG
        return this.fetchWithTimeout(`${this.baseUrl}/analyze-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        }, 45000); // 45 segundos timeout
    }

    async chat(params: {
        messages: Array<{ role: string; content: string }>;
        code?: string;
        language?: string;
        context?: string;
    }) {
        console.log('🔵 chat called with:', params); // DEBUG
        return this.fetchWithTimeout(`${this.baseUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        }, 30000); // 30 segundos timeout
    }
}

export const apiClient = new ApiClient();