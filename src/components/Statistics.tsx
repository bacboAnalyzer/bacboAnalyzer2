import React, { useMemo } from 'react';
import { BarChart3, Percent, TrendingUp, Target } from 'lucide-react';

interface BacBoResult {
  casa: number;
  visitante: number;
  timestamp: string;
  winner: 'Casa' | 'Visitante' | 'Empate';
}

interface StatisticsProps {
  results: BacBoResult[];
}

const Statistics: React.FC<StatisticsProps> = ({ results }) => {
  const stats = useMemo(() => {
    if (results.length === 0) {
      return {
        casaWins: 0,
        visitanteWins: 0,
        empates: 0,
        casaPercentage: 0,
        visitantePercentage: 0,
        empatePercentage: 0,
        avgCasaScore: 0,
        avgVisitanteScore: 0,
        totalGames: 0
      };
    }

    const casaWins = results.filter(r => r.winner === 'Casa').length;
    const visitanteWins = results.filter(r => r.winner === 'Visitante').length;
    const empates = results.filter(r => r.winner === 'Empate').length;
    const totalGames = results.length;

    const avgCasaScore = results.reduce((sum, r) => sum + r.casa, 0) / totalGames;
    const avgVisitanteScore = results.reduce((sum, r) => sum + r.visitante, 0) / totalGames;

    return {
      casaWins,
      visitanteWins,
      empates,
      casaPercentage: (casaWins / totalGames) * 100,
      visitantePercentage: (visitanteWins / totalGames) * 100,
      empatePercentage: (empates / totalGames) * 100,
      avgCasaScore,
      avgVisitanteScore,
      totalGames
    };
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
        <BarChart3 size={20} />
        Estatísticas Gerais
      </h3>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{stats.totalGames}</div>
          <div className="stat-label">Total de Jogos</div>
        </div>

        <div className="stat-item">
          <div className="stat-value" style={{ color: '#dc2626' }}>
            {stats.casaWins}
          </div>
          <div className="stat-label">Vitórias Casa</div>
        </div>

        <div className="stat-item">
          <div className="stat-value" style={{ color: '#2563eb' }}>
            {stats.visitanteWins}
          </div>
          <div className="stat-label">Vitórias Visitante</div>
        </div>

        <div className="stat-item">
          <div className="stat-value" style={{ color: '#6b7280' }}>
            {stats.empates}
          </div>
          <div className="stat-label">Empates</div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <h4 style={{ 
          fontSize: '1rem', 
          fontWeight: '500', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Percent size={16} />
          Percentuais de Vitória
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Casa:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                width: '100px', 
                height: '8px', 
                background: '#fee2e2', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${stats.casaPercentage}%`, 
                  height: '100%', 
                  background: '#dc2626',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <span style={{ fontWeight: '500', minWidth: '45px' }}>
                {stats.casaPercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Visitante:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                width: '100px', 
                height: '8px', 
                background: '#dbeafe', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${stats.visitantePercentage}%`, 
                  height: '100%', 
                  background: '#2563eb',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <span style={{ fontWeight: '500', minWidth: '45px' }}>
                {stats.visitantePercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Empate:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                width: '100px', 
                height: '8px', 
                background: '#f3f4f6', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${stats.empatePercentage}%`, 
                  height: '100%', 
                  background: '#6b7280',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <span style={{ fontWeight: '500', minWidth: '45px' }}>
                {stats.empatePercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {stats.totalGames > 0 && (
        <div style={{ 
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '8px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            color: '#4f46e5'
          }}>
            <div>
              <strong>Média Casa:</strong> {stats.avgCasaScore.toFixed(1)}
            </div>
            <div>
              <strong>Média Visitante:</strong> {stats.avgVisitanteScore.toFixed(1)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;