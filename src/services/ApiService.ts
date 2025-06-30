import { BacBoApiResult } from '../types/common';

class ApiService {
  private static readonly TIPMINER_URL = 'https://www.tipminer.com/api/notifications';
  
  static async fetchBacBoResults(): Promise<BacBoApiResult[]> {
    try {
      // Em produção, você faria uma chamada real para a API
      // const response = await fetch(this.TIPMINER_URL, {
      //   headers: {
      //     'User-Agent': 'Mozilla/5.0'
      //   }
      // });
      
      // Para demonstração, vamos simular dados
      return this.generateMockData();
      
    } catch (error) {
      console.error('Erro ao buscar dados da TipMiner:', error);
      throw error;
    }
  }

  private static generateMockData(): BacBoApiResult[] {
    const results: BacBoApiResult[] = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
      const casa = Math.floor(Math.random() * 6) + 1;
      const visitante = Math.floor(Math.random() * 6) + 1;
      
      let winner: 'Casa' | 'Visitante' | 'Empate';
      if (casa > visitante) {
        winner = 'Casa';
      } else if (visitante > casa) {
        winner = 'Visitante';
      } else {
        winner = 'Empate';
      }

      const timestamp = new Date(now.getTime() - (i * 2 * 60 * 1000)); // 2 minutos entre cada jogo

      results.push({
        casa,
        visitante,
        winner,
        timestamp: timestamp.toISOString(),
        source: 'mock'
      });
    }

    return results.reverse(); // Mais recentes primeiro
  }

  static async parseTipMinerResponse(data: any): Promise<BacBoApiResult[]> {
    const results: BacBoApiResult[] = [];

    for (const item of data.data || []) {
      const content = item.content?.toLowerCase() || '';
      
      if (content.includes('bac bo') && content.includes('jonbet')) {
        const match = content.match(/(\d+)x(\d+)/);
        
        if (match) {
          const casa = parseInt(match[1]);
          const visitante = parseInt(match[2]);
          
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
            timestamp: item.created_at || new Date().toISOString(),
            source: 'tipminer'
          });
        }
      }
    }

    return results;
  }
}

export default ApiService;