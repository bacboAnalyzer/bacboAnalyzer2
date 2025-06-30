const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// Armazenamento em memória para dados do scraper
let scrapedData = [];
let lastScrapeTime = null;
let scrapeStatus = {
  isRunning: false,
  lastError: null,
  totalScraped: 0,
  successRate: 0,
  attempts: 0,
  successes: 0
};

// ========================================
// 🕷️ SCRAPER PUPPETEER MULTI-SITE
// ========================================

const SCRAPE_TARGETS = [
  {
    name: 'Betano',
    url: 'https://www.betano.com/casino/live/bac-bo/',
    selectors: {
      player: '.score__value:first-child, .player-score, [data-testid="player-score"]',
      banker: '.score__value:last-child, .banker-score, [data-testid="banker-score"]',
      winner: '.game-state__result, .winner-indicator, [data-testid="winner"]',
      gameActive: '.live-game-active, .game-running, [data-testid="game-active"]'
    }
  },
  {
    name: 'Stake',
    url: 'https://stake.com/casino/live/bac-bo',
    selectors: {
      player: '.player-dice, .dice-player, [data-cy="player-dice"]',
      banker: '.banker-dice, .dice-banker, [data-cy="banker-dice"]',
      winner: '.round-winner, .game-winner, [data-cy="winner"]',
      gameActive: '.game-active, .live-indicator, [data-cy="live"]'
    }
  },
  {
    name: 'JonBet',
    url: 'https://jonbet.com/casino/live/bac-bo',
    selectors: {
      player: '.player-result, .dice-1, [data-game="player"]',
      banker: '.banker-result, .dice-2, [data-game="banker"]',
      winner: '.winner-display, .result-winner, [data-game="winner"]',
      gameActive: '.live-game, .active-round, [data-game="active"]'
    }
  }
];

async function createBrowser() {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      timeout: 30000
    });
    
    console.log('🚀 Browser Puppeteer iniciado com sucesso');
    return browser;
  } catch (error) {
    console.error('❌ Erro ao iniciar browser:', error.message);
    throw error;
  }
}

