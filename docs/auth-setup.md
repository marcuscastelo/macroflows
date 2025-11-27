# Authentication Setup Guide

Este guia documenta como configurar a autenticação Google OAuth no Macroflows.

## 📋 Visão Geral

O sistema de autenticação foi implementado com:
- ✅ **Código base completo** - Módulo auth com arquitetura limpa
- ✅ **Persistência de sessão habilitada** - Sessions mantidas no refresh
- ✅ **Estrutura DDD** - Domain/Application/Infrastructure layers
- ✅ **Integração com app** - Inicialização automática no startup

## 🔧 Configuração Necessária

### 1. Google Cloud Console

#### Criar Projeto OAuth 2.0:
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione existente
3. Navegue para **APIs & Services** > **Credentials**
4. Clique em **+ CREATE CREDENTIALS** > **OAuth 2.0 Client IDs**

#### Configurar OAuth Client:
```
Application type: Web application
Name: Macroflows App

Authorized JavaScript origins:
- http://localhost:3000 (desenvolvimento)
- https://yourdomain.com (produção)

Authorized redirect URIs:
- http://localhost:3000/auth/callback (desenvolvimento)  
- https://yourdomain.com/auth/callback (produção)
- [URL do Supabase]/auth/v1/callback (ver Supabase dashboard)
```

#### Obter Credenciais:
- **Client ID**: Copie o Client ID gerado
- **Client Secret**: Copie o Client Secret gerado

### 2. Supabase Dashboard

#### Habilitar Google OAuth:
1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Navegue para **Authentication** > **Providers**
3. Encontre **Google** e clique para configurar

#### Configurar Provider:
```
Enable Google provider: ✓ Enabled

Google Client ID: [Cole o Client ID do Google Cloud Console]
Google Client Secret: [Cole o Client Secret do Google Cloud Console]

Skip email confirmation: ✓ (opcional, para facilitar desenvolvimento)
```

#### URL de Callback:
- Copie a **Callback URL** mostrada no dashboard
- Use esta URL nas **Authorized redirect URIs** do Google Cloud Console

### 3. Variáveis de Ambiente

#### Arquivo .env.local:
```bash
# Existing Supabase config
VITE_NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# New auth config (opcional para debugging)
VITE_GOOGLE_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-xxx...
```

**Nota**: As variáveis `VITE_GOOGLE_*` são opcionais. O Supabase gerencia o OAuth automaticamente.

## 🚀 Como Usar

### No código:
```typescript
import { signIn, signOut, authState, isAuthenticated } from '~/modules/auth/application/auth'

// Login com Google
await signIn({ provider: 'google' })

// Logout
await signOut()

// Verificar autenticação
const isLoggedIn = isAuthenticated()

// Estado reativo (SolidJS)
const user = authState().user
```

### Fluxo de autenticação:
1. **Usuário clica "Login with Google"**
2. **Redirecionamento** para Google OAuth
3. **Usuário autoriza** no Google
4. **Callback** para Supabase
5. **Redirecionamento** de volta para app
6. **Session estabelecida** e estado atualizado

## 🔍 Verificação

### Verificar configuração:
```bash
# 1. Build deve passar
pnpm check

# 2. App deve inicializar sem erros no console
pnpm dev

# 3. Auth state deve estar disponível
console.log(window.__MACROFLOWS_AUTH_STATE__)
```

### Debugging:
```typescript
// No browser console
import { getAuthState } from '~/modules/auth/application/auth'
console.log('Auth state:', getAuthState())
```

## 📝 Status Atual

### ✅ Implementado:
- [x] Módulo auth com clean architecture
- [x] Supabase session persistence habilitada
- [x] Google OAuth integration code
- [x] Auth state management (SolidJS signals)
- [x] Auto-initialization na startup
- [x] Error handling with `showError` and `logging`
- [x] TypeScript types para auth
- [x] Testes básicos

### 🔧 Requer configuração externa:
- [ ] Google Cloud Console OAuth setup
- [ ] Supabase Google provider config
- [ ] Testing com credenciais reais

### 💡 Próximos passos:
1. Configurar Google Cloud Console
2. Configurar Supabase Google provider  
3. Testar login/logout flow
4. Integrar com sistema de usuários existente
5. Implementar componentes UI de login

## 🔒 Segurança

- **Client Secret**: Apenas configure no Supabase, nunca no frontend
- **Redirect URIs**: Sempre use HTTPS em produção
- **CORS**: Configure origins autorizadas corretamente
- **Session**: Supabase gerencia tokens automaticamente

## 🤝 Integração com Sistema Atual

O sistema de **localStorage users** continua funcionando normalmente. O auth serve como camada adicional que pode ser progressivamente integrada sem quebrar funcionalidade existente.

### Estratégia de migração:
1. **Fase 1**: Sistema OAuth funcional (atual)
2. **Fase 2**: Conectar auth users com app users
3. **Fase 3**: Migrar de localStorage para auth sessions
4. **Fase 4**: Remover localStorage fallback

---

**📚 Documentação adicional:**
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)