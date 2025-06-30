import React from 'react';
import { Activity, Clock } from 'lucide-react';

interface BacBoResult {
  casa: number;
  visitante: number;
  timestamp: string;
  winner: 'Casa' | 'Visitante' | 'Empate';
}

interface LiveResultsProps {
  results: BacBoResult[];
}

const LiveResults: React.FC<LiveResultsProps> = ({ results }) => {
  const recentResults = results.slice(0, 10);

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
        <Activity size={20} />
        Resultados ao Vivo
      </h3>

      {recentResults.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#6b7280', 
          padding: '2rem',
          fontStyle: 'italic'
        }}>
          Aguardando resultados...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {recentResults.map((result, index) => (
            <div 
              key={index} 
              className="pattern-item"
              style={{ 
                opacity: index === 0 ? 1 : 0.8 - (index * 0.08),
                transform: index === 0 ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600',
                  minWidth: '80px'
                }}>
                  {result.casa} × {result.visitante}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={14} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {new Date(result.timestamp).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className={`result-badge result-${result.winner.toLowerCase()}`}>
                {result.winner}
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length > 10 && (
        <div style={{ 
          marginTop: '1rem', 
          textAlign: 'center', 
          fontSize: '0.85rem', 
          color: '#6b7280' 
        }}>
          Mostrando os 10 resultados mais recentes de {results.length} total
        </div>
      )}

      <div className="result-history">
        {results.slice(0, 20).map((result, index) => (
          <div 
            key={index}
            className={`result-badge result-${result.winner.toLowerCase()}`}
            style={{ fontSize: '0.7rem' }}
          >
            {result.winner.charAt(0)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveResults;