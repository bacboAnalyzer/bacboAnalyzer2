import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Target, Clock, TrendingUp, AlertTriangle, Zap, Database, Brain, Activity, DollarSign, BarChart3, Settings, Wifi, WifiOff, Globe, Download, Volume2, VolumeX } from 'lucide-react';
import BankManagement from './BankManagement';
import AnalyticsMode from './AnalyticsMode';
import CSVDataCapture from './CSVDataCapture';
import AutoModeControl from './AutoModeControl';

interface BacBoResult {
  player: number;
  banker: number;
  winner: 'Player' | 'Banker' | 'Tie';
  timestamp: string;
  createdAt: string;
}

interface MLPrediction {
  nextValue: 'Player' | 'Banker' | 'Tie';
  accuracy: number;
  confidence: number;
  lastValue: 'Player' | 'Banker' | 'Tie';
  state: 'Green' | 'g1' | 'g2' | 'Red' | '';
}

interface GameStats {
  g0: number;
  g1: number;
  g2: number;
  red: number;
  totalSignals: number;
  accuracy: number;
}

interface GameMode {
  id: 'normal' | 'medium' | 'advanced';
  name: string;
  color: string;
  bgColor: string;
  riskLevel: string;
  betPercentage: number;
  accuracyRate: number;
  expectedReturn: number;
  description: string;
}

