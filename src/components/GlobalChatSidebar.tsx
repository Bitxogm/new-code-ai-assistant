import { ChatSidebar } from './ChatSidebar';
import { useGlobalCode } from '@/hooks/useGlobalCodeContext';

export const GlobalChatSidebar = () => {
  const { code, language, analysisResults } = useGlobalCode();
  
  return (
    <ChatSidebar 
      code={code}
      language={language}
      analysisResults={analysisResults}
    />
  );
};