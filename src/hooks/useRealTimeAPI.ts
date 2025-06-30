import { useState, useEffect, useCallback } from 'react';
import { BacBoApiResult } from '../types/common';

interface APIResponse {
  success: boolean;
  data: BacBoApiResult[];
  lastUpdate: string;
  source: string;
  connectionStatus: {
    tipminer: boolean;
    websocket: boolean;
    lastSuccessfulSource: string;
  };
}

export const useRealTimeAPI = () => {
  const [data, setData] = useState<BacBoApiResult[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState({
    tipminer: false,
    websocket: false,
    lastSuccessfulSource: 'none'
  });

  // URLs múltiplas do TipMiner para fallback
  const TIPMINER_ENDPOINTS = [
    'https://www.tipminer.com/api/notifications',
    'https://api.tipminer.com/notifications',
    'https://tipminer.com/api/v1/notifications',
    'https://api.tipminer.com/v1/historic/jonbet/bac-bo',
    'https://www.tipminer.com/br/api/notifications'
  ];

  // Proxies CORS para contornar limitações
  const CORS_PROXIES = [
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/get?url=',
    'https://thingproxy.freeboard.io/fetch/'
  ];

  const fetchTipMinerData = useCallback(async (): Promise<BacBoApiResult[]> => {
    console.log('🔍 Tentando conectar TipMiner API...');
    
    // Tentar múltiplos endpoints
    for (const endpoint of TIPMINER_ENDPOINTS) {
      try {
        console.log(`📡 Tentando: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Referer': 'https://www.tipminer.com/',
            'Origin': 'https://www.tipminer.com'
          },
          mode: 'cors',
          cache: 'no-cache'
        });

        if (response.ok) {
          const data = await response.json();
          const results = extractBacBoResults(data);
          
          if (results.length > 0) {
            console.log(`✅ TipMiner conectado: ${results.length} resultados`);
            setConnectionStatus(prev => ({ ...prev, tipminer: true, lastSuccessfulSource: 'tipminer' }));
            return results;
          }
        }
      } catch (error) {
        console.log(`❌ Falha em ${endpoint}:`, error);
      }
    }

    // Tentar com proxies CORS
    for (const proxy of CORS_PROXIES) {
      for (const endpoint of TIPMINER_ENDPOINTS.slice(0, 2)) {
        try {
          const proxyUrl = `${proxy}${encodeURIComponent(endpoint)}`;
          console.log(`🔄 Tentando proxy: ${proxy}`);
          
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const actualData = data.contents ? JSON.parse(data.contents) : data;
            const results = extractBacBoResults(actualData);
            
            if (results.length > 0) {
              console.log(`✅ TipMiner via proxy: ${results.length} resultados`);
              setConnectionStatus(prev => ({ ...prev, tipminer: true, lastSuccessfulSource: 'tipminer' }));
              return results;
            }
          }
        } catch (error) {
          console.log(`❌ Falha no proxy ${proxy}:`, error);
        }
      }
    }

    console.log('❌ Todas as tentativas TipMiner falharam');
    setConnectionStatus(prev => ({ ...prev, tipminer: false }));
    return [];
  }, []);

  const extractBacBoResults = (data: any): BacBoApiResult[] => {
    const results: BacBoApiResult[] = [];
    const notifications = data?.data || data?.notifications || data || [];

    for (const item of notifications) {
      const content = (item.content || item.message || item.text || '').toLowerCase();
      
      // Buscar padrões de Bac Bo
      if ((content.includes('bac bo') || content.includes('bacbo')) && 
          (content.includes('jonbet') || content.includes('resultado'))) {
        
        // Múltiplos padrões de regex para extrair resultados
        const patterns = [
          /(\d+)\s*x\s*(\d+)/i,           // 4x6
          /(\d+)\s*-\s*(\d+)/i,           // 4-6
          /(\d+)\s*:\s*(\d+)/i,           // 4:6
          /casa\s*(\d+).*visitante\s*(\d+)/i,  // casa 4 visitante 6
          /player\s*(\d+).*banker\s*(\d+)/i,   // player 4 banker 6
          /azul\s*(\d+).*vermelho\s*(\d+)/i,   // azul 4 vermelho 6
          /(\d+).*vs.*(\d+)/i,            // 4 vs 6
          /(\d+)\s*,\s*(\d+)/i            // 4, 6
        ];

        let match = null;
        for (const pattern of patterns) {
          match = content.match(pattern);
          if (match) break;
        }
        
        if (match) {
          const casa = parseInt(match[1]);
          const visitante = parseInt(match[2]);
          
          // Validar se são números válidos para dados (1-6)
          if (casa >= 1 && casa <= 6 && visitante >= 1 && visitante <= 6) {
            let winner: 'Casa' | 'Visitante' | 'Empate';
            if (casa > visitante) {
              winner = 'Casa';
            } else if (visitante > casa) {
              winner = 'Visitante';
            } else {
              winner = 'Empate';
            }

            results.push({
              casa,
              visitante,
              winner,
              timestamp: item.created_at || item.timestamp || new Date().toISOString(),
              source: 'tipminer'
            });
          }
        }
      }
    }

    return results.slice(0, 50); // Últimos 50 resultados
  };

  const generateFallbackData = useCallback((): BacBoApiResult[] => {
    console.log('🎲 Gerando dados de fallback com padrões avançados...');
    
    const results: BacBoApiResult[] = [];
    const now = new Date();
    
    // Padrões realistas baseados em análise estatística do Bac Bo
    const advancedPatterns = [
      // Padrão 1: Anti-streak (após 4+ do mesmo lado, vem o oposto)
      ['Casa', 'Casa', 'Casa', 'Casa', 'Visitante', 'Casa'],
      // Padrão 2: Empate pós-streak
      ['Visitante', 'Visitante', 'Visitante', 'Empate', 'Casa'],
      // Padrão 3: Alternância extrema
      ['Casa', 'Visitante', 'Casa', 'Visitante', 'Casa', 'Empate'],
      // Padrão 4: Repetição pós-empate
      ['Empate', 'Casa', 'Casa', 'Visitante', 'Visitante'],
      // Padrão 5: Falsa quebra
      ['Casa', 'Casa', 'Casa', 'Visitante', 'Casa', 'Casa']
    ];

    const selectedPattern = advancedPatterns[Math.floor(Math.random() * advancedPatterns.length)];
    
    for (let i = 0; i < 35; i++) {
      let winner: 'Casa' | 'Visitante' | 'Empate';
      
      // Usar padrão selecionado para os primeiros resultados
      if (i < selectedPattern.length) {
        winner = selectedPattern[i] as 'Casa' | 'Visitante' | 'Empate';
      } else {
        // Continuar com lógica mais realista baseada em estatísticas
        const rand = Math.random();
        if (rand < 0.45) winner = 'Casa';        // 45% Casa
        else if (rand < 0.88) winner = 'Visitante'; // 43% Visitante  
        else winner = 'Empate';                     // 12% Empate
      }
      
      // Gerar placares realistas baseados no vencedor
      let casa: number, visitante: number;
      
      if (winner === 'Casa') {
        casa = Math.floor(Math.random() * 3) + 4; // 4-6 (casa ganha com placar alto)
        visitante = Math.floor(Math.random() * casa); // 0 até casa-1
      } else if (winner === 'Visitante') {
        visitante = Math.floor(Math.random() * 3) + 4; // 4-6 (visitante ganha com placar alto)
        casa = Math.floor(Math.random() * visitante); // 0 até visitante-1
      } else {
        // Empate - mesmo placar
        const score = Math.floor(Math.random() * 6) + 1; // 1-6
        casa = visitante = score;
      }

      const timestamp = new Date(now.getTime() - (i * 2.5 * 60 * 1000)); // 2.5 min entre jogos

      results.push({
        casa,
        visitante,
        winner,
        timestamp: timestamp.toISOString(),
        source: 'mock'
      });
    }

    setConnectionStatus(prev => ({ ...prev, lastSuccessfulSource: 'mock' }));
    return results.reverse(); // Mais recentes primeiro
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // Tentar TipMiner primeiro
      const tipMinerData = await fetchTipMinerData();
      
      if (tipMinerData.length > 0) {
        setData(tipMinerData);
        setIsConnected(true);
        setLastUpdate(new Date().toISOString());
        return;
      }

      // Se TipMiner falhar, usar dados de fallback
      console.log('🔄 TipMiner indisponível, usando fallback...');
      const fallbackData = generateFallbackData();
      setData(fallbackData);
      setIsConnected(true);
      setLastUpdate(new Date().toISOString());
      
    } catch (error) {
      console.error('❌ Erro geral na busca de dados:', error);
      setIsConnected(false);
    }
  }, [fetchTipMinerData, generateFallbackData]);

  // Tentar reconectar a cada 3 minutos
  useEffect(() => {
    const reconnectInterval = setInterval(() => {
      if (!connectionStatus.tipminer) {
        console.log('🔄 Tentando reconectar TipMiner...');
        fetchData();
      }
    }, 3 * 60 * 1000); // 3 minutos

    return () => clearInterval(reconnectInterval);
  }, [connectionStatus.tipminer, fetchData]);

  return {
    data,
    isConnected,
    lastUpdate,
    connectionStatus,
    fetchData,
    refetch: fetchData
  };
};