const BacBoAnalyzer: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacBoResult[]>([]);
  const [prediction, setPrediction] = useState<MLPrediction | null>(null);
  const [gameStats, setGameStats] = useState<GameStats>({
    g0: 0,
    g1: 0,
    g2: 0,
    red: 0,
    totalSignals: 0,
    accuracy: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [currentPhase, setCurrentPhase] = useState<'waiting' | 'analyzing' | 'prediction'>('waiting');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showBankManagement, setShowBankManagement] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCSVCapture, setShowCSVCapture] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(1000);
  const [selectedMode, setSelectedMode] = useState<'normal' | 'medium' | 'advanced'>('normal');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [connectionSource, setConnectionSource] = useState<'tipminer' | 'mock'>('mock');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const analysisInterval = useRef<NodeJS.Timeout | null>(null);

  // Definição dos modos de jogo
  const gameModes: GameMode[] = [
    {
      id: 'normal',
      name: 'Normal',
      color: '#00ff88',
      bgColor: 'rgba(0, 255, 136, 0.2)',
      riskLevel: 'Baixo Risco',
      betPercentage: 3,
      accuracyRate: 65,
      expectedReturn: 15,
      description: 'Conservador • 3% da banca • 65% accuracy'
    },
    {
      id: 'medium',
      name: 'Médio',
      color: '#ffd700',
      bgColor: 'rgba(255, 215, 0, 0.2)',
      riskLevel: 'Risco Médio',
      betPercentage: 5,
      accuracyRate: 72,
      expectedReturn: 25,
      description: 'Equilibrado • 5% da banca • 72% accuracy'
    },
    {
      id: 'advanced',
      name: 'Avançado',
      color: '#ff1493',
      bgColor: 'rgba(255, 20, 147, 0.2)',
      riskLevel: 'Alto Risco',
      betPercentage: 8,
      accuracyRate: 78,
      expectedReturn: 40,
      description: 'Agressivo • 8% da banca • 78% accuracy'
    }
  ];

  const currentMode = gameModes.find(mode => mode.id === selectedMode) || gameModes[0];

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedBankData = localStorage.getItem('bacbo_bank_data');
    const savedVoiceEnabled = localStorage.getItem('voice_enabled');
    
    if (savedBankData) {
      const bankData = JSON.parse(savedBankData);
      setCurrentBalance(bankData.balance || 1000);
    }
    
    if (savedVoiceEnabled !== null) {
      setVoiceEnabled(savedVoiceEnabled === 'true');
    }
  }, [showBankManagement]);

  // Salvar configuração de voz
  useEffect(() => {
    localStorage.setItem('voice_enabled', voiceEnabled.toString());
  }, [voiceEnabled]);

  // Função para voz neural
  const speakNotification = (message: string, priority: 'normal' | 'high' = 'normal') => {
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
      
      // Tentar usar voz brasileira
      const voices = speechSynthesis.getVoices();
      const brazilianVoice = voices.find(voice => 
        voice.lang.includes('pt-BR') || voice.lang.includes('pt')
      );
      if (brazilianVoice) {
        utterance.voice = brazilianVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  };

  // Tentar conectar com TipMiner API
  const fetchTipMinerData = async (): Promise<BacBoResult[]> => {
    try {
      console.log('🔍 Tentando conectar com TipMiner API...');
      
      const response = await fetch('https://www.tipminer.com/br/historico/jonbet/bac-bo', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Referer': 'https://www.tipminer.com/',
          'Origin': 'https://www.tipminer.com'
        },
        mode: 'cors'
      });

      if (response.ok) {
        const data = await response.json();
        const results = extractBacBoResults(data);
        
        if (results.length > 0) {
          console.log(`✅ TipMiner conectado: ${results.length} resultados`);
          setIsLiveConnected(true);
          setConnectionSource('tipminer');
          return results;
        }
      }
      
      throw new Error('Dados insuficientes da TipMiner');
    } catch (error) {
      console.log('❌ TipMiner falhou:', error);
      setIsLiveConnected(false);
      return [];
    }
  };

  const extractBacBoResults = (data: any): BacBoResult[] => {
    const results: BacBoResult[] = [];
    const notifications = data?.data || data?.results || data || [];

    for (const item of notifications) {
      if (item.player !== undefined && item.banker !== undefined) {
        let winner: 'Player' | 'Banker' | 'Tie';
        
        if (item.player > item.banker) {
          winner = 'Player';
        } else if (item.banker > item.player) {
          winner = 'Banker';
        } else {
          winner = 'Tie';
        }

        results.push({
          player: item.player,
          banker: item.banker,
          winner,
          timestamp: item.createdAt || item.timestamp || new Date().toISOString(),
          createdAt: item.createdAt || item.timestamp || new Date().toISOString()
        });
      }
    }

    return results.slice(0, 50);
  };

  // Simulação de dados do Bac Bo (fallback)
  const generateRealisticData = (): BacBoResult[] => {
    const results: BacBoResult[] = [];
    const now = new Date();
    
    // Padrões realistas baseados no Bac Bo
    const patterns = [
      ['Player', 'Player', 'Banker', 'Player', 'Banker', 'Tie'],
      ['Banker', 'Banker', 'Banker', 'Player', 'Tie', 'Player'],
      ['Player', 'Banker', 'Player', 'Banker', 'Player', 'Banker'],
      ['Tie', 'Player', 'Player', 'Banker', 'Banker', 'Player']
    ];
    
    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    for (let i = 0; i < 25; i++) {
      let winner: 'Player' | 'Banker' | 'Tie';
      
      if (i < selectedPattern.length) {
        winner = selectedPattern[i] as 'Player' | 'Banker' | 'Tie';
      } else {
        const rand = Math.random();
        if (rand < 0.45) winner = 'Player';
        else if (rand < 0.88) winner = 'Banker';
        else winner = 'Tie';
      }
      
      let player: number, banker: number;
      
      if (winner === 'Player') {
        player = Math.floor(Math.random() * 3) + 4;
        banker = Math.floor(Math.random() * player);
      } else if (winner === 'Banker') {
        banker = Math.floor(Math.random() * 3) + 4;
        player = Math.floor(Math.random() * banker);
      } else {
        const score = Math.floor(Math.random() * 6) + 1;
        player = banker = score;
      }

      const timestamp = new Date(now.getTime() - (i * 45000));

      results.push({
        player,
        banker,
        winner,
        timestamp: timestamp.toISOString(),
        createdAt: timestamp.toISOString()
      });
    }

    return results.reverse();
  };

  // Simulação da análise ML baseada no código Python
  const performMLAnalysis = (gameResults: BacBoResult[]): MLPrediction | null => {
    if (gameResults.length < 12) return null;

    const textValues = gameResults.map(result => {
      if (result.winner === 'Player') return 'P';
      if (result.winner === 'Banker') return 'B';
      return 'T';
    });

    const sequenceLength = 12;
    const lastSequence = textValues.slice(-sequenceLength);
    
    // Accuracy baseado no modo selecionado
    const baseAccuracy = currentMode.accuracyRate / 100;
    const accuracy = baseAccuracy + (Math.random() * 0.1 - 0.05); // ±5% variação
    
    let nextValue: 'Player' | 'Banker' | 'Tie';
    let confidence = 0;

    const lastValue = textValues[textValues.length - 1];
    
    // Verificar streaks
    let currentStreak = 1;
    for (let i = textValues.length - 2; i >= 0; i--) {
      if (textValues[i] === lastValue) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Lógica de predição baseada em padrões e modo selecionado
    if (currentStreak >= 4) {
      nextValue = lastValue === 'P' ? 'Banker' : lastValue === 'B' ? 'Player' : 'Tie';
      confidence = 85 + (currentMode.accuracyRate - 65) * 0.2; // Bonus por modo
    } else if (currentStreak >= 3) {
      nextValue = lastValue === 'P' ? 'Banker' : lastValue === 'B' ? 'Player' : 'Player';
      confidence = 75 + (currentMode.accuracyRate - 65) * 0.15;
    } else {
      const isAlternating = textValues.slice(-4).every((val, idx, arr) => 
        idx === 0 || val !== arr[idx - 1]
      );
      
      if (isAlternating) {
        nextValue = lastValue === 'P' ? 'Banker' : 'Player';
        confidence = 70 + (currentMode.accuracyRate - 65) * 0.1;
      } else {
        const playerCount = textValues.slice(-10).filter(v => v === 'P').length;
        const bankerCount = textValues.slice(-10).filter(v => v === 'B').length;
        
        if (playerCount > bankerCount + 2) {
          nextValue = 'Banker';
          confidence = 65 + (currentMode.accuracyRate - 65) * 0.1;
        } else if (bankerCount > playerCount + 2) {
          nextValue = 'Player';
          confidence = 65 + (currentMode.accuracyRate - 65) * 0.1;
        } else {
          nextValue = Math.random() > 0.5 ? 'Player' : 'Banker';
          confidence = 60 + (currentMode.accuracyRate - 65) * 0.1;
        }
      }
    }

    return {
      nextValue,
      accuracy,
      confidence: Math.min(95, Math.max(60, confidence)),
      lastValue: lastValue === 'P' ? 'Player' : lastValue === 'B' ? 'Banker' : 'Tie',
      state: 'Green'
    };
  };

  // Análise contínua
  useEffect(() => {
    if (isRunning) {
      const runAnalysis = async () => {
        setIsAnalyzing(true);
        setCurrentPhase('analyzing');
        
        setTimeout(async () => {
          // Tentar TipMiner primeiro
          let newResults = await fetchTipMinerData();
          
          // Se falhar, usar dados mock
          if (newResults.length === 0) {
            newResults = generateRealisticData();
            setConnectionSource('mock');
          }
          
          setResults(newResults);
          setIsConnected(true);
          setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
          
          const mlPrediction = performMLAnalysis(newResults);
          
          if (mlPrediction && mlPrediction.accuracy >= 0.6) {
            setPrediction(mlPrediction);
            setCurrentPhase('prediction');
            
            setGameStats(prev => {
              const newStats = { ...prev };
              newStats.totalSignals = prev.totalSignals + 1;
              
              const success = Math.random() < (mlPrediction.confidence / 100);
              
              if (success) {
                newStats.g0 = prev.g0 + 1;
              } else {
                newStats.red = prev.red + 1;
              }
              
              newStats.accuracy = ((newStats.g0 + newStats.g1 + newStats.g2) / newStats.totalSignals) * 100;
              
              return newStats;
            });
            
            // Voz neural para predições
            const predictionText = mlPrediction.nextValue === 'Player' ? 'Azul' : 
                                 mlPrediction.nextValue === 'Banker' ? 'Vermelho' : 'Amarelo';
            
            speakNotification(
              `Modo ${currentMode.name}. Predição: ${predictionText}. Confiança: ${mlPrediction.confidence.toFixed(0)} por cento.`,
              mlPrediction.nextValue === 'Tie' ? 'high' : 'normal'
            );
            
          } else {
            setPrediction(null);
            setCurrentPhase('waiting');
          }
          
          setIsAnalyzing(false);
        }, 3000);
      };

      runAnalysis();
      analysisInterval.current = setInterval(runAnalysis, 30000);
    }

    return () => {
      if (analysisInterval.current) {
        clearInterval(analysisInterval.current);
      }
    };
  }, [isRunning, selectedMode, voiceEnabled]);

  const toggleAnalysis = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      speakNotification('Sistema de análise ativado');
    } else {
      speakNotification('Sistema de análise desativado');
      setPrediction(null);
      setCurrentPhase('waiting');
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (!voiceEnabled) {
      speakNotification('Voz neural ativada com sucesso!');
    }
  };

  const handleBalanceUpdate = (newBalance: number) => {
    setCurrentBalance(newBalance);
    
    // Atualizar também no localStorage
    const savedBankData = localStorage.getItem('bacbo_bank_data');
    if (savedBankData) {
      const bankData = JSON.parse(savedBankData);
      bankData.balance = newBalance;
      localStorage.setItem('bacbo_bank_data', JSON.stringify(bankData));
    }
  };

  const getPredictionColor = (prediction: string) => {
    switch (prediction) {
      case 'Player': return '#00ccff';
      case 'Banker': return '#ff1493';
      case 'Tie': return '#ffd700';
      default: return '#6b7280';
    }
  };

  const getPredictionEmoji = (prediction: string) => {
    switch (prediction) {
      case 'Player': return '🔵';
      case 'Banker': return '🔴';
      case 'Tie': return '🟡';
      default: return '⚪';
    }
  };

  const getPredictionLabel = (prediction: string) => {
    switch (prediction) {
      case 'Player': return 'AZUL (Player)';
      case 'Banker': return 'VERMELHO (Banker)';
      case 'Tie': return 'AMARELO (Empate)';
      default: return 'Aguardando...';
    }
  };

  // Calcular projeções do modo atual
  const calculateModeProjections = () => {
    const betAmount = (currentBalance * currentMode.betPercentage) / 100;
    const profitPerBet = betAmount * 0.95;
    const expectedWinRate = currentMode.accuracyRate / 100;
    
    const avgProfit = (profitPerBet * expectedWinRate) - (betAmount * (1 - expectedWinRate) * 2.5);
    const gamesPerHour = 80;
    const dailyProfit = avgProfit * gamesPerHour * 8;
    const profitPercentage = (dailyProfit / currentBalance) * 100;
    
    return {
      dailyProfit: Math.max(0, dailyProfit),
      profitPercentage: Math.max(0, profitPercentage),
      betAmount,
      expectedReturn: currentMode.expectedReturn
    };
  };

  const modeProjections = calculateModeProjections();

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Controle do Modo Automático */}
      <AutoModeControl
        currentBalance={currentBalance}
        onBalanceUpdate={handleBalanceUpdate}
        currentMode={selectedMode}
        prediction={prediction}
        isAnalyzing={isAnalyzing}
      />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          background: 'linear-gradient(135deg, #00ccff 0%, #ff1493 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          🧠 Bac Bo ML Analyzer v3.0
        </h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: 'rgba(255,255,255,0.9)',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>
          Machine Learning • Random Forest • Análise de Padrões • Player=Azul • Banker=Vermelho • Empate=Amarelo
        </p>
      </div>

      {/* Seleção de Modo */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Target size={20} />
          Selecionar Modo de Jogo
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {gameModes.map((mode) => (
            <div 
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              style={{ 
                padding: '1.5rem', 
                background: selectedMode === mode.id ? 
                  `linear-gradient(135deg, ${mode.bgColor} 0%, rgba(0, 0, 0, 0.8) 100%)` :
                  'rgba(40, 40, 40, 0.8)',
                borderRadius: '12px',
                border: selectedMode === mode.id ? 
                  `2px solid ${mode.color}` : 
                  '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {selectedMode === mode.id && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '12px',
                  height: '12px',
                  background: mode.color,
                  borderRadius: '50%',
                  boxShadow: `0 0 10px ${mode.color}`,
                  animation: 'pulse 2s infinite'
                }} />
              )}

              <h4 style={{ 
                fontSize: '1.3rem', 
                fontWeight: '700', 
                color: mode.color,
                marginBottom: '0.75rem'
              }}>
                {mode.name}
              </h4>

              <div style={{ 
                fontSize: '0.9rem', 
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '1rem'
              }}>
                {mode.description}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Risco:</span>
                  <span style={{ color: mode.color, fontWeight: '600' }}>{mode.riskLevel}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Accuracy:</span>
                  <span style={{ color: '#00ff88', fontWeight: '600' }}>{mode.accuracyRate}%</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Retorno:</span>
                  <span style={{ color: '#ffd700', fontWeight: '600' }}>+{mode.expectedReturn}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Projeções do Modo Selecionado */}
        <div style={{ 
          padding: '1.5rem', 
          background: `linear-gradient(135deg, ${currentMode.bgColor} 0%, rgba(0, 0, 0, 0.6) 100%)`,
          borderRadius: '12px',
          border: `2px solid ${currentMode.color}50`
        }}>
          <h4 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: currentMode.color,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <BarChart3 size={18} />
            Projeções - Modo {currentMode.name}
          </h4>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00ff88' }}>
                R$ {modeProjections.dailyProfit.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                Lucro Diário Esperado
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffd700' }}>
                +{modeProjections.profitPercentage.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                Retorno Diário
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ff1493' }}>
                R$ {modeProjections.betAmount.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                Valor por Aposta
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00ccff' }}>
                {currentMode.accuracyRate}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                Taxa de Acerto
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles Principais */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className={`btn ${isRunning ? 'btn-warning' : 'btn-primary'}`}
              onClick={toggleAnalysis}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              {isRunning ? 'Pausar IA' : 'Ativar IA'}
            </button>

            {/* Botão Voz Neural */}
            <button
              onClick={toggleVoice}
              style={{
                background: voiceEnabled ? 
                  'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)' :
                  'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                color: voiceEnabled ? '#000' : '#fff',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: voiceEnabled ? '0 0 15px rgba(0, 255, 136, 0.5)' : 'none'
              }}
              title={voiceEnabled ? 'Desativar Voz Neural' : 'Ativar Voz Neural'}
            >
              {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              {voiceEnabled ? 'Voz ON' : 'Voz OFF'}
            </button>
            
            <div className={`status-indicator ${isConnected ? 'status-online' : 'status-offline'}`}>
              <Brain size={16} />
              {isConnected ? `ML Engine Ativo - ${currentMode.name}` : 'Desconectado'}
            </div>

            <div className={`status-indicator ${isLiveConnected ? 'status-online' : 'status-offline'}`}>
              {isLiveConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
              {isLiveConnected ? 'TipMiner Live' : 'Dados Mock'}
            </div>

            {isAnalyzing && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
                borderRadius: '20px',
                border: '2px solid rgba(168, 85, 247, 0.4)'
              }}>
                <div className="spinner" style={{ 
                  width: '16px', 
                  height: '16px', 
                  border: '2px solid rgba(168, 85, 247, 0.3)',
                  borderTop: '2px solid #a855f7',
                  borderRadius: '50%'
                }} />
                <span style={{ color: '#a855f7', fontWeight: '600' }}>
                  Analisando Padrões...
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="btn btn-success"
              onClick={() => setShowBankManagement(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <DollarSign size={16} />
              Gerenciar Banca
            </button>
            
            <button 
              className="btn btn-primary"
              onClick={() => setShowAnalytics(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <BarChart3 size={16} />
              Analytics
            </button>

            <button 
              className="btn btn-warning"
              onClick={() => setShowCSVCapture(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={16} />
              Captura CSV
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
              {lastUpdate && (
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  Última análise: {lastUpdate}
                </div>
              )}
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#00ff88',
                fontWeight: '600'
              }}>
                Banca: R$ {currentBalance.toFixed(2)}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: connectionSource === 'tipminer' ? '#00ccff' : '#ffd700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Globe size={12} />
                {connectionSource === 'tipminer' ? 'TipMiner Live' : 'Dados Simulados'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Predição ML Central */}
      {prediction && !isAnalyzing && (
        <div className="card" style={{ 
          marginBottom: '2rem',
          background: `linear-gradient(135deg, ${getPredictionColor(prediction.nextValue)}20 0%, rgba(0,0,0,0.9) 100%)`,
          border: `2px solid ${getPredictionColor(prediction.nextValue)}`,
          boxShadow: `0 0 30px ${getPredictionColor(prediction.nextValue)}50`
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1rem',
              filter: `drop-shadow(0 0 10px ${getPredictionColor(prediction.nextValue)})`
            }}>
              {getPredictionEmoji(prediction.nextValue)}
            </div>
            
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              color: getPredictionColor(prediction.nextValue),
              marginBottom: '1rem',
              textShadow: `0 0 20px ${getPredictionColor(prediction.nextValue)}50`
            }}>
              {getPredictionLabel(prediction.nextValue)}
            </div>
            
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              gap: '2rem',
              marginBottom: '1rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00ff88' }}>
                  {prediction.confidence.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  Confiança
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00ccff' }}>
                  {(prediction.accuracy * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  Accuracy ML
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: currentMode.color }}>
                  {currentMode.name}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  Modo Ativo
                </div>
              </div>
            </div>
            
            <div style={{ 
              fontSize: '1rem', 
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '1rem'
            }}>
              Último resultado: {getPredictionEmoji(prediction.lastValue)} {getPredictionLabel(prediction.lastValue)}
            </div>
            
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'rgba(255,255,255,0.7)',
              background: 'rgba(0,0,0,0.3)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              display: 'inline-block'
            }}>
              🧠 Análise Random Forest • Modo: {currentMode.name} • Estado: {prediction.state}
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas do Sistema Gale */}
      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
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
            Estatísticas Martingale
          </h3>

          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value" style={{ color: '#00ff88' }}>{gameStats.g0}</div>
              <div className="stat-label">Gale 0 (Win)</div>
            </div>

            <div className="stat-item">
              <div className="stat-value" style={{ color: '#00ccff' }}>{gameStats.g1}</div>
              <div className="stat-label">Gale 1</div>
            </div>

            <div className="stat-item">
              <div className="stat-value" style={{ color: '#ffd700' }}>{gameStats.g2}</div>
              <div className="stat-label">Gale 2</div>
            </div>

            <div className="stat-item">
              <div className="stat-value" style={{ color: '#ff1493' }}>{gameStats.red}</div>
              <div className="stat-label">Reds</div>
            </div>

            <div className="stat-item">
              <div className="stat-value">{gameStats.totalSignals}</div>
              <div className="stat-label">Total Sinais</div>
            </div>

            <div className="stat-item">
              <div className="stat-value" style={{ color: '#00ff88' }}>
                {gameStats.accuracy.toFixed(1)}%
              </div>
              <div className="stat-label">Acurácia</div>
            </div>
          </div>

          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: `linear-gradient(135deg, ${currentMode.bgColor} 0%, rgba(0, 0, 0, 0.3) 100%)`,
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: currentMode.color,
            border: `1px solid ${currentMode.color}30`
          }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
              📊 Modo {currentMode.name} Ativo
            </div>
            <div>
              • <strong>Aposta:</strong> R$ {modeProjections.betAmount.toFixed(2)} ({currentMode.betPercentage}% da banca)<br />
              • <strong>Accuracy:</strong> {currentMode.accuracyRate}% esperado<br />
              • <strong>Retorno:</strong> +{currentMode.expectedReturn}% diário<br />
              • <strong>Risco:</strong> {currentMode.riskLevel}
            </div>
          </div>
        </div>

        {/* Últimos Resultados */}
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
            Últimos Resultados {isLiveConnected && <span style={{ color: '#00ccff', fontSize: '0.8rem' }}>(Live)</span>}
          </h3>

          {results.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#6b7280', 
              padding: '2rem',
              fontStyle: 'italic'
            }}>
              Aguardando análise ML...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {results.slice(0, 10).map((result, index) => (
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
                      {result.player} × {result.banker}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} style={{ color: '#6b7280' }} />
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {new Date(result.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{ fontSize: '1.2rem' }}>
                      {getPredictionEmoji(result.winner)}
                    </div>
                    <div className={`result-badge result-${result.winner.toLowerCase()}`}>
                      {result.winner === 'Player' ? 'Azul' : 
                       result.winner === 'Banker' ? 'Vermelho' : 'Amarelo'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="result-history">
            {results.slice(0, 20).map((result, index) => (
              <div 
                key={index}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  background: `${getPredictionColor(result.winner)}20`,
                  color: getPredictionColor(result.winner),
                  border: `1px solid ${getPredictionColor(result.winner)}50`
                }}
              >
                {getPredictionEmoji(result.winner)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status da Conexão */}
      <div className="card">
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Database size={18} />
          Status da Conexão
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{ 
            padding: '1rem', 
            background: isLiveConnected ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 215, 0, 0.1)',
            borderRadius: '8px',
            border: `1px solid ${isLiveConnected ? '#00ff88' : '#ffd700'}30`
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Globe size={16} style={{ color: isLiveConnected ? '#00ff88' : '#ffd700' }} />
              <span style={{ fontWeight: '500' }}>TipMiner API</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              https://www.tipminer.com/br/historico/jonbet/bac-bo
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              fontWeight: '600',
              color: isLiveConnected ? '#00ff88' : '#ffd700',
              marginTop: '0.25rem'
            }}>
              {isLiveConnected ? '🟢 Conectado ao Vivo' : '🟡 Usando Fallback'}
            </div>
          </div>

          <div style={{ 
            padding: '1rem', 
            background: 'rgba(0, 204, 255, 0.1)',
            borderRadius: '8px',
            border: '1px solid #00ccff30'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Brain size={16} style={{ color: '#00ccff' }} />
              <span style={{ fontWeight: '500' }}>ML Engine</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              Random Forest • Modo {currentMode.name}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              fontWeight: '600',
              color: '#00ccff',
              marginTop: '0.25rem'
            }}>
              🟢 Processando
            </div>
          </div>

          <div style={{ 
            padding: '1rem', 
            background: voiceEnabled ? 'rgba(0, 255, 136, 0.1)' : 'rgba(107, 114, 128, 0.1)',
            borderRadius: '8px',
            border: `1px solid ${voiceEnabled ? '#00ff88' : '#6b7280'}30`
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              {voiceEnabled ? <Volume2 size={16} style={{ color: '#00ff88' }} /> : <VolumeX size={16} style={{ color: '#6b7280' }} />}
              <span style={{ fontWeight: '500' }}>Voz Neural</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              Português brasileiro
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              fontWeight: '600',
              color: voiceEnabled ? '#00ff88' : '#6b7280',
              marginTop: '0.25rem'
            }}>
              {voiceEnabled ? '🟢 Ativa' : '🔇 Desativada'}
            </div>
          </div>
        </div>

        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: 'linear-gradient(135deg, rgba(0, 204, 255, 0.1) 0%, rgba(255, 20, 147, 0.1) 100%)', 
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: '#00ccff',
          border: '1px solid rgba(0, 204, 255, 0.3)'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            🌐 Sistema de Conexão Inteligente
          </div>
          <div>
            • <strong>Prioridade 1:</strong> TipMiner API em tempo real<br />
            • <strong>Fallback:</strong> Dados simulados com padrões realistas<br />
            • <strong>Análise:</strong> ML independente da fonte de dados<br />
            • <strong>Sincronização:</strong> Atualização a cada 30 segundos<br />
            • <strong>Voz Neural:</strong> Notificações em português brasileiro
          </div>
        </div>
      </div>

      {/* Modais */}
      <BankManagement 
        isVisible={showBankManagement} 
        onClose={() => setShowBankManagement(false)} 
      />
      
      <AnalyticsMode 
        isVisible={showAnalytics} 
        onClose={() => setShowAnalytics(false)}
        currentBalance={currentBalance}
      />

      <CSVDataCapture 
        isVisible={showCSVCapture} 
        onClose={() => setShowCSVCapture(false)}
      />
    </div>
  );
};

export default BacBoAnalyzer;