import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Zap, Calculator, DollarSign } from 'lucide-react';

interface AnalyticsModeProps {
  isVisible: boolean;
  onClose: () => void;
  currentBalance: number;
}

interface AnalyticsConfig {
  mode: 'normal' | 'medium' | 'advanced';
  dailyGoal: number;
  riskLevel: number;
  betPercentage: number;
  expectedReturn: number;
}

interface DailyProjection {
  mode: string;
  expectedProfit: number;
  profitPercentage: number;
  estimatedTime: number;
  riskLevel: string;
  betAmount: number;
  gamesNeeded: number;
}

const AnalyticsMode: React.FC<AnalyticsModeProps> = ({ isVisible, onClose, currentBalance }) => {
  const [config, setConfig] = useState<AnalyticsConfig>({
    mode: 'normal',
    dailyGoal: 200,
    riskLevel: 2,
    betPercentage: 5,
    expectedReturn: 15
  });

  const [projections, setProjections] = useState<DailyProjection[]>([]);

  // Calcular projeções para cada modo
  useEffect(() => {
    const calculateProjections = () => {
      const modes = [
        {
          name: 'normal',
          label: 'Normal',
          riskMultiplier: 1,
          returnMultiplier: 1,
          accuracyRate: 0.65,
          betPercentage: 3,
          color: '#00ff88'
        },
        {
          name: 'medium',
          label: 'Médio',
          riskMultiplier: 1.5,
          returnMultiplier: 1.8,
          accuracyRate: 0.72,
          betPercentage: 5,
          color: '#ffd700'
        },
        {
          name: 'advanced',
          label: 'Avançado',
          riskMultiplier: 2.5,
          returnMultiplier: 3.2,
          accuracyRate: 0.78,
          betPercentage: 8,
          color: '#ff1493'
        }
      ];

      const newProjections = modes.map(mode => {
        const betAmount = (currentBalance * mode.betPercentage) / 100;
        const profitPerBet = betAmount * 0.95; // 95% payout
        const expectedWinRate = mode.accuracyRate;
        
        // Cálculo considerando sistema Martingale
        const avgProfit = (profitPerBet * expectedWinRate) - (betAmount * (1 - expectedWinRate) * 2.5);
        const gamesPerHour = 80; // ~45s por jogo
        const hoursNeeded = config.dailyGoal / (avgProfit * gamesPerHour);
        const gamesNeeded = Math.ceil(config.dailyGoal / avgProfit);
        
        const dailyProfit = avgProfit * gamesPerHour * 8; // 8 horas de jogo
        const profitPercentage = (dailyProfit / currentBalance) * 100;

        return {
          mode: mode.label,
          expectedProfit: Math.max(0, dailyProfit),
          profitPercentage: Math.max(0, profitPercentage),
          estimatedTime: Math.min(12, Math.max(1, hoursNeeded)),
          riskLevel: mode.name,
          betAmount,
          gamesNeeded: Math.max(1, gamesNeeded)
        };
      });

      setProjections(newProjections);
    };

    calculateProjections();
  }, [currentBalance, config.dailyGoal]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'normal': return '#00ff88';
      case 'medium': return '#ffd700';
      case 'advanced': return '#ff1493';
      default: return '#6b7280';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'normal': return 'Baixo Risco';
      case 'medium': return 'Risco Médio';
      case 'advanced': return 'Alto Risco';
      default: return 'Desconhecido';
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 30, 30, 0.9) 100%)',
        borderRadius: '20px',
        padding: '2rem',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '2px solid rgba(0, 204, 255, 0.3)',
        boxShadow: '0 0 50px rgba(0, 204, 255, 0.2)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{ 
            fontSize: '1.8rem', 
            fontWeight: '700',
            background: 'linear-gradient(135deg, #00ccff 0%, #ff1493 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            📊 Analytics & Projeções
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Configurações */}
        <div style={{ 
          padding: '1.5rem', 
          background: 'rgba(40, 40, 40, 0.8)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ 
            fontSize: '1.2rem', 
            fontWeight: '600', 
            marginBottom: '1.5rem',
            color: '#00ccff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Calculator size={20} />
            Configurações de Análise
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', display: 'block' }}>
                Meta Diária (R$)
              </label>
              <input
                type="number"
                value={config.dailyGoal}
                onChange={(e) => setConfig(prev => ({ ...prev, dailyGoal: parseFloat(e.target.value) || 0 }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(0, 204, 255, 0.3)',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: 'white',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', display: 'block' }}>
                Banca Atual (R$)
              </label>
              <input
                type="number"
                value={currentBalance}
                disabled
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Projeções por Modo */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            fontSize: '1.2rem', 
            fontWeight: '600', 
            marginBottom: '1.5rem',
            color: '#00ccff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <BarChart3 size={20} />
            Projeções por Modo de Jogo
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {projections.map((projection, index) => (
              <div 
                key={index}
                style={{ 
                  padding: '1.5rem', 
                  background: `linear-gradient(135deg, ${getRiskColor(projection.riskLevel)}20 0%, rgba(0, 0, 0, 0.8) 100%)`,
                  borderRadius: '12px',
                  border: `2px solid ${getRiskColor(projection.riskLevel)}50`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  padding: '0.25rem 0.75rem',
                  background: getRiskColor(projection.riskLevel),
                  color: '#000',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {projection.mode.toUpperCase()}
                </div>

                <h4 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '700', 
                  color: getRiskColor(projection.riskLevel),
                  marginBottom: '1rem'
                }}>
                  Modo {projection.mode}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Lucro Esperado:</span>
                    <span style={{ 
                      fontWeight: '700', 
                      color: '#00ff88',
                      fontSize: '1.1rem'
                    }}>
                      R$ {projection.expectedProfit.toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Retorno (%):</span>
                    <span style={{ 
                      fontWeight: '700', 
                      color: '#ffd700',
                      fontSize: '1.1rem'
                    }}>
                      +{projection.profitPercentage.toFixed(1)}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Tempo Estimado:</span>
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#00ccff'
                    }}>
                      {projection.estimatedTime.toFixed(1)}h
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Valor por Aposta:</span>
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#ff1493'
                    }}>
                      R$ {projection.betAmount.toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Jogos Necessários:</span>
                    <span style={{ 
                      fontWeight: '600', 
                      color: 'white'
                    }}>
                      ~{projection.gamesNeeded}
                    </span>
                  </div>

                  <div style={{ 
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      color: getRiskColor(projection.riskLevel),
                      fontWeight: '600'
                    }}>
                      {getRiskLabel(projection.riskLevel)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo e Recomendações */}
        <div style={{ 
          padding: '1.5rem', 
          background: 'linear-gradient(135deg, rgba(0, 204, 255, 0.1) 0%, rgba(255, 20, 147, 0.1) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 204, 255, 0.3)'
        }}>
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '#00ccff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Target size={18} />
            Recomendações Inteligentes
          </h3>
          
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: '#00ff88' }}>💡 Modo Normal:</strong> Ideal para iniciantes. Menor risco, retorno estável e consistente.
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: '#ffd700' }}>⚡ Modo Médio:</strong> Equilibrio entre risco e retorno. Recomendado para traders experientes.
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: '#ff1493' }}>🔥 Modo Avançado:</strong> Alto risco, alto retorno. Apenas para especialistas com boa gestão de risco.
            </div>
            <div style={{ 
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'rgba(255, 215, 0, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}>
              <strong style={{ color: '#ffd700' }}>⚠️ Importante:</strong> Estas são projeções baseadas em estatísticas. 
              Resultados reais podem variar. Sempre pratique gestão de risco responsável.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsMode;