# Controle de Insumos - WD

Sistema de controle de entrada e saída de insumos para 9 filiais no Rio de Janeiro.

## Stack
- Frontend: React + Vite (PWA)
- Backend: Node.js + Express
- Banco de dados: Google Sheets API v4
- Autenticação: JWT

## Funcionalidades
- Login com perfil por filial (gestor e responsável)
- Registro de entrada de insumos
- Registro de saída e transferência entre filiais
- Cadastro de insumos e filiais (painel do gestor)
- Dashboard de estoque atual com alertas críticos
- Relatório de movimentações com filtros e exportação CSV
- Painel de GAPs — detecção automática de inconsistências

## Estrutura
- /frontend — interface React
- /backend — API Node.js

## Configuração
1. Copie o `.env.example` para `.env`
2. Preencha as variáveis de ambiente
3. Instale as dependências: `npm install` em /backend e /frontend
4. Backend: `npm run dev` na pasta /backend
5. Frontend: `npm run dev` na pasta /frontend

# Dependências adicionais para gráficos
npm install chart.js react-chartjs-2

## Autor
Wilson Alzuguir — Setor de Compras
Projeto iniciado em junho de 2026