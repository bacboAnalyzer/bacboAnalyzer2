import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, RotateCcw, Shuffle, Target, Repeat, Zap, Crown } from 'lucide-react';

interface BacBoResult {
  casa: number;
  visitante: number;
  timestamp: string;
  winner: 'Casa' | 'Visitante' | 'Empate';
}

interface AdvancedPatternsProps {
  results: BacBoResult[];
}

interface PatternAlert {
  id: number;
  name: string;
  description: string;
  detected: boolean;
  confidence: number;
  icon: React.ReactNode;
  color: string;
  details: string;
}

const AdvancedPatterns: React.FC<AdvancedPatternsProps> = ({ results }) => {
  const patternAlerts = useMemo(() => {
    if (results.length < 10) return [];

    const winners = results.map(r => r.winner);
    const alerts: PatternAlert[] = [];

    // Padrão 1: Reversão Pós-Streak Longa (5 ou mais do mesmo lado)
    const detectReversaoStreak = () => {
      for (let i = 0; i <= winners.length - 6; i++) {
        const streak = winners.slice(i, i + 5);
        if (streak.every(w => w === streak[0]) && streak[0] !== 'Empate') {
          if (i + 5 < winners.length && winners[i + 5] !== streak[0]) {
            return {
              detected: true,
              confidence: 85,
              details: `5x ${streak[0]} → ${winners[i + 5]}`
            };
          }
        }
      }
      return { detected: false, confidence: 0, details: '' };
    };

    // Padrão 2: Empate Pós-Streak (4 ou mais do mesmo lado)
    const detectEmpateStreak = () => {
      for (let i = 0; i <= winners.length - 5; i++) {
        const streak = winners.slice(i, i + 4);
        if (streak.every(w => w === streak[0]) && streak[0] !== 'Empate') {
          if (i + 4 < winners.length && winners[i + 4] === 'Empate') {
            return {
              detected: true,
              confidence: 78,
              details: `4x ${streak[0]} → Empate`
            };
          }
        }
      }
      return { detected: false, confidence: 0, details: '' };
    };

    // Padrão 3: Alternância Extrema (3x ou mais)
    const detectAlternancia = () => {
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
          return {
            detected: true,
            confidence: 72,
            details: `Alternância: ${sequence.join('-')}`
          };
        }
      }
      return { detected: false, confidence: 0, details: '' };
    };

    // Padrão 4: Empate Após Alternância
    const detectEmpateAlternancia = () => {
      for (let i = 0; i <= winners.length - 4; i++) {
        const sequence = winners.slice(i, i + 4);
        if (sequence[0] !== sequence[1] && sequence[1] !== sequence[2] && sequence[3] === 'Empate') {
          return {
            detected: true,
            confidence: 68,
            details: `${sequence[0]}-${sequence[1]}-${sequence[2]} → Empate`
          };
        }
      }
      return { detected: false, confidence: 0, details: '' };
    };

    // Padrão 5: Repetição Pós-Empate
    const detectRepeticaoEmpate = () => {
      for (let i = 0; i <= winners.length - 3; i++) {
        if (winners[i] === 'Empate' && winners[i + 1] === winners[i + 2] && winners[i + 1] !== 'Empate') {
          return {
            detected: true,
            confidence: 75,
            details: `Empate → ${winners[i + 1]}-${winners[i + 2]}`
          };
        }
      }
      return { detected: false, confidence: 0, details: '' };
    };

    // Padrão 6: Falsa Quebra de Streak
    const detectFalsaQuebra = () => {
      for (let i = 0; i <= winners.length - 5; i++) {
        if (winners[i] === winners[i + 1] && winners[i + 1] === winners[i + 2] && 
            winners[i + 3] !== winners[i] && winners[i + 4] === winners[i]) {
          return {
            detected: true,
            confidence: 80,
            details: `${winners[i]}-${winners[i]}-${winners[i]} → ${winners[i + 3]} → ${winners[i]}`
          };
        }
      }
      return { detected: false, confidence: 0, details: '' };
    };

    // Padrão 7: Empate Triplo
    const detectEmpateTriple = () => {
      for (let i = 0; i <= winners.length - 5; i++) {
        const window = winners.slice(i, i + 5);
        const empateCount = window.filter(w => w === 'Empate').length;
        if (empateCount >= 3) {
          return {
            detected: true,
            confidence: 65,
            details: `3+ Empates em: ${window.join('-')}`
          };
        }
      }
      return { detected: false, confidence: 0, details: '' };
    };

    // Padrão 8: Tendência de Domínio
    const detectDominio = () => {
      const last15 = winners.slice(0, 15);
      const casaCount = last15.filter(w => w === 'Casa').length;
      const visitanteCount = last15.filter(w => w === 'Visitante').length;
      
      if (casaCount >= 10) {
        return {
          detected: true,
          confidence: 88,
          details: `${casaCount}/15 vitórias da Casa`,
          side: 'Casa'
        };
      }
      if (visitanteCount >= 10) {
        return {
          detected: true,
          confidence: 88,
          details: `${visitanteCount}/15 vitórias do Visitante`,
          side: 'Visitante'
        };
      }
      return { detected: false, confidence: 0, details: '', side: '' };
    };

    // Executar todas as detecções
    const reversao = detectReversaoStreak();
    const empateStreak = detectEmpateStreak();
    const alternancia = detectAlternancia();
    const empateAlternancia = detectEmpateAlternancia();
    const repeticaoEmpate = detectRepeticaoEmpate();
    const falsaQuebra = detectFalsaQuebra();
    const empateTriple = detectEmpateTriple();
    const dominio = detectDominio();

    // Criar alertas
    alerts.push({
      id: 1,
      name: 'Reversão Pós-Streak',
      description: 'Após 5+ do mesmo lado, vem o oposto',
      detected: reversao.detected,
      confidence: reversao.confidence,
      icon: <RotateCcw size={16} />,
      color: '#ef4444',
      details: reversao.details
    });

    alerts.push({
      id: 2,
      name: 'Empate Pós-Streak',
      description: 'Após 4+ do mesmo lado, vem empate',
      detected: empateStreak.detected,
      confidence: empateStreak.confidence,
      icon: <Target size={16} />,
      color: '#f59e0b',
      details: empateStreak.details
    });

    alerts.push({
      id: 3,
      name: 'Alternância Extrema',
      description: 'Alternando 3x ou mais seguidas',
      detected: alternancia.detected,
      confidence: alternancia.confidence,
      icon: <Shuffle size={16} />,
      color: '#8b5cf6',
      details: alternancia.details
    });

    alerts.push({
      id: 4,
      name: 'Empate Pós-Alternância',
      description: 'Empate após alternâncias duplas/triplas',
      detected: empateAlternancia.detected,
      confidence: empateAlternancia.confidence,
      icon: <TrendingUp size={16} />,
      color: '#06b6d4',
      details: empateAlternancia.details
    });

    alerts.push({
      id: 5,
      name: 'Repetição Pós-Empate',
      description: '2x seguidas após empate',
      detected: repeticaoEmpate.detected,
      confidence: repeticaoEmpate.confidence,
      icon: <Repeat size={16} />,
      color: '#10b981',
      details: repeticaoEmpate.details
    });

    alerts.push({
      id: 6,
      name: 'Falsa Quebra',
      description: '1 oposto e volta ao padrão',
      detected: falsaQuebra.detected,
      confidence: falsaQuebra.confidence,
      icon: <Zap size={16} />,
      color: '#f97316',
      details: falsaQuebra.details
    });

    alerts.push({
      id: 7,
      name: 'Empate Triplo',
      description: '3 empates com intervalos curtos',
      detected: empateTriple.detected,
      confidence: empateTriple.confidence,
      icon: <AlertTriangle size={16} />,
      color: '#6366f1',
      details: empateTriple.details
    });

    alerts.push({
      id: 8,
      name: 'Domínio Extremo',
      description: '10+ de um lado em 15 jogos',
      detected: dominio.detected,
      confidence: dominio.confidence,
      icon: <Crown size={16} />,
      color: '#dc2626',
      details: dominio.details
    });

    return alerts;
  }, [results]);

  const activeAlerts = patternAlerts.filter(alert => alert.detected);
  const totalPatterns = patternAlerts.length;
  const activePatterns = activeAlerts.length;

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
        <AlertTriangle size={20} />
        Padrões Avançados ({activePatterns}/{totalPatterns})
      </h3>

      {results.length < 10 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#6b7280', 
          padding: '2rem',
          fontStyle: 'italic'
        }}>
          Aguardando mais dados para análise avançada...
          <br />
          <small>Mínimo: 10 resultados</small>
        </div>
      ) : (
        <>
          {activeAlerts.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                padding: '1rem', 
                background: 'linear-gradient(135deg, #fee2e2 0%, #fef3c7 100%)', 
                borderRadius: '8px',
                border: '1px solid #fbbf24',
                marginBottom: '1rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  fontWeight: '600',
                  color: '#dc2626',
                  marginBottom: '0.5rem'
                }}>
                  <AlertTriangle size={16} />
                  {activeAlerts.length} Padrão(ões) Ativo(s) Detectado(s)!
                </div>
                <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
                  Monitore estes padrões para possíveis oportunidades
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {patternAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`pattern-item ${alert.detected ? 'pattern-active' : ''}`}
                style={{ 
                  border: alert.detected ? `2px solid ${alert.color}` : '1px solid #e5e7eb',
                  background: alert.detected ? `${alert.color}15` : 'rgba(255, 255, 255, 0.5)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <div style={{ color: alert.color }}>
                    {alert.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '500', 
                      fontSize: '0.95rem',
                      color: alert.detected ? alert.color : '#374151'
                    }}>
                      {alert.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#6b7280',
                      marginTop: '0.25rem'
                    }}>
                      {alert.description}
                    </div>
                    {alert.detected && alert.details && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: alert.color,
                        fontWeight: '500',
                        marginTop: '0.25rem'
                      }}>
                        📊 {alert.details}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {alert.detected && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      color: alert.color,
                      background: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      border: `1px solid ${alert.color}`
                    }}>
                      {alert.confidence}%
                    </div>
                  )}
                  
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%',
                    background: alert.detected ? alert.color : '#d1d5db'
                  }} />
                </div>

                {alert.detected && (
                  <div className="pattern-pulse-indicator" style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '8px',
                    height: '8px',
                    background: alert.color,
                    borderRadius: '50%'
                  }} />
                )}
              </div>
            ))}
          </div>

          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: 'rgba(59, 130, 246, 0.1)', 
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#1e40af'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
              📈 Análise baseada nos últimos {results.length} jogos
            </div>
            <div>
              • Padrões com 65%+ de confiança são considerados significativos<br />
              • Monitore padrões ativos para identificar oportunidades<br />
              • Combine múltiplos padrões para maior precisão
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdvancedPatterns;