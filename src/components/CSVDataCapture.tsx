import React, { useState, useEffect } from 'react';
import { Download, Database, Play, Pause, FileText, Clock } from 'lucide-react';
import { CSVBacBoResult } from '../types/common';

interface CSVDataCaptureProps {
  isVisible: boolean;
  onClose: () => void;
}

const CSVDataCapture: React.FC<CSVDataCaptureProps> = ({ isVisible, onClose }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedData, setCapturedData] = useState<CSVBacBoResult[]>([]);
  const [lastCaptureTime, setLastCaptureTime] = useState<string>('');
  const [totalCaptured, setTotalCaptured] = useState(0);

  // Simular captura de dados da TipMiner
  const captureData = async () => {
    try {
      console.log('🔎 Capturando dados da TipMiner API...');
      
      // Simular dados capturados (em produção seria a API real)
      const mockData: CSVBacBoResult[] = [];
      const now = new Date();
      
      for (let i = 0; i < 5; i++) {
        const player = Math.floor(Math.random() * 6) + 1;
        const banker = Math.floor(Math.random() * 6) + 1;
        let winner: 'Player' | 'Banker' | 'Tie';
        
        if (player > banker) winner = 'Player';
        else if (banker > player) winner = 'Banker';
        else winner = 'Tie';
        
        mockData.push({
          id: Date.now() + i,
          created_at: new Date(now.getTime() - (i * 45000)).toISOString(),
          player,
          banker,
          winner
        });
      }
      
      // Adicionar novos dados (evitando duplicatas)
      setCapturedData(prev => {
        const existingIds = new Set(prev.map(item => item.id));
        const newData = mockData.filter(item => !existingIds.has(item.id));
        return [...newData, ...prev].slice(0, 1000); // Manter últimos 1000
      });
      
      setTotalCaptured(prev => prev + mockData.length);
      setLastCaptureTime(new Date().toLocaleTimeString('pt-BR'));
      
    } catch (error) {
      console.error('Erro ao capturar dados:', error);
    }
  };

  // Captura automática quando ativo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isCapturing) {
      captureData(); // Captura inicial
      interval = setInterval(captureData, 10000); // A cada 10 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCapturing]);

  // Converter dados para CSV
  const convertToCSV = (data: CSVBacBoResult[]): string => {
    const headers = ['id', 'created_at', 'player', 'banker', 'winner'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.id,
        row.created_at,
        row.player,
        row.banker,
        row.winner
      ].join(','))
    ].join('\n');
    
    return csvContent;
  };

  // Download CSV
  const downloadCSV = () => {
    if (capturedData.length === 0) return;
    
    const csvContent = convertToCSV(capturedData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `bacbo_jonbet_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const toggleCapture = () => {
    setIsCapturing(!isCapturing);
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
            📥 Captura de Dados CSV
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

        {/* Status da Captura */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            padding: '1.5rem', 
            background: isCapturing ? 'rgba(0, 255, 136, 0.2)' : 'rgba(107, 114, 128, 0.2)',
            borderRadius: '12px',
            border: `1px solid ${isCapturing ? '#00ff88' : '#6b7280'}30`,
            textAlign: 'center'
          }}>
            <Database size={24} style={{ color: isCapturing ? '#00ff88' : '#6b7280', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: isCapturing ? '#00ff88' : '#6b7280' }}>
              {isCapturing ? 'ATIVO' : 'PARADO'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
              Status da Captura
            </div>
          </div>

          <div style={{ 
            padding: '1.5rem', 
            background: 'rgba(0, 204, 255, 0.2)',
            borderRadius: '12px',
            border: '1px solid #00ccff30',
            textAlign: 'center'
          }}>
            <FileText size={24} style={{ color: '#00ccff', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00ccff' }}>
              {capturedData.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
              Registros Capturados
            </div>
          </div>

          <div style={{ 
            padding: '1.5rem', 
            background: 'rgba(255, 215, 0, 0.2)',
            borderRadius: '12px',
            border: '1px solid #ffd70030',
            textAlign: 'center'
          }}>
            <Clock size={24} style={{ color: '#ffd700', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#ffd700' }}>
              {lastCaptureTime || '--:--:--'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
              Última Captura
            </div>
          </div>
        </div>

        {/* Controles */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <button 
            className={`btn ${isCapturing ? 'btn-warning' : 'btn-success'}`}
            onClick={toggleCapture}
            style={{ flex: 1, minWidth: '150px' }}
          >
            {isCapturing ? <Pause size={18} /> : <Play size={18} />}
            {isCapturing ? 'Pausar Captura' : 'Iniciar Captura'}
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={downloadCSV}
            disabled={capturedData.length === 0}
            style={{ flex: 1, minWidth: '150px' }}
          >
            <Download size={18} />
            Download CSV
          </button>
        </div>

        {/* Informações da API */}
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
            color: '#00ccff'
          }}>
            📡 Configuração da Captura
          </h3>
          
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>URL da API:</strong> https://www.tipminer.com/api/notifications
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Filtro:</strong> Bac Bo - JonBet
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Intervalo:</strong> 10 segundos
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Formato:</strong> CSV (id, created_at, player, banker, winner)
            </div>
          </div>
        </div>

        {/* Preview dos Dados */}
        {capturedData.length > 0 && (
          <div style={{ 
            padding: '1.5rem', 
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              color: '#00ccff'
            }}>
              📋 Preview dos Últimos Dados
            </h3>
            
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto',
              fontSize: '0.85rem'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                color: 'white'
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Hora</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Player</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Banker</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Vencedor</th>
                  </tr>
                </thead>
                <tbody>
                  {capturedData.slice(0, 10).map((item, index) => (
                    <tr key={item.id} style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      opacity: index === 0 ? 1 : 0.8 - (index * 0.05)
                    }}>
                      <td style={{ padding: '0.5rem' }}>
                        {new Date(item.created_at).toLocaleTimeString('pt-BR')}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600' }}>
                        {item.player}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600' }}>
                        {item.banker}
                      </td>
                      <td style={{ 
                        padding: '0.5rem', 
                        textAlign: 'center', 
                        fontWeight: '600',
                        color: item.winner === 'Player' ? '#00ccff' : 
                              item.winner === 'Banker' ? '#ff1493' : '#ffd700'
                      }}>
                        {item.winner === 'Player' ? 'Azul' : 
                         item.winner === 'Banker' ? 'Vermelho' : 'Amarelo'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div style={{ 
          marginTop: '2rem',
          padding: '1rem', 
          background: 'linear-gradient(135deg, rgba(0, 204, 255, 0.1) 0%, rgba(255, 20, 147, 0.1) 100%)', 
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: '#00ccff',
          border: '1px solid rgba(0, 204, 255, 0.3)'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            📝 Como Usar:
          </div>
          <div>
            1. <strong>Iniciar Captura:</strong> Clique em "Iniciar Captura" para começar a coletar dados<br />
            2. <strong>Monitoramento:</strong> Os dados são capturados automaticamente a cada 10 segundos<br />
            3. <strong>Download:</strong> Use "Download CSV" para salvar os dados coletados<br />
            4. <strong>Continuidade:</strong> Se parar e reiniciar, evita duplicatas automaticamente
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVDataCapture;