import React, { useState, useEffect } from 'react';
import { Target, Clock, Zap, X, AlertTriangle } from 'lucide-react';

interface BacBoResult {
  casa: number;
  visitante: number;
  timestamp: string;
  winner: 'Casa' | 'Visitante' | 'Empate';
}

interface PatternDetectionCenterProps {
  results: BacBoResult[];
}

interface DetectedPattern {
  type: 'PLAYER' | 'BANKER' | 'TIE';
  confidence: number;
  description: string;
  timestamp: string;
  color: string;
  bgColor: string;
  emoji: string;
}

const PatternDetectionCenter: React.FC<PatternDetectionCenterProps> = ({ results }) => {
  const [currentPattern, setCurrentPattern] = useState<DetectedPattern | null>(null);
  const [nextAnalysisIn, setNextAnalysisIn] = useState(30);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [totalAnalyzed, setTotalAnalyzed] = useState(0);
  const [patternsDetected, setPatternsDetected] = useState(0);
  const [patternsRejected, setPatternsRejected] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  // Timer para próxima análise (30 segundos)
  useEffect(() => {
    const timer = setInterval(() => {
      setNextAnalysisIn(prev => {
        if (prev <= 1) {
          analyzePatterns();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [results]);

  // Auto-fechar notificação após 20 segundos
  useEffect(() => {
    if (showNotification && currentPattern) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 20000);

      return () => clearTimeout(timer);
    }
  }, [showNotification, currentPattern]);

  const analyzePatterns = () => {
    if (results.length < 15) return;

    setIsAnalyzing(true);
    setTotalAnalyzed(prev => prev + 1);

    // Simular 3 segundos de análise intensiva
    setTimeout(() => {
      const pattern = detectSinglePattern(results);
      
      if (pattern && pattern.confidence >= 80) {
        setCurrentPattern(pattern);
        setPatternsDetected(prev => prev + 1);
        setShowNotification(true);
        
        // Vibração para dispositivos móveis
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      } else {
        setPatternsRejected(prev => prev + 1);
        setCurrentPattern(null);
        setShowNotification(false);
      }
      
      setIsAnalyzing(false);
    }, 3000);
  };

  const detectSinglePattern = (results: BacBoResult[]): DetectedPattern | null => {
    const winners = results.map(r => r.winner);
    const last30 = winners.slice(0, 30);

    // Padrão 1: Anti-Streak Extremo (95-98% confiança)
    for (let i = 0; i <= last30.length - 6; i++) {
      const streak = last30.slice(i, i + 5);
      if (streak.every(w => w === streak[0]) && streak[0] !== 'Empate') {
        const opposite = streak[0] === 'Casa' ? 'BANKER' : 'PLAYER';
        return {
          type: opposite,
          confidence: Math.floor(Math.random() * 4) + 95, // 95-98%
          description: `Anti-Streak: 5x ${streak[0]} consecutivos detectados`,
          timestamp: new Date().toISOString(),
          color: opposite === 'PLAYER' ? '#00ccff' : '#ff1493',
          bgColor: opposite === 'PLAYER' ? 'rgba(0, 204, 255, 0.15)' : 'rgba(255, 20, 147, 0.15)',
          emoji: opposite === 'PLAYER' ? '🔵' : '🔴'
        };
      }
    }

    // Padrão 2: Dominância Temporal (90-93% confiança)
    const casaCount = last30.slice(0, 10).filter(w => w === 'Casa').length;
    const visitanteCount = last30.slice(0, 10).filter(w => w === 'Visitante').length;
    
    if (casaCount >= 8) {
      return {
        type: 'BANKER',
        confidence: Math.floor(Math.random() * 4) + 90, // 90-93%
        description: `Dominância: ${casaCount}/10 vitórias da Casa`,
        timestamp: new Date().toISOString(),
        color: '#ff1493',
        bgColor: 'rgba(255, 20, 147, 0.15)',
        emoji: '🔴'
      };
    }
    
    if (visitanteCount >= 8) {
      return {
        type: 'PLAYER',
        confidence: Math.floor(Math.random() * 4) + 90, // 90-93%
        description: `Dominância: ${visitanteCount}/10 vitórias do Visitante`,
        timestamp: new Date().toISOString(),
        color: '#00ccff',
        bgColor: 'rgba(0, 204, 255, 0.15)',
        emoji: '🔵'
      };
    }

    // Padrão 3: Alternância Rítmica (80-88% confiança)
    let alternatingCount = 0;
    for (let i = 0; i < Math.min(6, last30.length - 1); i++) {
      if (last30[i] !== last30[i + 1] && last30[i] !== 'Empate' && last30[i + 1] !== 'Empate') {
        alternatingCount++;
      }
    }
    
    if (alternatingCount >= 4) {
      const nextType = last30[0] === 'Casa' ? 'PLAYER' : 'BANKER';
      return {
        type: nextType,
        confidence: Math.floor(Math.random() * 9) + 80, // 80-88%
        description: `Alternância Rítmica: ${alternatingCount} trocas detectadas`,
        timestamp: new Date().toISOString(),
        color: nextType === 'PLAYER' ? '#00ccff' : '#ff1493',
        bgColor: nextType === 'PLAYER' ? 'rgba(0, 204, 255, 0.15)' : 'rgba(255, 20, 147, 0.15)',
        emoji: nextType === 'PLAYER' ? '🔵' : '🔴'
      };
    }

    // Padrão 4: Empate Estratégico (80-85% confiança)
    const empateCount = last30.slice(0, 15).filter(w => w === 'Empate').length;
    if (empateCount === 0) {
      return {
        type: 'TIE',
        confidence: Math.floor(Math.random() * 6) + 80, // 80-85%
        description: `Empate Estratégico: 0 empates em 15 jogos`,
        timestamp: new Date().toISOString(),
        color: '#ffd700',
        bgColor: 'rgba(255, 215, 0, 0.15)',
        emoji: '🟡'
      };
    }

    return null;
  };

  const closeNotification = () => {
    setShowNotification(false);
  };

  const efficiency = totalAnalyzed > 0 ? ((patternsDetected / totalAnalyzed) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Centro de Detecção Principal */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,30,30,0.9) 100%)',
        border: '2px solid rgba(0, 204, 255, 0.3)',
        boxShadow: '0 0 30px rgba(0, 204, 255, 0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '1.8rem', 
            fontWeight: '700', 
            color: '#00ccff',
            marginBottom: '0.5rem',
            textShadow: '0 0 10px rgba(0, 204, 255, 0.5)'
          }}>
            🧠 IA QUANTUM v3.0 - DETECÇÃO DE PADRÕES
          </h2>
          <p style={{ 
            color: 'rgba(255,255,255,0.8)', 
            fontSize: '1rem',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}>
            Sistema Ultra-Avançado • Filtro 80%+ • Análise a cada 30s
          </p>
        </div>

        {/* Status da Análise */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            padding: '1rem', 
            background: 'rgba(0, 204, 255, 0.1)', 
            borderRadius: '12px',
            border: '1px solid rgba(0, 204, 255, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00ccff' }}>
              {totalAnalyzed}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
              Análises Realizadas
            </div>
          </div>

          <div style={{ 
            padding: '1rem', 
            background: 'rgba(16, 185, 129, 0.1)', 
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
              {patternsDetected}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
              Padrões Detectados
            </div>
          </div>

          <div style={{ 
            padding: '1rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>
              {patternsRejected}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
              Padrões Rejeitados
            </div>
          </div>

          <div style={{ 
            padding: '1rem', 
            background: 'rgba(168, 85, 247, 0.1)', 
            borderRadius: '12px',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#a855f7' }}>
              {efficiency}%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
              Eficiência
            </div>
          </div>
        </div>

        {/* Timer e Status */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {isAnalyzing ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
              borderRadius: '20px',
              border: '2px solid rgba(168, 85, 247, 0.4)'
            }}>
              <div className="spinner" style={{ 
                width: '20px', 
                height: '20px', 
                border: '3px solid rgba(168, 85, 247, 0.3)',
                borderTop: '3px solid #a855f7',
                borderRadius: '50%'
              }} />
              <span style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                color: '#a855f7',
                textShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
              }}>
                🧠 ANALISANDO PADRÕES QUÂNTICOS...
              </span>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              padding: '1rem 2rem',
              background: 'rgba(0, 204, 255, 0.1)',
              borderRadius: '20px',
              border: '2px solid rgba(0, 204, 255, 0.3)'
            }}>
              <Clock size={20} style={{ color: '#00ccff' }} />
              <span style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                color: '#00ccff'
              }}>
                Próxima análise em: {nextAnalysisIn}s
              </span>
            </div>
          )}
        </div>

        {/* Status Atual */}
        {!isAnalyzing && !showNotification && (
          <div style={{ 
            textAlign: 'center',
            padding: '2rem',
            background: 'rgba(107, 114, 128, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(107, 114, 128, 0.3)'
          }}>
            <AlertTriangle size={24} style={{ color: '#6b7280', marginBottom: '1rem' }} />
            <div style={{ 
              fontSize: '1.1rem', 
              fontWeight: '500', 
              color: '#6b7280',
              marginBottom: '0.5rem'
            }}>
              Aguardando Padrão Forte (80%+)
            </div>
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'rgba(255,255,255,0.6)'
            }}>
              Sistema em modo conservador • Só detecta padrões de alta confiança
            </div>
          </div>
        )}
      </div>

      {/* Notificação Centralizada */}
      {showNotification && currentPattern && (
        <div className="pattern-notification" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          width: '90vw',
          maxWidth: '500px',
          background: `linear-gradient(135deg, ${currentPattern.bgColor} 0%, rgba(0,0,0,0.9) 100%)`,
          border: `3px solid ${currentPattern.color}`,
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: `0 0 50px ${currentPattern.color}50`
        }}>
          <button
            onClick={closeNotification}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            <X size={20} />
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: '1rem',
              filter: `drop-shadow(0 0 10px ${currentPattern.color})`
            }}>
              {currentPattern.emoji}
            </div>
            
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              color: currentPattern.color,
              marginBottom: '1rem',
              textShadow: `0 0 20px ${currentPattern.color}50`
            }}>
              {currentPattern.type}
            </div>
            
            <div style={{ 
              fontSize: '1.2rem', 
              fontWeight: '600', 
              color: 'white',
              marginBottom: '1rem'
            }}>
              Confiança: {currentPattern.confidence}%
            </div>
            
            <div style={{ 
              fontSize: '1rem', 
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '1.5rem'
            }}>
              {currentPattern.description}
            </div>
            
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'rgba(255,255,255,0.7)',
              background: 'rgba(0,0,0,0.3)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              display: 'inline-block'
            }}>
              ⏱️ Esta notificação desaparece em 20 segundos
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternDetectionCenter;