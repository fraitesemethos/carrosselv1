# Guia de Deploy na VPS

Este guia explica como fazer o deploy deste aplicativo em uma VPS (Virtual Private Server).

## Pré-requisitos

- Node.js 18+ instalado na VPS
- NPM ou Yarn instalado
- Acesso SSH à VPS
- Chave de API do Google Gemini (GEMINI_API_KEY)

## Passos para Deploy

### 1. Preparação do Projeto

Clone ou faça upload dos arquivos do projeto para a VPS:

```bash
# Via git
git clone <seu-repositorio> /caminho/do/projeto

# Ou faça upload via SFTP/SCP
```

### 2. Instalação de Dependências

```bash
cd /caminho/do/projeto
npm install
```

### 3. Variáveis de Ambiente

Crie um arquivo `.env.production` na raiz do projeto (ou `.env`):

```bash
GEMINI_API_KEY=sua-chave-de-api-aqui
```

**IMPORTANTE**: 
- Não commite o arquivo `.env` no git
- Adicione `.env*` ao `.gitignore`
- A chave de API também pode ser inserida pelo usuário no navegador (mais seguro)

### 4. Build do Projeto

```bash
npm run build
```

Isso criará uma pasta `dist/` com os arquivos otimizados para produção.

### 5. Opções de Servidor

#### Opção A: Usar Vite Preview (Recomendado para Testes)

```bash
npm run start
# ou
npm run preview
```

#### Opção B: Usar Nginx (Recomendado para Produção)

1. **Instale o Nginx**:
```bash
sudo apt update
sudo apt install nginx
```

2. **Configure o Nginx**:
Crie um arquivo de configuração `/etc/nginx/sites-available/seu-app`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    root /caminho/do/projeto/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. **Habilite o site e reinicie o Nginx**:
```bash
sudo ln -s /etc/nginx/sites-available/seu-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Opção C: Usar PM2 com Vite Preview

1. **Instale o PM2**:
```bash
npm install -g pm2
```

2. **Crie um arquivo `ecosystem.config.js`**:
```javascript
module.exports = {
  apps: [{
    name: 'carrossel-app',
    script: 'npm',
    args: 'run preview',
    cwd: '/caminho/do/projeto',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

3. **Inicie com PM2**:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Firewall

Certifique-se de que a porta 80 (HTTP) ou 443 (HTTPS) está aberta:

```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw status
```

### 7. HTTPS com Let's Encrypt (Opcional mas Recomendado)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

## Troubleshooting

### Erro: "Cannot find module" ou "Module not found"
- Execute `npm install` novamente
- Verifique se todas as dependências estão no `package.json`

### Erro: "API key not valid"
- Verifique se a chave de API está correta
- Lembre-se que a chave também pode ser inserida pelo usuário no navegador

### Erro: CORS
- Como a API é chamada do navegador, não deve haver problemas de CORS
- Se houver, verifique se o domínio está configurado corretamente na API do Google

### Erro: "Port already in use"
- Altere a porta no `vite.config.ts` ou mate o processo usando a porta:
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Build falha
- Verifique se o Node.js está na versão 18+
- Execute `rm -rf node_modules package-lock.json && npm install`
- Verifique os logs de erro para mais detalhes

## Atualização do Deploy

Sempre que fizer mudanças:

```bash
cd /caminho/do/projeto
git pull  # se usar git
npm install
npm run build
# Reinicie o servidor (PM2, Nginx, etc)
```

## Monitoramento

Para monitorar com PM2:
```bash
pm2 status
pm2 logs carrossel-app
pm2 monit
```

## Segurança

1. **Nunca commite a chave de API**
2. **Use HTTPS em produção**
3. **Configure rate limiting no Nginx se necessário**
4. **Mantenha o sistema e dependências atualizadas**

## Notas Importantes

- Este app funciona no **cliente (navegador)**, então a chave de API é inserida pelo usuário
- Não há backend necessário - tudo roda no navegador
- O build cria arquivos estáticos que podem ser servidos por qualquer servidor web
