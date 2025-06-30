import React, { useMemo } from 'react';
import { History, Clock, TrendingUp } from 'lucide-react';

interface BacBoResult {
  casa: number;
  visitante: number;
  timestamp: string;
  winner: 'Casa' | 'Visitante' | 'Empate';
}

interface PatternHistoryProps {
  results: BacBoResult[];
}

interface HistoryPattern {
  timestamp: string;
  pattern: string;
  description: string;
  confidence: number;
  type: 'high' | 'medium' | 'low';
}

const PatternHistory: React.FC<PatternHistoryProps> = ({ results }) => {
  const patternHistory = useMemo(() => {
    if (results.length < 5) return [];

    const winners = results.map(r => r.winner);
    const history: HistoryPattern[] = [];

    // Detectar padrões históricos nos últimos resultados
    for (let i = 0; i < Math.min(winners.length - 4, 20); i++) {
      const sequence = winners.slice(i, i + 5);
      const timestamp = results[i].timestamp;

      // Streak de 3 ou mais
      if (sequence[0] === sequence[1] && sequence[1] === sequence[2]) {
        history.push({
          timestamp,
          pattern: `Streak de ${sequence[0]}`,
          description: `3+ ${sequence[0]} consecutivos`,
          confidence: 75,
          type: 'high'
        });
      }

      // Alternância
      if (sequence[0] !== sequence[1] && sequence[1] !== sequence[2] && sequence[2] !== sequence[3]) {
        history.push({
          timestamp,
          pattern: 'Alternância',
          description: `${sequence[0]}-${sequence[1]}-${sequence[2]}-${sequence[3]}`,
          confidence: 65,
          type: 'medium'
        });
      }

      // Empate após streak
      if (sequence[0] === sequence[1] && sequence[2] === 'Empate') {
        history.push({
          timestamp,
          pattern: 'Empate Pós-Streak',
          description: `${sequence[0]}-${sequence[1]} → Empate`,
          confidence: 70,
          type: 'high'
        });
      }
    }

    return history.slice(0, 10); // Últimos 10 padrões
  }, [results]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return 'Baixa';
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
        <History size={20} />
        Histórico de Padrões
      </h3>

      {patternHistory.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#6b7280', 
          padding: '2rem',
          fontStyle: 'italic'
        }}>
          Aguardando dados para histórico...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {patternHistory.map((item, index) => (
            <div 
              key={index} 
              className="pattern-item"
              style={{ 
                borderLeft: `4px solid ${getTypeColor(item.type)}`,
                paddingLeft: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <TrendingUp size={14} style={{ color: getTypeColor(item.type) }} />
                    <span style={{ 
                      fontWeight: '500', 
                      fontSize: '0.95rem',
                      color: getTypeColor(item.type)
                    }}>
                      {item.pattern}
                    </span>
                  </div>
                  
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#6b7280',
                    marginBottom: '0.25rem'
                  }}>
                    {item.description}
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#9ca3af'
                  }}>
                    <Clock size={12} />
                    {new Date(item.timestamp).toLocaleTimeString('pt-BR')}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: getTypeColor(item.type),
                    background: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    border: `1px solid ${getTypeColor(item.type)}`
                  }}>
                    {item.confidence}%
                  </div>
                  
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: getTypeColor(item.type),
                    fontWeight: '500'
                  }}>
                    {getTypeLabel(item.type)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {patternHistory.length > 0 && (
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: 'rgba(16, 185, 129, 0.1)', 
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: '#047857'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            📊 Resumo do Histórico
          </div>
          <div>
            • {patternHistory.filter(p => p.type === 'high').length} padrões de alta confiança<br />
            • {patternHistory.filter(p => p.type === 'medium').length} padrões de média confiança<br />
            • Use o histórico para validar padrões atuais
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternHistory;