import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Target, Settings, PiggyBank, CreditCard, Volume2, VolumeX } from 'lucide-react';

interface BankData {
  balance: number;
  initialBalance: number;
  dailyProfit: number;
  dailyGoal: number;
  stopLoss: number;
  stopWin: number;
  transactions: Transaction[];
  voiceEnabled: boolean;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'profit' | 'loss';
  amount: number;
  timestamp: string;
  description: string;
}

interface BankManagementProps {
  isVisible: boolean;
  onClose: () => void;
}

interface NotificationProps {
  type: 'deposit' | 'withdraw';
  amount: number;
  onComplete: () => void;
}

const AnimatedNotification: React.FC<NotificationProps> = ({ type, amount, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const isDeposit = type === 'deposit';
  const color = isDeposit ? '#00ff88' : '#ff1493';
  const emoji = isDeposit ? '💰' : '💸';
  const action = isDeposit ? 'Depósito' : 'Saque';

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      background: `linear-gradient(135deg, ${color}20 0%, rgba(0,0,0,0.9) 100%)`,
      border: `2px solid ${color}`,
      borderRadius: '16px',
      padding: '1.5rem',
      minWidth: '300px',
      boxShadow: `0 0 30px ${color}50`,
      animation: 'slideInRight 0.5s ease-out, pulse 2s infinite'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
          fontSize: '2rem',
          filter: `drop-shadow(0 0 10px ${color})`
        }}>
          {emoji}
        </div>
        <div>
          <div style={{ 
            fontSize: '1.2rem', 
            fontWeight: '700', 
            color: color,
            marginBottom: '0.25rem'
          }}>
            {action} Realizado!
          </div>
          <div style={{ 
            fontSize: '1rem', 
            color: 'white',
            fontWeight: '600'
          }}>
            R$ {amount.toFixed(2)}
          </div>
        </div>
      </div>
      
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
            box-shadow: 0 0 30px ${color}50;
          }
          50% { 
            transform: scale(1.02);
            box-shadow: 0 0 40px ${color}80;
          }
        }
      `}</style>
    </div>
  );
};

const BankManagement: React.FC<BankManagementProps> = ({ isVisible, onClose }) => {
  const [bankData, setBankData] = useState<BankData>({
    balance: 1000,
    initialBalance: 1000,
    dailyProfit: 0,
    dailyGoal: 200,
    stopLoss: 500,
    stopWin: 1500,
    transactions: [],
    voiceEnabled: true
  });

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showTransactions, setShowTransactions] = useState(false);
  const [notification, setNotification] = useState<{ type: 'deposit' | 'withdraw'; amount: number } | null>(null);

  // Carregar dados do localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('bacbo_bank_data');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setBankData(prev => ({ ...prev, ...parsedData }));
    }
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    localStorage.setItem('bacbo_bank_data', JSON.stringify(bankData));
  }, [bankData]);

  // Função para voz neural
  const speakNotification = (message: string) => {
    if (bankData.voiceEnabled && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      speechSynthesis.speak(utterance);
    }
  };

  const addTransaction = (type: Transaction['type'], amount: number, description: string) => {
    const transaction: Transaction = {
      id: Date.now().toString(),
      type,
      amount,
      timestamp: new Date().toISOString(),
      description
    };

    setBankData(prev => ({
      ...prev,
      transactions: [transaction, ...prev.transactions.slice(0, 49)] // Manter últimas 50
    }));
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (amount > 0) {
      setBankData(prev => ({
        ...prev,
        balance: prev.balance + amount
      }));
      
      addTransaction('deposit', amount, `Depósito de R$ ${amount.toFixed(2)}`);
      
      // Notificação animada
      setNotification({ type: 'deposit', amount });
      
      // Voz neural
      speakNotification(`Depósito de ${amount.toFixed(0)} reais realizado com sucesso. Novo saldo: ${(bankData.balance + amount).toFixed(0)} reais.`);
      
      setDepositAmount('');
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= bankData.balance) {
      setBankData(prev => ({
        ...prev,
        balance: prev.balance - amount
      }));
      
      addTransaction('withdraw', amount, `Saque de R$ ${amount.toFixed(2)}`);
      
      // Notificação animada
      setNotification({ type: 'withdraw', amount });
      
      // Voz neural
      speakNotification(`Saque de ${amount.toFixed(0)} reais realizado com sucesso. Novo saldo: ${(bankData.balance - amount).toFixed(0)} reais.`);
      
      setWithdrawAmount('');
    }
  };

  const toggleVoice = () => {
    setBankData(prev => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
    
    if (!bankData.voiceEnabled) {
      speakNotification('Voz neural ativada com sucesso!');
    }
  };

  const resetBank = () => {
    setBankData(prev => ({
      ...prev,
      balance: prev.initialBalance,
      dailyProfit: 0,
      transactions: []
    }));
    
    speakNotification('Banca resetada para o valor inicial.');
  };

  const profitPercentage = ((bankData.balance - bankData.initialBalance) / bankData.initialBalance) * 100;
  const goalProgress = (bankData.dailyProfit / bankData.dailyGoal) * 100;

  if (!isVisible) return null;

  return (
    <>
      {/* Notificação Animada */}
      {notification && (
        <AnimatedNotification
          type={notification.type}
          amount={notification.amount}
          onComplete={() => setNotification(null)}
        />
      )}

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
          maxWidth: '700px',
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
              💰 Gerenciamento de Banca
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Botão Voz Neural */}
              <button
                onClick={toggleVoice}
                style={{
                  background: bankData.voiceEnabled ? 
                    'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)' :
                    'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '45px',
                  height: '45px',
                  color: bankData.voiceEnabled ? '#000' : '#fff',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: bankData.voiceEnabled ? '0 0 15px rgba(0, 255, 136, 0.5)' : 'none'
                }}
                title={bankData.voiceEnabled ? 'Desativar Voz Neural' : 'Ativar Voz Neural'}
              >
                {bankData.voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>

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
          </div>

          {/* Status da Voz */}
          {bankData.voiceEnabled && (
            <div style={{ 
              padding: '0.75rem', 
              background: 'rgba(0, 255, 136, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Volume2 size={16} style={{ color: '#00ff88' }} />
              <span style={{ color: '#00ff88', fontSize: '0.9rem', fontWeight: '600' }}>
                Voz Neural Ativa - Notificações por voz habilitadas
              </span>
            </div>
          )}

          {/* Resumo da Banca */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              padding: '1.5rem', 
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 204, 102, 0.1) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              textAlign: 'center'
            }}>
              <PiggyBank size={24} style={{ color: '#00ff88', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00ff88' }}>
                R$ {bankData.balance.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                Saldo Atual
              </div>
            </div>

            <div style={{ 
              padding: '1.5rem', 
              background: `linear-gradient(135deg, ${profitPercentage >= 0 ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 20, 147, 0.2)'} 0%, rgba(0, 0, 0, 0.1) 100%)`,
              borderRadius: '12px',
              border: `1px solid ${profitPercentage >= 0 ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 20, 147, 0.3)'}`,
              textAlign: 'center'
            }}>
              {profitPercentage >= 0 ? 
                <TrendingUp size={24} style={{ color: '#00ff88', marginBottom: '0.5rem' }} /> :
                <TrendingDown size={24} style={{ color: '#ff1493', marginBottom: '0.5rem' }} />
              }
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: profitPercentage >= 0 ? '#00ff88' : '#ff1493'
              }}>
                {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                Lucro/Prejuízo
              </div>
            </div>

            <div style={{ 
              padding: '1.5rem', 
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(204, 172, 0, 0.1) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              textAlign: 'center'
            }}>
              <Target size={24} style={{ color: '#ffd700', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffd700' }}>
                {goalProgress.toFixed(0)}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                Meta Diária
              </div>
            </div>
          </div>

          {/* Operações */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              padding: '1.5rem', 
              background: 'rgba(40, 40, 40, 0.8)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                color: '#00ff88',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CreditCard size={18} />
                Depósito
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Valor do depósito"
                  style={{
                    padding: '0.75rem',
                    border: '2px solid rgba(0, 255, 136, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                />
                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  className="btn btn-success"
                  style={{ width: '100%' }}
                >
                  💰 Depositar
                </button>
              </div>
            </div>

            <div style={{ 
              padding: '1.5rem', 
              background: 'rgba(40, 40, 40, 0.8)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                color: '#ff1493',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <DollarSign size={18} />
                Saque
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Valor do saque"
                  max={bankData.balance}
                  style={{
                    padding: '0.75rem',
                    border: '2px solid rgba(255, 20, 147, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                />
                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > bankData.balance}
                  className="btn btn-warning"
                  style={{ width: '100%' }}
                >
                  💸 Sacar
                </button>
              </div>
            </div>
          </div>

          {/* Configurações de Stop */}
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
              marginBottom: '1rem',
              color: '#00ccff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Settings size={18} />
              Configurações de Proteção
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', display: 'block' }}>
                  Stop Loss (R$)
                </label>
                <input
                  type="number"
                  value={bankData.stopLoss}
                  onChange={(e) => setBankData(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid rgba(255, 20, 147, 0.3)',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: 'white',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', display: 'block' }}>
                  Stop Win (R$)
                </label>
                <input
                  type="number"
                  value={bankData.stopWin}
                  onChange={(e) => setBankData(prev => ({ ...prev, stopWin: parseFloat(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: 'white',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Controles */}
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="btn btn-primary"
              style={{ marginRight: '1rem' }}
            >
              {showTransactions ? 'Ocultar' : 'Ver'} Histórico
            </button>
            
            <button
              onClick={resetBank}
              className="btn btn-warning"
            >
              Reset Banca
            </button>
          </div>

          {showTransactions && (
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'white' }}>
                Últimas Transações
              </h4>
              {bankData.transactions.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                  Nenhuma transação ainda
                </div>
              ) : (
                bankData.transactions.slice(0, 10).map((transaction) => (
                  <div 
                    key={transaction.id}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '0.5rem 0',
                      borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'white' }}>
                        {transaction.description}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                        {new Date(transaction.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: '600',
                      color: transaction.type === 'deposit' || transaction.type === 'profit' ? '#00ff88' : '#ff1493'
                    }}>
                      {transaction.type === 'deposit' || transaction.type === 'profit' ? '+' : '-'}
                      R$ {transaction.amount.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BankManagement;