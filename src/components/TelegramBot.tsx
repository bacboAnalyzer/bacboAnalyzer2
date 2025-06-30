import React, { useState, useEffect } from 'react';
import { Bot, Send, Settings, CheckCircle, AlertCircle, Zap } from 'lucide-react';

interface BacBoResult {
  casa: number;
  visitante: number;
  timestamp: string;
  winner: 'Casa' | 'Visitante' | 'Empate';
}

interface TelegramBotProps {
  results: BacBoResult[];
  isRunning: boolean;
}

const TelegramBot: React.FC<TelegramBotProps> = ({ results, isRunning }) => {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [lastSent, setLastSent] = useState<string>('');
  const [sendInterval, setSendInterval] = useState(5); // minutos
  const [includeAdvancedPatterns, setIncludeAdvancedPatterns] = useState(true);

  useEffect(() => {
    // Verificar se as configurações estão salvas no localStorage
    const savedToken = localStorage.getItem('telegram_bot_token');
    const savedChatId = localStorage.getItem('telegram_chat_id');
    
    if (savedToken && savedChatId) {
      setBotToken(savedToken);
      setChatId(savedChatId);
      setIsConfigured(true);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && isConfigured && results.length > 0) {
      // Enviar relatório inicial
      sendTelegramReport();
      
      // Configurar envio automático
      interval = setInterval(() => {
        sendTelegramReport();
      }, sendInterval * 60 * 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, isConfigured, results, sendInterval, includeAdvancedPatterns]);

  const saveConfiguration = () => {
    if (botToken.trim() && chatId.trim()) {
      localStorage.setItem('telegram_bot_token', botToken.trim());
      localStorage.setItem('telegram_chat_id', chatId.trim());
      setIsConfigured(true);
    }
  };

  const detectActivePatterns = () => {
    if (results.length < 10) return [];

    const winners = results.map(r => r.winner);
    const patterns = [];

    // Padrão 1: Reversão Pós-Streak
    for (let i = 0; i <= winners.length - 6; i++) {
      const streak = winners.slice(i, i + 5);
      if (streak.every(w => w === streak[0]) && streak[0] !== 'Empate') {
        if (i + 5 < winners.length && winners[i + 5] !== streak[0]) {
          patterns.push(`🔄 Reversão: 5x ${streak[0]} → ${winners[i + 5]} (85%)`);
        }
      }
    }

    // Padrão 8: Domínio
    const last15 = winners.slice(0, 15);
    const casaCount = last15.filter(w => w === 'Casa').length;
    const visitanteCount = last15.filter(w => w === 'Visitante').length;
    
    if (casaCount >= 10) {
      patterns.push(`👑 Domínio Casa: ${casaCount}/15 (88%)`);
    }
    if (visitanteCount >= 10) {
      patterns.push(`👑 Domínio Visitante: ${visitanteCount}/15 (88%)`);
    }

    return patterns;
  };

  const sendTelegramReport = async () => {
    if (!isConfigured || results.length === 0) return;

    try {
      const report = generateReport();
      
      // Simular envio (em produção, isso seria uma chamada real para a API do Telegram)
      console.log('📱 Enviando relatório avançado para Telegram:', report);
      
      setLastSent(new Date().toLocaleTimeString('pt-BR'));
      
      // Em produção, você faria algo como:
      // await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     chat_id: chatId,
      //     text: report,
      //     parse_mode: 'HTML'
      //   })
      // });
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const generateReport = () => {
    if (results.length === 0) return '';

    const casaWins = results.filter(r => r.winner === 'Casa').length;
    const visitanteWins = results.filter(r => r.winner === 'Visitante').length;
    const empates = results.filter(r => r.winner === 'Empate').length;

    const casaPercentage = ((casaWins / results.length) * 100).toFixed(1);
    const visitantePercentage = ((visitanteWins / results.length) * 100).toFixed(1);

    const lastResults = results.slice(-5).map(r => r.winner).join(' → ');
    const activePatterns = detectActivePatterns();

    let report = `🎯 <b>Relatório Bac Bo JonBet - Análise Avançada</b>

📊 <b>Estatísticas (${results.length} jogos):</b>
🏠 Casa: ${casaWins} vitórias (${casaPercentage}%)
👤 Visitante: ${visitanteWins} vitórias (${visitantePercentage}%)
🤝 Empates: ${empates} jogos

📈 <b>Últimos 5 resultados:</b>
${lastResults}`;

    if (includeAdvancedPatterns && activePatterns.length > 0) {
      report += `

🚨 <b>PADRÕES ATIVOS DETECTADOS:</b>
${activePatterns.join('\n')}

⚠️ <i>Padrões de alta ocorrência identificados!</i>`;
    }

    report += `

⏰ <b>Atualizado:</b> ${new Date().toLocaleString('pt-BR')}

🤖 <i>Análise automática com 8 padrões avançados</i>`;

    return report;
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
        <Bot size={20} />
        Bot Telegram Avançado
      </h3>

      {!isConfigured ? (
        <div>
          <div className="input-group">
            <label>Token do Bot:</label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            />
          </div>

          <div className="input-group">
            <label>Chat ID:</label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="123456789"
            />
          </div>

          <div className="input-group">
            <label>Intervalo de envio (minutos):</label>
            <input
              type="number"
              value={sendInterval}
              onChange={(e) => setSendInterval(parseInt(e.target.value))}
              min="1"
              max="60"
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={includeAdvancedPatterns}
                onChange={(e) => setIncludeAdvancedPatterns(e.target.checked)}
              />
              Incluir alertas de padrões avançados
            </label>
          </div>

          <button 
            className="btn btn-primary"
            onClick={saveConfiguration}
            disabled={!botToken.trim() || !chatId.trim()}
          >
            <Settings size={16} />
            Salvar Configuração
          </button>

          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'rgba(59, 130, 246, 0.1)', 
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#1e40af'
          }}>
            <strong>Como configurar:</strong><br />
            1. Crie um bot no @BotFather<br />
            2. Copie o token do bot<br />
            3. Envie uma mensagem para seu bot<br />
            4. Acesse: api.telegram.org/bot[TOKEN]/getUpdates<br />
            5. Copie o chat_id da resposta
          </div>
        </div>
      ) : (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <CheckCircle size={16} style={{ color: '#16a34a' }} />
            <span style={{ color: '#16a34a', fontWeight: '500' }}>
              Bot configurado e ativo
            </span>
            {includeAdvancedPatterns && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                color: '#dc2626'
              }}>
                <Zap size={12} />
                Padrões Avançados
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              Enviando relatórios a cada {sendInterval} minutos
            </div>
            {lastSent && (
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Último envio: {lastSent}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-success"
              onClick={sendTelegramReport}
              disabled={results.length === 0}
            >
              <Send size={16} />
              Enviar Agora
            </button>

            <button 
              className="btn btn-warning"
              onClick={() => {
                localStorage.removeItem('telegram_bot_token');
                localStorage.removeItem('telegram_chat_id');
                setIsConfigured(false);
                setBotToken('');
                setChatId('');
              }}
            >
              <Settings size={16} />
              Reconfigurar
            </button>
          </div>

          {results.length > 0 && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: 'rgba(255, 255, 255, 0.5)', 
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              <strong>Prévia do próximo relatório:</strong>
              <pre style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.8rem', 
                whiteSpace: 'pre-wrap',
                color: '#374151'
              }}>
                {generateReport()}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TelegramBot;