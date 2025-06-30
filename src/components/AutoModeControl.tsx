import React, { useState, useEffect } from 'react';
import { Bot, Settings, Play, Pause, Zap, DollarSign, Target, AlertTriangle, TrendingUp, Activity } from 'lucide-react';

interface AutoModeConfig {
  enabled: boolean;
  minBalance: number;
  betAmount: number;
  maxBetPercentage: number;
  stopOnProfit: number;
  stopOnLoss: number;
  enabledModes: string[];
  martingaleEnabled: boolean;
  maxGales: number;
}

interface AutoModeStats {
  totalBets: number;
  wins: number;
  losses: number;
  profit: number;
  currentStreak: number;
  isRunning: boolean;
  lastBet: {
    amount: number;
    result: 'win' | 'loss' | null;
    timestamp: string;
  } | null;
}

interface AutoModeControlProps {
  currentBalance: number;
  onBalanceUpdate: (newBalance: number) => void;
  currentMode: string;
  prediction: any;
  isAnalyzing: boolean;
}

const AutoModeControl: React.FC<AutoModeControlProps> = ({ 
  currentBalance, 
  onBalanceUpdate, 
  currentMode, 
  prediction,
  isAnalyzing 
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<AutoModeConfig>({
    enabled: false,
    minBalance: 100,
    betAmount: 50,
    maxBetPercentage: 5,
    stopOnProfit: 500,
    stopOnLoss: 300,
    enabledModes: ['normal'],
    martingaleEnabled: true,
    maxGales: 2
  });

  const [stats, setStats] = useState<AutoModeStats>({
    totalBets: 0,
    wins: 0,
    losses: 0,
    profit: 0,
    currentStreak: 0,
    isRunning: false,
    lastBet: null
  });

  const [notification, setNotification] = useState<{
    type: 'bet' | 'win' | 'loss' | 'stop';
    message: string;
    amount?: number;
  } | null>(null);

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('auto_mode_config');
    const savedStats = localStorage.getItem('auto_mode_stats');
    
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  // Salvar configurações no localStorage
  useEffect(() => {
    localStorage.setItem('auto_mode_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('auto_mode_stats', JSON.stringify(stats));
  }, [stats]);

  // Função para voz neural
  const speakNotification = (message: string, priority: 'normal' | 'high' = 'normal') => {
    const voiceEnabled = localStorage.getItem('voice_enabled') === 'true';
    
    if (voiceEnabled && 'speechSynthesis' in window) {
      // Cancelar mensagens anteriores se for alta prioridade
      if (priority === 'high') {
        speechSynthesis.cancel();
      }
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'pt-BR';
      utterance.rate = priority === 'high' ? 1.0 : 0.9;
      utterance.pitch = priority === 'high' ? 1.2 : 1.0;
      utterance.volume = 0.8;
      
      speechSynthesis.speak(utterance);
    }
  };

  // Lógica principal do modo automático
  useEffect(() => {
    if (!config.enabled || !stats.isRunning || !prediction || isAnalyzing) {
      return;
    }

    // Verificar se o modo atual está habilitado
    if (!config.enabledModes.includes(currentMode)) {
      return;
    }

    // Verificar condições de parada
    if (currentBalance < config.minBalance) {
      handleAutoStop('Saldo insuficiente para continuar');
      return;
    }

    if (stats.profit >= config.stopOnProfit) {
      handleAutoStop(`Meta de lucro atingida: R$ ${stats.profit.toFixed(2)}`);
      return;
    }

    if (Math.abs(stats.profit) >= config.stopOnLoss) {
      handleAutoStop(`Stop loss atingido: R$ ${Math.abs(stats.profit).toFixed(2)}`);
      return;
    }

    // Calcular valor da aposta
    const betAmount = calculateBetAmount();
    
    if (betAmount > currentBalance) {
      handleAutoStop('Valor da aposta maior que saldo disponível');
      return;
    }

    // Executar aposta automática
    setTimeout(() => {
      executeBet(betAmount, prediction.nextValue);
    }, 2000); // Aguardar 2 segundos após predição

  }, [prediction, config.enabled, stats.isRunning, currentMode, isAnalyzing]);

  const calculateBetAmount = (): number => {
    let amount = config.betAmount;
    
    // Sistema Martingale se habilitado
    if (config.martingaleEnabled && stats.lastBet?.result === 'loss') {
      const galeLevel = Math.min(stats.currentStreak, config.maxGales);
      amount = config.betAmount * Math.pow(2, galeLevel);
    }
    
    // Limitar pela porcentagem máxima da banca
    const maxByPercentage = (currentBalance * config.maxBetPercentage) / 100;
    amount = Math.min(amount, maxByPercentage);
    
    return Math.max(amount, 1); // Mínimo R$ 1
  };

  const executeBet = (amount: number, prediction: string) => {
    // Simular resultado da aposta (em produção seria integração real)
    const isWin = Math.random() < 0.72; // 72% de chance baseado no modo
    
    // Subtrair valor da banca
    onBalanceUpdate(currentBalance - amount);
    
    // Atualizar estatísticas
    setStats(prev => {
      const newStats = { ...prev };
      newStats.totalBets++;
      
      if (isWin) {
        const winAmount = amount * 0.95; // 95% de retorno
        onBalanceUpdate(currentBalance - amount + winAmount);
        newStats.wins++;
        newStats.profit += winAmount - amount;
        newStats.currentStreak = 0; // Reset streak em vitória
        
        setNotification({
          type: 'win',
          message: `Vitória! ${prediction}`,
          amount: winAmount - amount
        });
        
        speakNotification(`Vitória! Lucro de ${(winAmount - amount).toFixed(0)} reais. ${prediction} acertou!`, 'high');
        
      } else {
        newStats.losses++;
        newStats.profit -= amount;
        newStats.currentStreak++;
        
        setNotification({
          type: 'loss',
          message: `Perda! ${prediction}`,
          amount: -amount
        });
        
        speakNotification(`Perda de ${amount.toFixed(0)} reais. ${prediction} errou.`);
      }
      
      newStats.lastBet = {
        amount,
        result: isWin ? 'win' : 'loss',
        timestamp: new Date().toISOString()
      };
      
      return newStats;
    });
    
    // Notificação da aposta
    setNotification({
      type: 'bet',
      message: `Aposta: R$ ${amount.toFixed(2)} em ${prediction}`,
      amount
    });
    
    speakNotification(`Aposta automática de ${amount.toFixed(0)} reais em ${prediction}`);
  };

  const handleAutoStop = (reason: string) => {
    setStats(prev => ({ ...prev, isRunning: false }));
    setNotification({
      type: 'stop',
      message: `Modo automático parado: ${reason}`
    });
    speakNotification(`Modo automático parado. ${reason}`, 'high');
  };

  const toggleAutoMode = () => {
    if (config.enabled && stats.isRunning) {
      // Parar modo automático
      setStats(prev => ({ ...prev, isRunning: false }));
      speakNotification('Modo automático desativado');
    } else if (config.enabled) {
      // Iniciar modo automático
      if (currentBalance < config.minBalance) {
        setNotification({
          type: 'stop',
          message: 'Saldo insuficiente para iniciar modo automático'
        });
        speakNotification('Saldo insuficiente para iniciar modo automático', 'high');
        return;
      }
      
      setStats(prev => ({ ...prev, isRunning: true }));
      speakNotification('Modo automático ativado. Aguardando próxima predição.', 'high');
    } else {
      // Abrir configurações
      setShowConfig(true);
    }
  };

  const resetStats = () => {
    setStats({
      totalBets: 0,
      wins: 0,
      losses: 0,
      profit: 0,
      currentStreak: 0,
      isRunning: false,
      lastBet: null
    });
    speakNotification('Estatísticas do modo automático resetadas');
  };

  // Auto-fechar notificação
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const winRate = stats.totalBets > 0 ? (stats.wins / stats.totalBets * 100).toFixed(1) : '0.0';

  return (
    <>
      {/* Botão Principal no Canto Superior Direito */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'flex-end'
      }}>
        {/* Botão de Ativação */}
        <button
          onClick={toggleAutoMode}
          style={{
            background: config.enabled && stats.isRunning ? 
              'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)' :
              config.enabled ?
              'linear-gradient(135deg, #ffd700 0%, #ffb700 100%)' :
              'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            color: config.enabled ? '#000' : '#fff',
            cursor: 'pointer',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: config.enabled && stats.isRunning ? 
              '0 0 20px rgba(0, 255, 136, 0.6)' : 
              config.enabled ?
              '0 0 20px rgba(255, 215, 0, 0.6)' :
              'none',
            animation: config.enabled && stats.isRunning ? 'pulse 2s infinite' : 'none'
          }}
          title={
            config.enabled && stats.isRunning ? 'Parar Modo Automático' :
            config.enabled ? 'Iniciar Modo Automático' :
            'Configurar Modo Automático'
          }
        >
          {config.enabled && stats.isRunning ? <Pause size={24} /> :
           config.enabled ? <Play size={24} /> :
           <Bot size={24} />}
        </button>

        {/* Botão de Configurações */}
        {config.enabled && (
          <button
            onClick={() => setShowConfig(true)}
            style={{
              background: 'rgba(40, 40, 40, 0.9)',
              border: '2px solid rgba(0, 204, 255, 0.3)',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              color: '#00ccff',
              cursor: 'pointer',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            title="Configurações do Modo Automático"
          >
            <Settings size={18} />
          </button>
        )}

        {/* Indicador de Status */}
        {config.enabled && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: `2px solid ${stats.isRunning ? '#00ff88' : '#ffd700'}`,
            borderRadius: '12px',
            padding: '0.5rem 1rem',
            backdropFilter: 'blur(10px)',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: stats.isRunning ? '#00ff88' : '#ffd700',
            textAlign: 'center',
            minWidth: '120px'
          }}>
            <div>{stats.isRunning ? '🤖 ATIVO' : '⏸️ PAUSADO'}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
              {stats.totalBets} apostas • {winRate}%
            </div>
          </div>
        )}
      </div>

      {/* Notificação de Ação */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '100px',
          right: '20px',
          zIndex: 10000,
          background: `linear-gradient(135deg, ${
            notification.type === 'win' ? '#00ff8820' :
            notification.type === 'loss' ? '#ff149320' :
            notification.type === 'bet' ? '#00ccff20' :
            '#ffd70020'
          } 0%, rgba(0,0,0,0.9) 100%)`,
          border: `2px solid ${
            notification.type === 'win' ? '#00ff88' :
            notification.type === 'loss' ? '#ff1493' :
            notification.type === 'bet' ? '#00ccff' :
            '#ffd700'
          }`,
          borderRadius: '16px',
          padding: '1rem',
          minWidth: '250px',
          boxShadow: `0 0 30px ${
            notification.type === 'win' ? '#00ff8850' :
            notification.type === 'loss' ? '#ff149350' :
            notification.type === 'bet' ? '#00ccff50' :
            '#ffd70050'
          }`,
          animation: 'slideInRight 0.5s ease-out, pulse 2s infinite'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem'
          }}>
            <div style={{ fontSize: '1.5rem' }}>
              {notification.type === 'win' ? '🎉' :
               notification.type === 'loss' ? '😞' :
               notification.type === 'bet' ? '🎯' : '⏹️'}
            </div>
            <div>
              <div style={{ 
                fontWeight: '600', 
                color: notification.type === 'win' ? '#00ff88' :
                       notification.type === 'loss' ? '#ff1493' :
                       notification.type === 'bet' ? '#00ccff' : '#ffd700'
              }}>
                {notification.message}
              </div>
              {notification.amount && (
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {notification.amount > 0 ? '+' : ''}R$ {notification.amount.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configurações */}
      {showConfig && (
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
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '2px solid rgba(168, 85, 247, 0.3)',
            boxShadow: '0 0 50px rgba(168, 85, 247, 0.2)'
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
                background: 'linear-gradient(135deg, #a855f7 0%, #00ccff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                🤖 Configurações do Modo Automático
              </h2>
              <button
                onClick={() => setShowConfig(false)}
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

            {/* Ativação Principal */}
            <div style={{ 
              padding: '1.5rem', 
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              marginBottom: '2rem'
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    enabled: e.target.checked 
                  }))}
                  style={{ 
                    width: '20px', 
                    height: '20px',
                    accentColor: '#a855f7'
                  }}
                />
                <span style={{ color: '#a855f7' }}>
                  Habilitar Modo Automático
                </span>
                {config.enabled && (
                  <div style={{ 
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(168, 85, 247, 0.3)',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    color: '#a855f7',
                    fontWeight: '600'
                  }}>
                    HABILITADO
                  </div>
                )}
              </label>
            </div>

            {config.enabled && (
              <>
                {/* Configurações de Aposta */}
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(40, 40, 40, 0.8)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '2rem'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '600', 
                    marginBottom: '1.5rem',
                    color: '#00ccff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <DollarSign size={18} />
                    Configurações de Aposta
                  </h3>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '1rem'
                  }}>
                    <div>
                      <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', display: 'block' }}>
                        Valor Base da Aposta (R$)
                      </label>
                      <input
                        type="number"
                        value={config.betAmount}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          betAmount: parseFloat(e.target.value) || 0 
                        }))}
                        min="1"
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
                        Saldo Mínimo para Operar (R$)
                      </label>
                      <input
                        type="number"
                        value={config.minBalance}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          minBalance: parseFloat(e.target.value) || 0 
                        }))}
                        min="1"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid rgba(255, 20, 147, 0.3)',
                          borderRadius: '8px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: 'white',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', display: 'block' }}>
                        Máximo % da Banca por Aposta
                      </label>
                      <input
                        type="number"
                        value={config.maxBetPercentage}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          maxBetPercentage: parseFloat(e.target.value) || 0 
                        }))}
                        min="1"
                        max="20"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          borderRadius: '8px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: 'white',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sistema Martingale */}
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(40, 40, 40, 0.8)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '2rem'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '600', 
                    marginBottom: '1.5rem',
                    color: '#ffd700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Zap size={18} />
                    Sistema Martingale
                  </h3>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={config.martingaleEnabled}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          martingaleEnabled: e.target.checked 
                        }))}
                        style={{ accentColor: '#ffd700' }}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
                        Habilitar Martingale (dobrar aposta após perda)
                      </span>
                    </label>
                  </div>

                  {config.martingaleEnabled && (
                    <div>
                      <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', display: 'block' }}>
                        Máximo de Gales
                      </label>
                      <input
                        type="number"
                        value={config.maxGales}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          maxGales: parseInt(e.target.value) || 0 
                        }))}
                        min="1"
                        max="5"
                        style={{
                          width: '150px',
                          padding: '0.75rem',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          borderRadius: '8px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: 'white',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Proteções */}
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(40, 40, 40, 0.8)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '2rem'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '600', 
                    marginBottom: '1.5rem',
                    color: '#ff1493',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Target size={18} />
                    Proteções e Stops
                  </h3>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '1rem'
                  }}>
                    <div>
                      <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', display: 'block' }}>
                        Parar ao Lucrar (R$)
                      </label>
                      <input
                        type="number"
                        value={config.stopOnProfit}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          stopOnProfit: parseFloat(e.target.value) || 0 
                        }))}
                        min="1"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid rgba(0, 255, 136, 0.3)',
                          borderRadius: '8px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: 'white',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', display: 'block' }}>
                        Parar ao Perder (R$)
                      </label>
                      <input
                        type="number"
                        value={config.stopOnLoss}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          stopOnLoss: parseFloat(e.target.value) || 0 
                        }))}
                        min="1"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid rgba(255, 20, 147, 0.3)',
                          borderRadius: '8px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: 'white',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Modos Habilitados */}
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(40, 40, 40, 0.8)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '2rem'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '600', 
                    marginBottom: '1.5rem',
                    color: '#00ff88',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Activity size={18} />
                    Modos Habilitados
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {[
                      { id: 'normal', name: 'Normal', color: '#00ff88' },
                      { id: 'medium', name: 'Médio', color: '#ffd700' },
                      { id: 'advanced', name: 'Avançado', color: '#ff1493' }
                    ].map(mode => (
                      <label key={mode.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        cursor: 'pointer',
                        padding: '0.75rem',
                        background: config.enabledModes.includes(mode.id) ? 
                          `${mode.color}20` : 'rgba(60, 60, 60, 0.5)',
                        borderRadius: '8px',
                        border: `1px solid ${config.enabledModes.includes(mode.id) ? 
                          mode.color : 'rgba(255,255,255,0.1)'}`,
                        transition: 'all 0.3s ease'
                      }}>
                        <input
                          type="checkbox"
                          checked={config.enabledModes.includes(mode.id)}
                          onChange={(e) => {
                            setConfig(prev => ({
                              ...prev,
                              enabledModes: e.target.checked
                                ? [...prev.enabledModes, mode.id]
                                : prev.enabledModes.filter(m => m !== mode.id)
                            }));
                          }}
                          style={{ accentColor: mode.color }}
                        />
                        <span style={{ 
                          color: config.enabledModes.includes(mode.id) ? mode.color : 'rgba(255,255,255,0.7)',
                          fontWeight: '500'
                        }}>
                          {mode.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Estatísticas */}
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'linear-gradient(135deg, rgba(0, 204, 255, 0.1) 0%, rgba(255, 20, 147, 0.1) 100%)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 204, 255, 0.3)',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '600', 
                    marginBottom: '1.5rem',
                    color: '#00ccff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <TrendingUp size={18} />
                    Estatísticas da Sessão
                  </h3>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                    gap: '1rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00ccff' }}>
                        {stats.totalBets}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                        Total Apostas
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00ff88' }}>
                        {stats.wins}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                        Vitórias
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ff1493' }}>
                        {stats.losses}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                        Derrotas
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '700', 
                        color: stats.profit >= 0 ? '#00ff88' : '#ff1493'
                      }}>
                        {stats.profit >= 0 ? '+' : ''}R$ {stats.profit.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                        Lucro/Prejuízo
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffd700' }}>
                        {winRate}%
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                        Taxa de Acerto
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controles */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    onClick={resetStats}
                    className="btn btn-warning"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <AlertTriangle size={16} />
                    Reset Estatísticas
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
          }
          50% { 
            transform: scale(1.05);
          }
        }
      `}</style>
    </>
  );
};

export default AutoModeControl;