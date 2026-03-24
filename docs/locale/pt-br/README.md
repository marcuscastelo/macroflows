# Macroflows 
###  [![PT-BR](https://img.shields.io/badge/lang-PT--BR_(cur.)-lightgray)](README.md) [![EN](https://img.shields.io/badge/lang-EN-blue)](../../../README.md)

https://macroflows.vercel.app

Uma plataforma modular e de alto desempenho para rastreamento nutricional, construída com SolidJS, tipagem forte e princípios de arquitetura limpa.

![Versão](https://img.shields.io/badge/version-0.14.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![SolidJS](https://img.shields.io/badge/SolidJS-2c4f7c?logo=solid&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

---

## Capturas de tela

<p>Clique nas miniaturas para abrir/fechar cada imagem individualmente — assim você não precisa rolar a página para ver o conteúdo.</p>

<table>
  <tr>
    <td>
      <details>
        <summary>Página de Dieta</summary>
        <p>
          <img src="https://github.com/user-attachments/assets/bf294e75-117c-447b-8953-6452877dfb46" alt="Diet Page" width="768"/>
        </p>
      </details>
    </td>
  </tr>
  <tr>
    <td>
      <details>
        <summary>Busca de Alimentos</summary>
        <p>
          <img src="https://github.com/user-attachments/assets/1b982883-b36b-49ab-a4be-a45d3d574c78" alt="Food Search" width="771"/>
        </p>
      </details>
    </td>
  </tr>
  <tr>
    <td>
      <details>
        <summary>Registro de Peso</summary>
        <p>
          <img src="https://github.com/user-attachments/assets/e8939ee8-4e28-4e10-b870-8ab51044e54e" alt="Weight Tracking" width="764"/>
        </p>
      </details>
    </td>
  </tr>
  <tr>
    <td>
      <details>
        <summary>Perfil de Macronutrientes</summary>
        <p>
          <img src="https://github.com/user-attachments/assets/0066ad09-2d49-49aa-929a-5ef639373329" alt="Macro Profile" width="777"/>
        </p>
      </details>
    </td>
  </tr>
</table>

## Visão Geral

Macroflows é um sistema de rastreamento nutricional focado em tipagem forte, interface reativa e design modular orientado por domínio. Segue princípios de arquitetura limpa e integra-se com ferramentas modernas de frontend e backend.

Por enquanto, está focado em ser um projeto pessoal para acompanhar minha própria nutrição, mas talvez no futuro se torne um produto SaaS.

## Documentação do projeto

- Ponto de entrada padrão para agentes em todo o repositório: [AGENTS.md](./AGENTS.md)
- Mapa da arquitetura padrão: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Regras canônicas de dependência e propriedade: [docs/BOUNDARIES.md](./docs/BOUNDARIES.md)
- Governança da documentação canônica: [docs/DOCS_GOVERNANCE.md](./docs/DOCS_GOVERNANCE.md)
- Índice ADR: [docs/adr/README.md](./docs/adr/README.md)

---

## Funcionalidades

### Nutrição & Progresso
- Rastreamento de macros (carboidratos, proteína, gordura)
- Cálculos de calorias e macros em tempo real
- Perfis de macronutrientes personalizados (g/kg)
- Visualização do progresso diário com gráficos

### Dados Corporais
- Estimativa de gordura corporal (método U.S. Navy)
- Registro de peso com visualização de tendência

### Gerenciamento de Alimentos
- Leitura de código de barras EAN
- Banco de dados de alimentos pesquisável
- Pesquisas recentes, favoritos e histórico do usuário
- Criador de receitas personalizadas com cálculo automático de macros
- Planejamento de refeições e modelos reutilizáveis

### Interface do Usuário
- Design responsivo
- Atualizações em tempo real de granularidade fina (signals do SolidJS)
- Navegação simples e rápida, otimizada para uso diário

---

## Arquitetura

```
src/
└── modules/                
    ├── diet/               # Módulo de rastreamento de dieta
    │   ├── application/    # Casos de uso e lógica de negócio
    │   ├── domain/         # Entidades centrais do domínio e tipos
    │   ├── infrastructure/ # Fontes de dados (API, DB)
    │   └── ui/             # Componentes de UI específicos do módulo de dieta
    ├── body/               # Módulo de dados corporais
    │   ├── ...             # Estrutura similar ao módulo de dieta
    ├── clipboard/          # Módulo de gerenciamento da área de transferência
    │   ├── ...             # Estrutura similar ao módulo de dieta
    └── ...                 # Outros módulos (auth, recipes, food search, etc.)
```

---

## Tecnologias

- **Frontend:** SolidJS, TypeScript, TailwindCSS  
- **Backend:** Supabase (PostgreSQL, Realtime)
  - Observação: para simplicidade, o backend está fortemente acoplado ao frontend neste projeto.
- **Validação & Gráficos:** Zod, ApexCharts  
- **Ferramentas de desenvolvimento:** ESLint, Prettier, html5-qrcode

---

## Primeiros Passos

### Requisitos
- Node.js 20+
- Conta Supabase

### Configuração

> **Variáveis de Ambiente:**
> Copie `.env.example` para `.env.local` e preencha os valores necessários. Este arquivo lista todas as variáveis de ambiente necessárias para executar o projeto.
> Não commitare segredos no controle de versão.

```bash
git clone https://github.com/marcuscastelo/macroflows.git
cd macroflows
npm install

cp .env.example .env.local  # Adicione suas credenciais do Supabase
npm run dev
```

---

## Roteiro

- Integração com OpenTelemetry
- Suporte PWA
- Reconhecimento de alimentos por ML
- Recursos sociais (compartilhamento, colaboração)

---

## Licença

MIT — veja [LICENSE](LICENSE) para detalhes.
