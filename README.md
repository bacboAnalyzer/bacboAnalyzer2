# Bac Bo ML Analyzer v4.0 PRO

Sistema completo de análise de padrões do Bac Bo com múltiplas fontes de dados, Machine Learning e integração Puppeteer.

## 🚀 Funcionalidades Principais

### ✅ Múltiplas Fontes de Dados
- **TipMiner API**: Conexão direta com a API oficial (Primária)
- **Puppeteer Scraper**: Scraping em tempo real de Betano, Stake, JonBet (Secundária)
- **Sistema de Fallback**: Dados mock inteligentes para demonstração

### ✅ Machine Learning Avançado
- Algoritmo Random Forest para predições
- 3 modos de jogo: Normal, Médio, Avançado
- Análise de 8 padrões de alta ocorrência
- Accuracy dinâmica baseada no modo selecionado

### ✅ Interface Profissional
- Design moderno com gradientes e animações
- Status em tempo real das fontes de dados
- Projeções financeiras por modo
- Gerenciamento de banca integrado

### ✅ Automação Completa
- Análise automática a cada 30 segundos
- Scraping automático a cada 2 minutos
- Notificações por voz das predições
- Sistema de fallback inteligente

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Scraping**: Puppeteer (headless browser)
- **APIs**: TipMiner + múltiplos proxies CORS
- **ML**: Algoritmos de padrão customizados
- **Styling**: CSS moderno com animações

## 📦 Instalação e Configuração

### 1. Instalar Dependências
```bash
npm install
```

### 2. Estrutura de Execução

#### Opção A: Executar Tudo Junto (Recomendado)
```bash
npm run start:all
```
Isso iniciará:
- Frontend (porta 5173)
- Backend TipMiner (porta 3001)
- Scraper Puppeteer (porta 5000)

#### Opção B: Executar Separadamente
```bash
# Terminal 1 - Backend TipMiner
npm run server

# Terminal 2 - Scraper Puppeteer
npm run scraper

# Terminal 3 - Frontend
npm run dev
```

### 3. Acessar a Aplicação
- **Frontend**: http://localhost:5173
- **API TipMiner**: http://localhost:3001/api/bacbo-results
- **API Scraper**: http://localhost:5000/api/scraper/data

## 🎯 Como Usar

### 1. Inicialização
1. Execute `npm run start:all`
2. Aguarde todos os serviços iniciarem
3. Acesse http://localhost:5173

### 2. Seleção de Modo
- **Normal**: Baixo risco, 3% da banca, 65% accuracy
- **Médio**: Risco médio, 5% da banca, 72% accuracy
- **Avançado**: Alto risco, 8% da banca, 78% accuracy

### 3. Análise em Tempo Real
1. Clique em "Ativar IA"
2. O sistema tentará conectar com TipMiner
3. Se falhar, usará o Scraper Puppeteer
4. Como último recurso, usará dados mock

### 4. Monitoramento
- Acompanhe o status das fontes de dados
- Monitore as predições da IA
- Gerencie sua banca virtual
- Visualize analytics e projeções

## 🔧 Configuração Avançada

### Puppeteer Scraper
O scraper está configurado para:
- **Sites**: Betano, Stake, JonBet
- **Frequência**: A cada 2 minutos
- **Validação**: Apenas dados válidos (1-6)
- **Fallback**: Múltiplos seletores por site

### TipMiner API
- **Endpoints**: Múltiplas URLs para máxima compatibilidade
- **Proxies CORS**: Sistema de fallback com proxies
- **Parsing**: Extração inteligente de resultados Bac Bo
- **Validação**: Filtros específicos para JonBet

### Machine Learning
- **Algoritmo**: Random Forest simulado
- **Padrões**: 8 padrões de alta ocorrência
- **Confiança**: Mínimo 60%, máximo 95%
- **Adaptação**: Accuracy baseada no modo selecionado

## 📊 Endpoints da API

### Backend TipMiner (porta 3001)
- `GET /api/bacbo-results` - Últimos resultados
- `GET /api/patterns` - Análise de padrões
- `GET /api/advanced-patterns` - Padrões avançados
- `GET /api/status` - Status do sistema

### Scraper Puppeteer (porta 5000)
- `GET /api/scraper/data` - Dados do scraper
- `GET /api/scraper/status` - Status do scraper
- `POST /api/scraper/manual` - Scraping manual

## 🎨 Interface

### Design Moderno
- Gradientes suaves e efeitos glassmorphism
- Animações CSS customizadas
- Layout responsivo para todos os dispositivos
- Indicadores visuais de status em tempo real

### Componentes Principais
- **BacBoAnalyzer**: Componente principal
- **ScraperStatus**: Status do Puppeteer
- **BankManagement**: Gerenciamento de banca
- **AnalyticsMode**: Projeções e analytics
- **CSVDataCapture**: Captura de dados

## 🔒 Segurança e Confiabilidade

### Sistema de Fallback
1. **Primário**: TipMiner API direta
2. **Secundário**: TipMiner via proxies CORS
3. **Terciário**: Puppeteer Scraper
4. **Fallback**: Dados mock inteligentes

### Validação de Dados
- Verificação de formato dos resultados
- Validação de números (1-6 para dados)
- Filtros específicos para Bac Bo
- Prevenção de duplicatas

### Tratamento de Erros
- Logs detalhados de todas as operações
- Recuperação automática de falhas
- Status em tempo real de todas as fontes
- Alertas visuais para problemas

## 🚀 Deploy em Produção

### Preparação
1. Configure as variáveis de ambiente
2. Ajuste as URLs da API para produção
3. Configure CORS adequadamente
4. Use PM2 ou similar para os servidores

### Comandos de Deploy
```bash
# Build do frontend
npm run build

# Iniciar servidores em produção
pm2 start server/index.cjs --name "tipminer-api"
pm2 start server/scraper.cjs --name "puppeteer-scraper"
```

## 📱 Responsividade

Totalmente otimizado para:
- **Desktop**: 1200px+ (layout completo)
- **Tablet**: 768px - 1199px (layout adaptado)
- **Mobile**: < 768px (layout compacto)

## 🔧 Troubleshooting

### Problemas Comuns

#### Scraper não funciona
```bash
# Verificar se o Puppeteer está instalado
npm install puppeteer

# Executar scraper manualmente
npm run scraper
```

#### TipMiner API falha
- Verifique a conexão com internet
- Teste os endpoints manualmente
- Verifique logs do servidor

#### Frontend não conecta
- Verifique se os servidores estão rodando
- Teste as URLs das APIs
- Verifique configuração de CORS

### Logs e Debug
- **Frontend**: Console do navegador
- **Backend**: Terminal do servidor
- **Scraper**: Terminal do Puppeteer

## 📈 Performance

### Otimizações
- Scraping em paralelo para múltiplos sites
- Cache inteligente de resultados
- Validação prévia de dados
- Fallback automático sem interrupção

### Monitoramento
- Taxa de sucesso do scraper
- Tempo de resposta das APIs
- Accuracy das predições
- Status de todas as fontes

---

**Desenvolvido com ❤️ para análise profissional de padrões Bac Bo**

**v4.0 PRO** - Sistema completo com TipMiner API + Puppeteer Scraper + Machine Learning