# Deploy com Docker/Portainer

## Como funciona

Quando você define a variável `GEMINI_API_KEY` no `environment` do seu stack Docker/Portainer, ela fica disponível durante o build do projeto. O Vite pega essa variável e a embute no código JavaScript final.

## Configuração no Portainer

No seu `docker-compose.yml` ou stack do Portainer, configure assim:

```yaml
environment:
  - NODE_ENV=production
  - GEMINI_API_KEY=sua-chave-de-api-real-aqui
```

**IMPORTANTE:**
- Substitua `coloque_sua_chave_aqui` pela sua chave real
- A chave será embutida no código durante o build (`npm run build`)
- Não será necessário que os usuários insiram a chave manualmente
- A tela de inserção de chave será automaticamente pulada

## Segurança

⚠️ **ATENÇÃO**: Como a chave é embutida no JavaScript durante o build, ela ficará visível no código fonte do navegador. Isso é normal para aplicações client-side, mas:

1. Configure limites de uso na API do Google
2. Configure restrições de domínio/IP na chave de API (se possível)
3. Monitore o uso da API regularmente

## Como testar localmente

1. Crie um arquivo `.env` na raiz do projeto:
   ```
   GEMINI_API_KEY=sua-chave-aqui
   ```

2. Execute o build:
   ```bash
   npm run build
   ```

3. Teste o preview:
   ```bash
   npm run preview
   ```

A chave será automaticamente incluída no build.

