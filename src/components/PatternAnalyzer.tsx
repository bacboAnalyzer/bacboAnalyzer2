import React, { useMemo } from 'react';
import { TrendingUp, Target, BarChart3 } from 'lucide-react';

interface BacBoResult {
  casa: number;
  visitante: number;
  timestamp: string;
  winner: 'Casa' | 'Visitante' | 'Empate';
}

interface PatternAnalyzerProps {
  results: BacBoResult[];
}

interface Pattern {
  name: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}

const PatternAnalyzer: React.FC<PatternAnalyzerProps> = ({ results }) => {
  const patterns = useMemo(() => {
    if (results.length === 0) return [];

    const winners = results.map(r => r.winner);
    const patterns: Pattern[] = [];

    // Padrão 1: Frequência de vitórias
    const casaWins = winners.filter(w => w === 'Casa').length;
    const visitanteWins = winners.filter(w => w === 'Visitante').length;
    const empates = winners.filter(w => w === 'Empate').length;

    patterns.push({
      name: 'Vitórias Casa',
      value: casaWins,
      description: `${((casaWins / results.length) * 100).toFixed(1)}% dos jogos`,
      icon: <Target size={16} />
    });

    patterns.push({
      name: 'Vitórias Visitante',
      value: visitanteWins,
      description: `${((visitanteWins / results.length) * 100).toFixed(1)}% dos jogos`,
      icon: <Target size={16} />
    });

    // Padrão 2: Maior sequência
    const getMaxSequence = (target: string) => {
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

    const maxCasaSeq = getMaxSequence('Casa');
    const maxVisitanteSeq = getMaxSequence('Visitante');

    patterns.push({
      name: 'Maior Seq. Casa',
      value: maxCasaSeq,
      description: `${maxCasaSeq} vitórias seguidas`,
      icon: <TrendingUp size={16} />
    });

    patterns.push({
      name: 'Maior Seq. Visitante',
      value: maxVisitanteSeq,
      description: `${maxVisitanteSeq} vitórias seguidas`,
      icon: <TrendingUp size={16} />
    });

    // Padrão 3: Diferenças de pontos mais comuns
    const differences = results.map(r => Math.abs(r.casa - r.visitante));
    const diffCounts = differences.reduce((acc, diff) => {
      acc[diff] = (acc[diff] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const mostCommonDiff = Object.entries(diffCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostCommonDiff) {
      patterns.push({
        name: 'Diferença Comum',
        value: parseInt(mostCommonDiff[0]),
        description: `${mostCommonDiff[1]} jogos com diferença de ${mostCommonDiff[0]}`,
        icon: <BarChart3 size={16} />
      });
    }

    return patterns;
  }, [results]);

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
        <TrendingUp size={20} />
        Análise de Padrões
      </h3>

      {patterns.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#6b7280', 
          padding: '2rem',
          fontStyle: 'italic'
        }}>
          Aguardando dados para análise...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {patterns.map((pattern, index) => (
            <div key={index} className="pattern-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: '#667eea' }}>
                  {pattern.icon}
                </div>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>
                    {pattern.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {pattern.description}
                  </div>
                </div>
              </div>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: '#667eea' 
              }}>
                {pattern.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: 'rgba(102, 126, 234, 0.1)', 
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: '#4f46e5'
        }}>
          <strong>Total de jogos analisados:</strong> {results.length}
        </div>
      )}
    </div>
  );
};

export default PatternAnalyzer;