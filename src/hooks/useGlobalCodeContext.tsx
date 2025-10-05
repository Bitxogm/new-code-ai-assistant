import { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalCodeContextType {
  code: string;
  language: string;
  outputLanguage: string;
  analysisResults: Record<string, string>;
  setCode: (code: string) => void;
  setLanguage: (language: string) => void;
  setOutputLanguage: (language: string) => void;
  setAnalysisResults: (results: Record<string, string>) => void;
  addAnalysisResult: (type: string, result: string) => void;
}

const GlobalCodeContext = createContext<GlobalCodeContextType | undefined>(undefined);

interface GlobalCodeProviderProps {
  children: ReactNode;
}

export const GlobalCodeProvider = ({ children }: GlobalCodeProviderProps) => {
  const [code, setCode] = useState(`# Ejemplo de código Python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def main():
    for i in range(10):
        print(f"Fibonacci({i}) = {fibonacci(i)}")

if __name__ == "__main__":
    main()`);
  const [language, setLanguage] = useState('python');
  const [outputLanguage, setOutputLanguage] = useState('python');
  const [analysisResults, setAnalysisResults] = useState<Record<string, string>>({});

  const addAnalysisResult = (type: string, result: string) => {
    setAnalysisResults(prev => ({ ...prev, [type]: result }));
  };

  const value = {
    code,
    language,
    outputLanguage,
    analysisResults,
    setCode,
    setLanguage,
    setOutputLanguage,
    setAnalysisResults,
    addAnalysisResult
  };

  return (
    <GlobalCodeContext.Provider value={value}>
      {children}
    </GlobalCodeContext.Provider>
  );
};

export const useGlobalCode = () => {
  const context = useContext(GlobalCodeContext);
  if (context === undefined) {
    throw new Error('useGlobalCode must be used within a GlobalCodeProvider');
  }
  return context;
};