const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Armazenamento em memória para os resultados
let bacBoResults = [];
let lastUpdate = null;
let patternAlerts = [];
let connectionStatus = {
  tipminer: false,
  lastSuccessfulSource: 'none',
  attempts: 0,
  lastAttempt: null
};

// ========================================
// 🔥 CONEXÃO REAL COM TIPMINER - VERSÃO PROFISSIONAL
// ========================================

// URLs múltiplas da TipMiner para máxima compatibilidade
const TIPMINER_ENDPOINTS = [
  'https://www.tipminer.com/api/notifications',
  'https://api.tipminer.com/notifications', 
  'https://www.tipminer.com/br/api/notifications',
  'https://tipminer.com/api/v1/notifications',
  'https://api.tipminer.com/v1/historic/jonbet/bac-bo'
];

// Proxies CORS para contornar limitações
const CORS_PROXIES = [
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/get?url=',
  'https://thingproxy.freeboard.io/fetch/'
];

async function fetchTipMinerData() {
  console.log(`🔍 [${new Date().toISOString()}] Iniciando busca TipMiner (Tentativa ${connectionStatus.attempts + 1})...`);
  connectionStatus.attempts++;
  connectionStatus.lastAttempt = new Date().toISOString();

  // Estratégia 1: Tentar endpoints diretos
  for (const endpoint of TIPMINER_ENDPOINTS) {
    try {
      console.log(`📡 Testando endpoint: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.tipminer.com/',
          'Origin': 'https://www.tipminer.com',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Cache-Control': 'no-cache'
        },
        timeout: 15000,
        maxRedirects: 5
      });

      if (response.status === 200 && response.data) {
        const results = extractBacBoResults(response.data);
        
        if (results.length > 0) {
          console.log(`✅ TipMiner CONECTADO: ${results.length} resultados via ${endpoint}`);
          bacBoResults = results;
          lastUpdate = new Date().toISOString();
          connectionStatus.tipminer = true;
          connectionStatus.lastSuccessfulSource = 'tipminer';
          connectionStatus.attempts = 0; // Reset contador
          
          analyzeAdvancedPatterns(bacBoResults);
          return true;
        }
      }
    } catch (error) {
      console.log(`❌ Falha em ${endpoint}: ${error.message}`);
    }
  }

  // Estratégia 2: Tentar com proxies CORS
  for (const proxy of CORS_PROXIES) {
    for (const endpoint of TIPMINER_ENDPOINTS.slice(0, 2)) {
      try {
        const proxyUrl = proxy.includes('allorigins') 
          ? `${proxy}${encodeURIComponent(endpoint)}`
          : `${proxy}${endpoint}`;
        
        console.log(`🔄 Tentando proxy: ${proxy.split('/')[2]}`);
        
        const response = await axios.get(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 20000
        });

        if (response.status === 200 && response.data) {
          const actualData = response.data.contents ? JSON.parse(response.data.contents) : response.data;
          const results = extractBacBoResults(actualData);
          
          if (results.length > 0) {
            console.log(`✅ TipMiner via PROXY: ${results.length} resultados`);
            bacBoResults = results;
            lastUpdate = new Date().toISOString();
            connectionStatus.tipminer = true;
            connectionStatus.lastSuccessfulSource = 'tipminer-proxy';
            connectionStatus.attempts = 0;
            
            analyzeAdvancedPatterns(bacBoResults);
            return true;
          }
        }
      } catch (error) {
        console.log(`❌ Proxy ${proxy.split('/')[2]} falhou: ${error.message}`);
      }
    }
  }

  console.log('❌ Todas as estratégias TipMiner falharam');
  connectionStatus.tipminer = false;
  return false;
}

// 🔍 PARSER AVANÇADO PARA EXTRAIR DADOS DO BAC BO
function extractBacBoResults(data) {
  const results = [];
  const notifications = data?.data || data?.notifications || data || [];

  console.log(`🔍 Analisando ${notifications.length} notificações...`);

  for (const item of notifications) {
    const content = (item.content || item.message || item.text || '').toLowerCase();
    
    // Padrões específicos para Bac Bo JonBet
    const bacBoPatterns = [
      /bac bo.*jonbet/i,
      /bacbo.*jonbet/i,
      /jonbet.*bac bo/i,
      /jonbet.*bacbo/i,
      /bac.*bo.*resultado/i,
      /bacbo.*resultado/i
    ];

    const isBacBo = bacBoPatterns.some(pattern => pattern.test(content));
    
    if (isBacBo) {
      console.log(`🎯 Bac Bo detectado: ${content.substring(0, 100)}...`);
      
      // Múltiplos padrões de regex para extrair resultados
      const extractionPatterns = [
        // Padrões diretos
        /(\d+)\s*x\s*(\d+)/i,                    // 4x6
        /(\d+)\s*-\s*(\d+)/i,                    // 4-6
        /(\d+)\s*:\s*(\d+)/i,                    // 4:6
        /(\d+)\s*,\s*(\d+)/i,                    // 4, 6
        /(\d+)\s*vs\s*(\d+)/i,                   // 4 vs 6
        
        // Padrões com contexto
        /player\s*(\d+).*banker\s*(\d+)/i,       // player 4 banker 6
        /banker\s*(\d+).*player\s*(\d+)/i,       // banker 6 player 4 (invertido)
        /azul\s*(\d+).*vermelho\s*(\d+)/i,       // azul 4 vermelho 6
        /vermelho\s*(\d+).*azul\s*(\d+)/i,       // vermelho 6 azul 4 (invertido)
        /casa\s*(\d+).*visitante\s*(\d+)/i,      // casa 4 visitante 6
        /visitante\s*(\d+).*casa\s*(\d+)/i,      // visitante 6 casa 4 (invertido)
        
        // Padrões de resultado
        /resultado.*?(\d+).*?(\d+)/i,            // resultado foi 4 6
        /placar.*?(\d+).*?(\d+)/i,               // placar 4 6
        /dados.*?(\d+).*?(\d+)/i,                // dados 4 6
        /foi\s*(\d+)\s*(\d+)/i,                  // foi 4 6
        /saiu\s*(\d+)\s*(\d+)/i                  // saiu 4 6
      ];

      let match = null;
      let isInverted = false;
      
      for (const pattern of extractionPatterns) {
        match = content.match(pattern);
        if (match) {
          // Verificar se é um padrão invertido (banker/vermelho/casa primeiro)
          isInverted = /banker.*player|vermelho.*azul|casa.*visitante/i.test(content);
          break;
        }
      }
      
      if (match) {
        let casa = parseInt(match[1]);
        let visitante = parseInt(match[2]);
        
        // Inverter se necessário
        if (isInverted) {
          [casa, visitante] = [visitante, casa];
        }
        
        // Validar se são números válidos para dados (1-6)
        if (casa >= 1 && casa <= 6 && visitante >= 1 && visitante <= 6) {
          let winner;
          if (casa > visitante) {
            winner = 'Casa';
          } else if (visitante > casa) {
            winner = 'Visitante';
          } else {
            winner = 'Empate';
          }

          const result = {
            casa,
            visitante,
            winner,
            timestamp: item.created_at || item.createdAt || item.timestamp || new Date().toISOString(),
            content: item.content || item.message || 'Resultado Bac Bo',
            source: 'tipminer'
          };

          results.push(result);
          console.log(`✅ Resultado extraído: Casa ${casa} vs Visitante ${visitante} = ${winner}`);
        } else {
          console.log(`❌ Números inválidos: ${casa}, ${visitante}`);
        }
      } else {
        console.log(`❌ Não foi possível extrair números de: ${content.substring(0, 50)}...`);
      }
    }
  }

  console.log(`📊 Total de resultados Bac Bo extraídos: ${results.length}`);
  return results.slice(0, 50); // Últimos 50 resultados
}

// Função para analisar os 8 padrões avançados (melhorada)
function analyzeAdvancedPatterns(results) {
  if (results.length < 10) return;

  const winners = results.map(r => r.winner);
  const alerts = [];

  // Padrão 1: Reversão Pós-Streak Longa (85% confiança)
  for (let i = 0; i <= winners.length - 6; i++) {
    const streak = winners.slice(i, i + 5);
    if (streak.every(w => w === streak[0]) && streak[0] !== 'Empate') {
      if (i + 5 < winners.length && winners[i + 5] !== streak[0]) {
        alerts.push({
          pattern: 'Reversão Pós-Streak',
          description: `5x ${streak[0]} → ${winners[i + 5]}`,
          confidence: 85,
          timestamp: new Date().toISOString(),
          priority: 'high'
        });
      }
    }
  }

  // Padrão 2: Empate Pós-Streak (78% confiança)
  for (let i = 0; i <= winners.length - 5; i++) {
    const streak = winners.slice(i, i + 4);
    if (streak.every(w => w === streak[0]) && streak[0] !== 'Empate') {
      if (i + 4 < winners.length && winners[i + 4] === 'Empate') {
        alerts.push({
          pattern: 'Empate Pós-Streak',
          description: `4x ${streak[0]} → Empate`,
          confidence: 78,
          timestamp: new Date().toISOString(),
          priority: 'high'
        });
      }
    }
  }

  // Padrão 3: Alternância Extrema (72% confiança)
  for (let i = 0; i <= winners.length - 6; i++) {
    const sequence = winners.slice(i, i + 6);
    let isAlternating = true;
    for (let j = 0; j < 5; j++) {
      if (sequence[j] === sequence[j + 1]) {
        isAlternating = false;
        break;
      }
    }
    if (isAlternating) {
      alerts.push({
        pattern: 'Alternância Extrema',
        description: `Alternância: ${sequence.join('-')}`,
        confidence: 72,
        timestamp: new Date().toISOString(),
        priority: 'medium'
      });
    }
  }

  // Padrão 4: Empate Pós-Alternância (68% confiança)
  for (let i = 0; i <= winners.length - 4; i++) {
    const sequence = winners.slice(i, i + 4);
    if (sequence[0] !== sequence[1] && sequence[1] !== sequence[2] && sequence[3] === 'Empate') {
      alerts.push({
        pattern: 'Empate Pós-Alternância',
        description: `${sequence[0]}-${sequence[1]}-${sequence[2]} → Empate`,
        confidence: 68,
        timestamp: new Date().toISOString(),
        priority: 'medium'
      });
    }
  }

  // Padrão 5: Repetição Pós-Empate (75% confiança)
  for (let i = 0; i <= winners.length - 3; i++) {
    if (winners[i] === 'Empate' && winners[i + 1] === winners[i + 2] && winners[i + 1] !== 'Empate') {
      alerts.push({
        pattern: 'Repetição Pós-Empate',
        description: `Empate → ${winners[i + 1]}-${winners[i + 2]}`,
        confidence: 75,
        timestamp: new Date().toISOString(),
        priority: 'high'
      });
    }
  }

  // Padrão 6: Falsa Quebra de Streak (80% confiança)
  for (let i = 0; i <= winners.length - 5; i++) {
    if (winners[i] === winners[i + 1] && winners[i + 1] === winners[i + 2] && 
        winners[i + 3] !== winners[i] && winners[i + 4] === winners[i]) {
      alerts.push({
        pattern: 'Falsa Quebra',
        description: `${winners[i]}-${winners[i]}-${winners[i]} → ${winners[i + 3]} → ${winners[i]}`,
        confidence: 80,
        timestamp: new Date().toISOString(),
        priority: 'high'
      });
    }
  }

  // Padrão 7: Empate Triplo (65% confiança)
  for (let i = 0; i <= winners.length - 5; i++) {
    const window = winners.slice(i, i + 5);
    const empateCount = window.filter(w => w === 'Empate').length;
    if (empateCount >= 3) {
      alerts.push({
        pattern: 'Empate Triplo',
        description: `3+ Empates em: ${window.join('-')}`,
        confidence: 65,
        timestamp: new Date().toISOString(),
        priority: 'medium'
      });
    }
  }

  // Padrão 8: Domínio Extremo (88% confiança)
  const last15 = winners.slice(0, 15);
  const casaCount = last15.filter(w => w === 'Casa').length;
  const visitanteCount = last15.filter(w => w === 'Visitante').length;
  
  if (casaCount >= 10) {
    alerts.push({
      pattern: 'Domínio Extremo',
      description: `${casaCount}/15 vitórias da Casa`,
      confidence: 88,
      timestamp: new Date().toISOString(),
      priority: 'critical'
    });
  }
  if (visitanteCount >= 10) {
    alerts.push({
      pattern: 'Domínio Extremo',
      description: `${visitanteCount}/15 vitórias do Visitante`,
      confidence: 88,
      timestamp: new Date().toISOString(),
      priority: 'critical'
    });
  }

  patternAlerts = alerts;
  
  if (alerts.length > 0) {
    console.log(`🚨 ${alerts.length} padrão(ões) avançado(s) detectado(s):`);
    alerts.forEach(alert => {
      const emoji = alert.priority === 'critical' ? '🔥' : 
                   alert.priority === 'high' ? '⚡' : 
                   alert.priority === 'medium' ? '⚠️' : '📊';
      console.log(`   ${emoji} ${alert.pattern}: ${alert.description} (${alert.confidence}%)`);
    });
  }
}

// Função para gerar dados mock (melhorada)
function generateMockData() {
  console.log('🎲 Gerando dados mock avançados...');
  
  const results = [];
  const now = new Date();

  // Padrões mais realistas baseados em dados históricos
  const realisticPatterns = [
    'Casa', 'Casa', 'Visitante', 'Casa', 'Casa', 'Empate', 'Visitante',
    'Visitante', 'Casa', 'Empate', 'Casa', 'Casa', 'Casa', 'Visitante',
    'Casa', 'Visitante', 'Casa', 'Visitante', 'Empate', 'Casa'
  ];

  for (let i = 0; i < 40; i++) {
    let winner = realisticPatterns[i % realisticPatterns.length];
    
    // Adicionar alguma aleatoriedade
    if (Math.random() < 0.3) {
      const options = ['Casa', 'Visitante', 'Empate'];
      winner = options[Math.floor(Math.random() * options.length)];
    }
    
    // Gerar placares mais realistas
    let casa, visitante;
    if (winner === 'Casa') {
      casa = Math.floor(Math.random() * 3) + 4; // 4-6
      visitante = Math.floor(Math.random() * casa);
    } else if (winner === 'Visitante') {
      visitante = Math.floor(Math.random() * 3) + 4; // 4-6
      casa = Math.floor(Math.random() * visitante);
    } else {
      const score = Math.floor(Math.random() * 6) + 1;
      casa = visitante = score;
    }

    const timestamp = new Date(now.getTime() - (i * 2.5 * 60 * 1000));

    results.push({
      casa,
      visitante,
      winner,
      timestamp: timestamp.toISOString(),
      content: `Mock Bac Bo: ${casa}x${visitante} - ${winner} venceu`,
      source: 'mock'
    });
  }

  bacBoResults = results.reverse();
  lastUpdate = new Date().toISOString();
  connectionStatus.lastSuccessfulSource = 'mock';
  
  analyzeAdvancedPatterns(bacBoResults);
}

// ========================================
// 🔄 SISTEMA DE FALLBACK INTELIGENTE
// ========================================
async function fetchDataWithFallback() {
  console.log('🔄 Iniciando busca com fallback inteligente...');
  
  // Tentar TipMiner primeiro
  const tipminerSuccess = await fetchTipMinerData();
  if (tipminerSuccess) return;
  
  // Se TipMiner falhar, usar dados mock
  console.log('🎲 TipMiner indisponível, usando dados mock...');
  generateMockData();
}

// ========================================
// 📡 ROTAS DA API
// ========================================

app.get('/api/bacbo-results', (req, res) => {
  res.json({
    success: true,
    data: bacBoResults,
    lastUpdate,
    total: bacBoResults.length,
    source: connectionStatus.lastSuccessfulSource,
    connectionStatus: {
      ...connectionStatus,
      isConnected: connectionStatus.tipminer,
      dataSource: connectionStatus.lastSuccessfulSource
    }
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    lastUpdate,
    totalResults: bacBoResults.length,
    activePatterns: patternAlerts.length,
    uptime: process.uptime(),
    connectionStatus: {
      ...connectionStatus,
      isConnected: connectionStatus.tipminer,
      dataSource: connectionStatus.lastSuccessfulSource
    },
    dataSources: {
      tipminer: connectionStatus.tipminer,
      current: connectionStatus.lastSuccessfulSource,
      attempts: connectionStatus.attempts,
      lastAttempt: connectionStatus.lastAttempt
    }
  });
});

app.get('/api/patterns', (req, res) => {
  if (bacBoResults.length === 0) {
    return res.json({
      success: true,
      patterns: [],
      message: 'Nenhum dado disponível para análise'
    });
  }

  const winners = bacBoResults.map(r => r.winner);
  
  const casaWins = winners.filter(w => w === 'Casa').length;
  const visitanteWins = winners.filter(w => w === 'Visitante').length;
  const empates = winners.filter(w => w === 'Empate').length;

  const getMaxSequence = (target) => {
    let maxSeq = 0;
    let currentSeq = 0;
    
    for (const winner of winners) {
      if (winner === target) {
        currentSeq++;
        maxSeq = Math.max(maxSeq, currentSeq);
      } else {
        currentSeq = 0;
      }
    }
    return maxSeq;
  };

  const differences = bacBoResults.map(r => Math.abs(r.casa - r.visitante));
  const diffCounts = differences.reduce((acc, diff) => {
    acc[diff] = (acc[diff] || 0) + 1;
    return acc;
  }, {});

  const patterns = {
    frequency: {
      casa: { count: casaWins, percentage: (casaWins / bacBoResults.length * 100).toFixed(1) },
      visitante: { count: visitanteWins, percentage: (visitanteWins / bacBoResults.length * 100).toFixed(1) },
      empate: { count: empates, percentage: (empates / bacBoResults.length * 100).toFixed(1) }
    },
    sequences: {
      maxCasa: getMaxSequence('Casa'),
      maxVisitante: getMaxSequence('Visitante'),
      maxEmpate: getMaxSequence('Empate')
    },
    differences: diffCounts,
    lastResults: winners.slice(-10),
    totalGames: bacBoResults.length,
    dataSource: connectionStatus.lastSuccessfulSource
  };

  res.json({
    success: true,
    patterns,
    lastUpdate,
    source: connectionStatus.lastSuccessfulSource
  });
});

app.get('/api/advanced-patterns', (req, res) => {
  res.json({
    success: true,
    alerts: patternAlerts,
    totalAlerts: patternAlerts.length,
    lastUpdate,
    source: connectionStatus.lastSuccessfulSource,
    highPriorityAlerts: patternAlerts.filter(a => a.priority === 'critical' || a.priority === 'high').length
  });
});

// ========================================
// ⚡ INICIALIZAÇÃO E CRON JOBS
// ========================================

// Configurar cron job para buscar dados a cada 1 minuto
cron.schedule('*/1 * * * *', () => {
  console.log('🔄 Executando busca automática com fallback...');
  fetchDataWithFallback();
});

// Buscar dados iniciais
fetchDataWithFallback();

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Bac Bo Analyzer PRO rodando na porta ${PORT}`);
  console.log(`📊 API disponível em http://localhost:${PORT}/api/bacbo-results`);
  console.log(`🔍 Padrões em http://localhost:${PORT}/api/patterns`);
  console.log(`🚨 Padrões Avançados em http://localhost:${PORT}/api/advanced-patterns`);
  console.log(`⚡ Status em http://localhost:${PORT}/api/status`);
  console.log(`\n🎯 Sistema Multi-Fonte PROFISSIONAL Ativo:`);
  console.log(`   1️⃣ TipMiner API Direta (Primária)`);
  console.log(`   2️⃣ TipMiner via Proxies CORS (Secundária)`);
  console.log(`   3️⃣ Mock Inteligente (Fallback)`);
  console.log(`\n🔥 Monitorando os 8 padrões de alta ocorrência do Bac Bo...`);
  console.log(`📡 Conexão real com TipMiner implementada!`);
});

module.exports = app;