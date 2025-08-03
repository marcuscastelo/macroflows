# Análise de Erro: Correção de Estrutura de Testes

## Erro Cometido
Quando o usuário disse "fix tests after staged changes", interpretei incorretamente como "corrigir código para fazer testes passarem" ao invés de "corrigir a estrutura dos testes para refletir mudanças na organização dos arquivos".

## Contexto do Erro
- **Situação**: Usuário havia refatorado código separando responsabilidades em dois arquivos (dayDiet.ts e dayDietStore.ts)
- **Problema Real**: Testes estavam importando de locais incorretos após a refatoração
- **Minha Ação Incorreta**: Modifiquei código de produção para fazer testes passarem
- **Ação Correta**: Deveria ter movido/ajustado os testes para refletir a nova estrutura

## Sinais que Deveria Ter Percebido
1. **Comando específico**: "fix tests" - foco explícito nos testes, não no código
2. **Contexto de staged changes**: Mudanças já feitas pelo usuário, não para eu alterar
3. **Estrutura de arquivos nova**: Separação clara de responsabilidades já implementada
4. **Erro de import**: Teste importando de local que não existe mais

## Princípios para Evitar Repetir
1. **"Fix tests" significa ajustar testes, não código de produção**
2. **Quando há staged changes, o código já está como deve estar**
3. **Import errors em testes = mover imports, não recriar exports**
4. **Sempre perguntar quando ambíguo entre "fix code" vs "fix tests"**

## Diretrizes de Interpretação
- **"Fix tests"** = Ajustar estrutura, imports, mocks dos testes
- **"Fix code"** = Alterar lógica de produção
- **"Fix both"** = Só quando explicitamente mencionado

## Ação Correta para Este Caso
1. Analisar estrutura atual (dayDiet.ts vs dayDietStore.ts)
2. Identificar responsabilidades de cada arquivo
3. Mover testes para arquivos corretos conforme responsabilidades
4. Ajustar imports nos testes
5. Não tocar no código de produção