async function scrapeSite(browser, target) {
  const page = await browser.newPage();
  
  try {
    console.log(`🔍 Iniciando scrape: ${target.name}`);
    
    // Configurar página
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navegar para o site
    await page.goto(target.url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Aguardar elementos carregarem
    await page.waitForTimeout(5000);
    
    // Tentar extrair dados com múltiplos seletores
    const result = await page.evaluate((selectors) => {
      function trySelectors(selectorList) {
        const selectors = selectorList.split(', ');
        for (const selector of selectors) {
          const element = document.querySelector(selector.trim());
          if (element) {
            return element.textContent?.trim() || element.innerText?.trim() || '';
          }
        }
        return null;
      }
      
      const playerText = trySelectors(selectors.player);
      const bankerText = trySelectors(selectors.banker);
      const winnerText = trySelectors(selectors.winner);
      const gameActiveText = trySelectors(selectors.gameActive);
      
      // Extrair números dos textos
      const playerMatch = playerText?.match(/\d+/);
      const bankerMatch = bankerText?.match(/\d+/);
      
      const player = playerMatch ? parseInt(playerMatch[0]) : null;
      const banker = bankerMatch ? parseInt(bankerMatch[0]) : null;
      
      // Determinar vencedor
      let winner = null;
      if (player !== null && banker !== null) {
        if (player > banker) {
          winner = 'Casa';
        } else if (banker > player) {
          winner = 'Visitante';
        } else {
          winner = 'Empate';
        }
      } else if (winnerText) {
        const winnerLower = winnerText.toLowerCase();
        if (winnerLower.includes('player') || winnerLower.includes('azul') || winnerLower.includes('casa')) {
          winner = 'Casa';
        } else if (winnerLower.includes('banker') || winnerLower.includes('vermelho') || winnerLower.includes('visitante')) {
          winner = 'Visitante';
        } else if (winnerLower.includes('tie') || winnerLower.includes('empate') || winnerLower.includes('amarelo')) {
          winner = 'Empate';
        }
      }
      
      return {
        player,
        banker,
        winner,
        playerText,
        bankerText,
        winnerText,
        gameActive: gameActiveText,
        timestamp: new Date().toISOString()
      };
    }, target.selectors);
    
    console.log(`📊 ${target.name} - Resultado:`, result);
    
    // Validar dados
    if (result.player !== null && result.banker !== null && 
        result.player >= 1 && result.player <= 6 && 
        result.banker >= 1 && result.banker <= 6) {
      
      const scrapedResult = {
        casa: result.player,
        visitante: result.banker,
        winner: result.winner,
        timestamp: result.timestamp,
        source: `scraper-${target.name.toLowerCase()}`,
        site: target.name,
        raw: {
          playerText: result.playerText,
          bankerText: result.bankerText,
          winnerText: result.winnerText,
          gameActive: result.gameActive
        }
      };
      
      console.log(`✅ ${target.name} - Dados válidos extraídos:`, scrapedResult);
      return scrapedResult;
    } else {
      console.log(`❌ ${target.name} - Dados inválidos ou incompletos`);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ Erro no scrape ${target.name}:`, error.message);
    return null;
  } finally {
    await page.close();
  }
}

async function performScraping() {
  if (scrapeStatus.isRunning) {
    console.log('⏳ Scraping já em andamento, pulando...');
    return;
  }
  
  scrapeStatus.isRunning = true;
  scrapeStatus.attempts++;
  scrapeStatus.lastError = null;
  
  let browser = null;
  
  try {
    console.log('🕷️ Iniciando ciclo de scraping...');
    browser = await createBrowser();
    
    const results = [];
    
    // Tentar scraping em paralelo (mais rápido)
    const scrapePromises = SCRAPE_TARGETS.map(target => 
      scrapeSite(browser, target).catch(error => {
        console.error(`❌ Falha no scrape ${target.name}:`, error.message);
        return null;
      })
    );
    
    const scrapeResults = await Promise.allSettled(scrapePromises);
    
    // Processar resultados
    for (const result of scrapeResults) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    }
    
    if (results.length > 0) {
      // Adicionar novos resultados (evitar duplicatas)
      const newResults = results.filter(newResult => {
        return !scrapedData.some(existing => 
          existing.casa === newResult.casa && 
          existing.visitante === newResult.visitante &&
          Math.abs(new Date(existing.timestamp).getTime() - new Date(newResult.timestamp).getTime()) < 60000 // 1 minuto
        );
      });
      
      if (newResults.length > 0) {
        scrapedData = [...newResults, ...scrapedData].slice(0, 100); // Manter últimos 100
        lastScrapeTime = new Date().toISOString();
        scrapeStatus.totalScraped += newResults.length;
        scrapeStatus.successes++;
        
        console.log(`✅ Scraping concluído: ${newResults.length} novos resultados de ${results.length} sites`);
      } else {
        console.log('📊 Scraping concluído: Nenhum resultado novo');
      }
    } else {
      console.log('❌ Scraping falhou: Nenhum resultado obtido');
    }
    
    // Calcular taxa de sucesso
    scrapeStatus.successRate = ((scrapeStatus.successes / scrapeStatus.attempts) * 100).toFixed(1);
    
  } catch (error) {
    console.error('❌ Erro geral no scraping:', error.message);
    scrapeStatus.lastError = error.message;
  } finally {
    if (browser) {
      await browser.close();
    }
    scrapeStatus.isRunning = false;
  }
}

// ========================================
// 📡 ROTAS DA API DO SCRAPER
// ========================================

app.get('/api/scraper/data', (req, res) => {
  res.json({
    success: true,
    data: scrapedData,
    lastScrapeTime,
    status: scrapeStatus,
    total: scrapedData.length,
    sources: [...new Set(scrapedData.map(item => item.site))]
  });
});

app.get('/api/scraper/status', (req, res) => {
  res.json({
    success: true,
    status: scrapeStatus,
    lastScrapeTime,
    totalResults: scrapedData.length,
    availableSites: SCRAPE_TARGETS.map(t => t.name),
    uptime: process.uptime()
  });
});

app.post('/api/scraper/manual', async (req, res) => {
  try {
    console.log('🔄 Scraping manual solicitado via API');
    performScraping(); // Não aguardar para resposta rápida
    res.json({
      success: true,
      message: 'Scraping manual iniciado',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// ⚡ INICIALIZAÇÃO E CRON JOBS
// ========================================

// Scraping automático a cada 2 minutos
cron.schedule('*/2 * * * *', () => {
  console.log('🔄 Executando scraping automático...');
  performScraping();
});

// Scraping inicial
setTimeout(() => {
  console.log('🚀 Iniciando primeiro scraping...');
  performScraping();
}, 5000); // Aguardar 5 segundos para o servidor inicializar

// Iniciar servidor do scraper
app.listen(PORT, () => {
  console.log(`🕷️ Servidor Scraper Puppeteer rodando na porta ${PORT}`);
  console.log(`📊 API Scraper disponível em http://localhost:${PORT}/api/scraper/data`);
  console.log(`⚡ Status em http://localhost:${PORT}/api/scraper/status`);
  console.log(`🔄 Scraping manual em http://localhost:${PORT}/api/scraper/manual`);
  console.log(`\n🎯 Sites de Scraping Configurados:`);
  SCRAPE_TARGETS.forEach((target, index) => {
    console.log(`   ${index + 1}️⃣ ${target.name}: ${target.url}`);
  });
  console.log(`\n🔥 Scraping automático a cada 2 minutos...`);
});

module.exports = app;