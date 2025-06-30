import { useState, useEffect, useCallback } from 'react';

interface ScrapedResult {
  casa: number;
  visitante: number;
  winner: 'Casa' | 'Visitante' | 'Empate';
  timestamp: string;
  source: string;
  site: string;
  raw: {
    playerText: string;
    bankerText: string;
    winnerText: string;
    gameActive: string;
  };
}

interface ScraperStatus {
  isRunning: boolean;
  lastError: string | null;
  totalScraped: number;
  successRate: number;
  attempts: number;
  successes: number;
}

interface ScraperAPIResponse {
  success: boolean;
  data: ScrapedResult[];
  lastScrapeTime: string;
  status: ScraperStatus;
  total: number;
  sources: string[];
}

export const useScraperAPI = () => {
  const [data, setData] = useState<ScrapedResult[]>([]);
  const [status, setStatus] = useState<ScraperStatus>({
    isRunning: false,
    lastError: null,
    totalScraped: 0,
    successRate: 0,
    attempts: 0,
    successes: 0
  });
  const [lastScrapeTime, setLastScrapeTime] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [connectionError, setConnectionError] = useState<string>('');

  const fetchScraperData = useCallback(async () => {
    try {
      const response = await fetch('/scraper-api/scraper/data');
      
      if (response.ok) {
        const result: ScraperAPIResponse = await response.json();
        
        setData(result.data);
        setStatus(result.status);
        setLastScrapeTime(result.lastScrapeTime);
        setSources(result.sources);
        setIsConnected(true);
        setConnectionError('');
        
        return result.data;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ Scraper service unavailable:', errorMessage);
      
      setIsConnected(false);
      
      // Set user-friendly error messages
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch')) {
        setConnectionError('Scraper service is not running. Please start it with "npm run scraper" or "npm run start:all"');
      } else if (errorMessage.includes('HTTP 500')) {
        setConnectionError('Scraper service encountered an internal error');
      } else {
        setConnectionError(`Connection error: ${errorMessage}`);
      }
      
      return [];
    }
  }, []);

  const triggerManualScrape = useCallback(async () => {
    try {
      const response = await fetch('/scraper-api/scraper/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ Scraping manual iniciado');
        setConnectionError('');
        // Aguardar um pouco e buscar dados atualizados
        setTimeout(fetchScraperData, 3000);
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ Failed to trigger manual scrape:', errorMessage);
      
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch')) {
        setConnectionError('Scraper service is not running. Please start it with "npm run scraper" or "npm run start:all"');
      } else {
        setConnectionError(`Manual scrape failed: ${errorMessage}`);
      }
      
      return false;
    }
  }, [fetchScraperData]);

  // Buscar dados a cada 30 segundos, mas com retry logic
  useEffect(() => {
    fetchScraperData(); // Busca inicial
    
    const interval = setInterval(() => {
      // Only attempt to fetch if we don't have a connection error or if enough time has passed
      if (!connectionError || Date.now() % 120000 < 30000) { // Retry every 2 minutes
        fetchScraperData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchScraperData, connectionError]);

  return {
    data,
    status,
    lastScrapeTime,
    isConnected,
    sources,
    connectionError,
    fetchScraperData,
    triggerManualScrape,
    refetch: fetchScraperData
  };
};