import React from 'react';
import { Globe, Activity, Clock, Zap, AlertCircle, CheckCircle, Play } from 'lucide-react';
import { useScraperAPI } from '../hooks/useScraperAPI';

const ScraperStatus: React.FC = () => {
  const { 
    data, 
    status, 
    lastScrapeTime, 
    isConnected, 
    sources, 
    triggerManualScrape 
  } = useScraperAPI();

  const handleManualScrape = async () => {
    const success = await triggerManualScrape();
    if (success) {
      // Feedback visual pode ser adicionado aqui
    }
  };

  return (
    <div className="card">
      <h3 style={{ 
        fontSize: '1.25rem', 
        fontWeight: '600', 
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Globe size={20} />
        Status do Scraper Puppeteer
      </h3>

      {/* Status de Conexão */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: isConnected ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 20, 147, 0.1)',
        borderRadius: '12px',
        border: `1px solid ${isConnected ? '#00ff88' : '#ff1493'}30`
      }}>
        {isConnected ? (
          <CheckCircle size={20} style={{ color: '#00ff88' }} />
        ) : (
          <AlertCircle size={20} style={{ color: '#ff1493' }} />
        )}
        <div>
          <div style={{ 
            fontWeight: '600', 
            color: isConnected ? '#00ff88' : '#ff1493'
          }}>
            {isConnected ? 'Scraper Conectado' : 'Scraper Desconectado'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
            {isConnected ? 
              `${data.length} resultados • ${sources.length} fontes ativas` : 
              'Verifique se o servidor do scraper está rodando'
            }
          </div>
        </div>
      </div>

      {isConnected && (
        <>
          {/* Estatísticas do Scraper */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ 
              padding: '1rem', 
              background: 'rgba(0, 204, 255, 0.1)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00ccff' }}>
                {status.totalScraped}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                Total Coletado
              </div>
            </div>

            <div style={{ 
              padding: '1rem', 
              background: 'rgba(0, 255, 136, 0.1)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00ff88' }}>
                {status.successRate}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                Taxa de Sucesso
              </div>
            </div>

            <div style={{ 
              padding: '1rem', 
              background: 'rgba(255, 215, 0, 0.1)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffd700' }}>
                {status.attempts}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                Tentativas
              </div>
            </div>

            <div style={{ 
              padding: '1rem', 
              background: status.isRunning ? 'rgba(168, 85, 247, 0.1)' : 'rgba(107, 114, 128, 0.1)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <Activity size={20} style={{ 
                color: status.isRunning ? '#a855f7' : '#6b7280',
                margin: '0 auto 0.5rem'
              }} />
              <div style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600',
                color: status.isRunning ? '#a855f7' : '#6b7280'
              }}>
                {status.isRunning ? 'Executando' : 'Aguardando'}
              </div>
            </div>
          </div>

          {/* Fontes Ativas */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              color: '#00ccff'
            }}>
              Fontes de Scraping Ativas
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {sources.map((source, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(0, 204, 255, 0.2)',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#00ccff',
                    border: '1px solid rgba(0, 204, 255, 0.3)'
                  }}
                >
                  {source}
                </div>
              ))}
              {sources.length === 0 && (
                <div style={{ 
                  color: 'rgba(255,255,255,0.6)', 
                  fontStyle: 'italic',
                  fontSize: '0.9rem'
                }}>
                  Nenhuma fonte ativa no momento
                </div>
              )}
            </div>
          </div>

          {/* Últimos Resultados do Scraper */}
          {data.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                color: '#00ccff'
              }}>
                Últimos Resultados (Scraper)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.slice(0, 5).map((result, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: 'rgba(40, 40, 40, 0.6)',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '600' }}>
                        {result.casa} × {result.visitante}
                      </span>
                      <span style={{ 
                        marginLeft: '0.5rem',
                        color: result.winner === 'Casa' ? '#ff1493' : 
                              result.winner === 'Visitante' ? '#00ccff' : '#ffd700'
                      }}>
                        ({result.winner})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: '#00ccff',
                        background: 'rgba(0, 204, 255, 0.2)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px'
                      }}>
                        {result.site}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                        {new Date(result.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controles */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              className="btn btn-primary"
              onClick={handleManualScrape}
              disabled={status.isRunning}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Play size={16} />
              {status.isRunning ? 'Executando...' : 'Scraping Manual'}
            </button>

            {lastScrapeTime && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.7)'
              }}>
                <Clock size={14} />
                Último: {new Date(lastScrapeTime).toLocaleTimeString('pt-BR')}
              </div>
            )}
          </div>

          {/* Erro */}
          {status.lastError && (
            <div style={{ 
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(255, 20, 147, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 20, 147, 0.3)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#ff1493',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                <AlertCircle size={16} />
                Último Erro
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                {status.lastError}
              </div>
            </div>
          )}
        </>
      )}

      {/* Instruções */}
      <div style={{ 
        marginTop: '1.5rem',
        padding: '1rem', 
        background: 'linear-gradient(135deg, rgba(0, 204, 255, 0.1) 0%, rgba(255, 20, 147, 0.1) 100%)', 
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: '#00ccff',
        border: '1px solid rgba(0, 204, 255, 0.3)'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
          🕷️ Sistema de Scraping Puppeteer
        </div>
        <div>
          • <strong>Automático:</strong> Coleta dados a cada 2 minutos<br />
          • <strong>Multi-Site:</strong> Betano, Stake, JonBet simultaneamente<br />
          • <strong>Validação:</strong> Apenas dados válidos (1-6) são salvos<br />
          • <strong>Comando:</strong> <code>npm run scraper</code> para iniciar
        </div>
      </div>
    </div>
  );
};

export default ScraperStatus;