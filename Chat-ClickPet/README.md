Chat ClickPet — Assistente Institucional para Investidores

Repositório oficial:

https://github.com/TheGustavoMacedo/Chat-ClickPet

O Chat ClickPet é um assistente institucional público, sem login, desenvolvido para responder perguntas de investidores sobre a ClickPet.

A aplicação recebe perguntas em linguagem natural, classifica a intenção da pergunta, recupera somente informações cadastradas no PostgreSQL e usa a API da OpenAI para transformar esse contexto em uma resposta clara e profissional.

A OpenAI não é a fonte de conhecimento do projeto. A fonte de verdade é o banco de dados institucional da ClickPet.

Quando uma informação não estiver cadastrada, o sistema deve responder:

Essa informação não está disponível na base institucional atual da ClickPet.

1. Estado do projeto

O projeto está na etapa final de preparação para produção e publicação para investidores.

Antes da liberação pública, o responsável pelo deploy deve confirmar:

banco de produção criado e preenchido;

variáveis de ambiente configuradas;

chave da OpenAI válida;

domínio com HTTPS;

CORS restrito ao domínio público;

backend executado como serviço;

PostgreSQL protegido contra acesso público;

rate limiting habilitado;

testes de perguntas e respostas concluídos;

logs e backups configurados;

nenhum segredo ou arquivo .env publicado no GitHub.

2. Objetivo

O assistente deve responder perguntas institucionais sobre:

visão geral da ClickPet;

tese de investimento;

rodada de captação;

valuation pré-money e pós-money;

participação ofertada;

oportunidade de mercado;

problemas enfrentados pelos pet shops;

solução oferecida;

produto e funcionalidades;

estágio do MVP;

tração;

equipe atual;

modelo de negócio;

fontes de receita;

estratégia de crescimento;

metas e projeções;

uso dos recursos captados;

concorrência;

diferenciais competitivos;

riscos;

visão de longo prazo;

perguntas frequentes de investidores.

O sistema não deve:

usar conhecimento externo para completar respostas;

inventar números, datas, métricas ou projeções;

gerar SQL livre;

expor prompts internos;

expor credenciais;

responder como se um dado não confirmado fosse fato;

armazenar dados pessoais desnecessários.

3. Arquitetura

O processamento de uma pergunta ocorre nesta ordem:

O investidor acessa o frontend público.

O frontend recebe a pergunta, usando HTML, CSS e JavaScript.

O frontend envia uma requisição POST para /api/chat.

O backend Node.js com Express valida a solicitação.

O classificador identifica a intenção da pergunta.

O backend executa consultas SQL controladas no PostgreSQL.

O contexto institucional recuperado é enviado para a OpenAI.

A resposta gerada é devolvida ao frontend e exibida ao investidor.

Resumo dos componentes

Componente

Responsabilidade

Frontend

Interface pública, envio das perguntas e exibição das respostas

Backend

Validação, segurança, classificação, recuperação de contexto e integração com OpenAI

PostgreSQL

Fonte oficial das informações institucionais da ClickPet

OpenAI

Transformação do contexto recuperado em resposta em linguagem natural

Nginx, em produção

Entrega do frontend, HTTPS e encaminhamento de /api/ para o backend

O frontend nunca deve acessar diretamente:

PostgreSQL;

OPENAI_API_KEY;

credenciais internas;

consultas SQL;

prompts do sistema.

Toda operação sensível acontece no backend.

4. Tecnologias

Frontend

HTML5;

CSS3;

JavaScript puro;

fonte Baloo 2;

interface responsiva;

consumo da API com fetch.

Backend

Node.js;

Express;

OpenAI SDK;

PostgreSQL;

pg;

dotenv;

cors;

helmet;

express-rate-limit.

Produção

O projeto pode ser hospedado em:

VPS Ubuntu/Debian;

Hostinger VPS;

serviço gerenciado compatível com Node.js;

backend e PostgreSQL gerenciados em provedores separados.

Este README detalha principalmente o deploy em VPS, pois essa opção permite publicar no mesmo servidor:

frontend estático;

API Node.js;

proxy reverso;

PostgreSQL;

HTTPS;

serviço persistente do backend.

5. Estrutura esperada do repositório

A raiz do projeto é a pasta Chat-ClickPet.

Pasta backend

Contém a API Node.js:

backend/src/server.js — inicia o servidor Express e expõe as rotas.

backend/src/db.js — cria e administra o pool PostgreSQL.

backend/src/ai.js — concentra as chamadas à OpenAI.

backend/src/intentClassifier.js — classifica a intenção da pergunta.

backend/src/contextRetriever.js — busca o contexto institucional no banco.

backend/src/responseGenerator.js — gera a resposta final.

backend/.env — credenciais e configurações locais. Nunca deve ser enviado ao Git.

backend/.env.example — modelo público das variáveis de ambiente.

backend/package.json — metadados, dependências e scripts.

backend/package-lock.json — versões exatas das dependências.

Pasta frontend

Contém a interface pública:

frontend/index.html — estrutura da página.

frontend/styles.css — identidade visual e responsividade.

frontend/app.js — envio das mensagens e renderização das respostas.

frontend/assets/images/clickpet-logo.png — logo utilizado no cabeçalho.

frontend/assets/icons/ — ícones da interface.

frontend/assets/fonts/ — fontes locais, caso sejam utilizadas.

Pasta database

Contém a criação e o preenchimento do PostgreSQL:

database/schemas.sql — cria schema, tipos, tabelas, índices, funções e triggers.

database/seed.sql — insere a empresa e o conteúdo institucional inicial.

database/bd_equipe_clickpet.sql — cria ou atualiza a estrutura da equipe e insere os cofundadores.

Arquivos na raiz

.gitignore — impede o envio de credenciais, dependências e arquivos temporários.

README.md — documentação de instalação, execução, deploy e manutenção.

Caso os arquivos SQL estejam em outra pasta, altere somente os caminhos usados nos comandos. A ordem de execução deve permanecer: schemas.sql, seed.sql e bd_equipe_clickpet.sql.

6. Arquivos principais

backend/src/server.js

Responsável por:

iniciar o Express;

configurar CORS;

habilitar Helmet;

validar o corpo da requisição;

aplicar rate limiting;

validar a pergunta;

classificar a intent;

buscar contexto;

gerar a resposta;

tratar timeout;

tratar erros;

encerrar corretamente o servidor e o pool PostgreSQL.

backend/src/db.js

Responsável por:

criar o pool PostgreSQL;

executar consultas parametrizadas;

aplicar timeout de conexão;

registrar erros;

encerrar conexões no shutdown.

backend/src/ai.js

Responsável por:

inicializar a OpenAI;

executar chamadas;

aplicar timeout e retries;

extrair o texto retornado;

impedir chamadas sem chave configurada.

backend/src/intentClassifier.js

Responsável por classificar perguntas em intents permitidas.

backend/src/contextRetriever.js

Responsável por:

mapear intent para tabelas;

montar termos de pesquisa;

executar somente consultas predefinidas;

montar o contexto institucional;

retornar contexto e fontes.

backend/src/responseGenerator.js

Responsável por transformar o contexto do banco em resposta natural.

frontend/app.js

Responsável por:

capturar o envio da mensagem;

trocar a tela inicial pelo modo conversa;

exibir a mensagem do usuário;

mostrar o loading;

chamar /api/chat;

exibir resposta;

exibir fontes;

tratar falhas;

redimensionar o textarea.

7. Pré-requisitos para desenvolvimento local

Instale:

Git;

Node.js 20 ou superior;

npm;

PostgreSQL 14 ou superior;

pgAdmin ou cliente equivalente;

Visual Studio Code;

extensão Live Server;

chave válida da OpenAI.

Verifique:

git --version
node --version
npm --version
psql --version

PARTE I — EXECUÇÃO LOCAL

8. Clonar o projeto

git clone https://github.com/TheGustavoMacedo/Chat-ClickPet.git
cd Chat-ClickPet

Caso o repositório esteja privado, a conta do desenvolvedor precisa receber acesso antes do clone.

9. Instalar o backend

cd backend
npm install

Para instalação reproduzível em uma máquina limpa, prefira manter o package-lock.json versionado.

Quando o lockfile estiver correto:

npm ci

As dependências essenciais são:

npm install express cors dotenv helmet express-rate-limit pg openai

10. Configurar o .env local

Dentro de backend, crie:

backend/.env

Nunca publique esse arquivo.

Exemplo local:

NODE_ENV=development

PORT=3000

DATABASE_URL=postgresql://USUARIO:SENHA@127.0.0.1:5432/ClickInvest

DB_POOL_MAX=10
DB_SCHEMA=clickpet_institutional
DB_CONNECTION_TIMEOUT_MS=10000
DB_IDLE_TIMEOUT_MS=30000
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=true
DB_LOG_QUERIES=false

OPENAI_API_KEY=COLOQUE_A_CHAVE_REAL_APENAS_NO_ENV_LOCAL

OPENAI_MODEL=gpt-4.1-mini
OPENAI_INTENT_MODEL=gpt-4.1-mini
OPENAI_RESPONSE_MODEL=gpt-4.1-mini

OPENAI_TEMPERATURE=0.2
OPENAI_MAX_OUTPUT_TOKENS=700
OPENAI_RESPONSE_MAX_OUTPUT_TOKENS=1200
OPENAI_REQUEST_TIMEOUT_MS=20000
OPENAI_MAX_RETRIES=1

ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=20

CHAT_TIMEOUT_MS=25000
INTENT_CONFIDENCE_THRESHOLD=0.7

COMPANY_SLUG=clickpet
CONTEXT_DEFAULT_LIMIT=8
MAX_CONTEXT_CHARS=12000

Pontos de atenção

Não duplique DATABASE_URL

Errado:

DATABASE_URL=DATABASE_URL=postgresql://...

Correto:

DATABASE_URL=postgresql://...

Prefira 127.0.0.1 no Windows

DATABASE_URL=postgresql://USUARIO:SENHA@127.0.0.1:5432/ClickInvest

Isso evita problemas de resolução entre IPv4 e IPv6.

Codifique caracteres especiais da senha

Uma senha usada dentro de URL deve ser percent-encoded.

Exemplos:

@  → %40
#  → %23
%  → %25
/  → %2F
:  → %3A

Não envie a chave da OpenAI ao frontend

A chave deve existir somente em:

backend/.env

11. Configurar o PostgreSQL local

11.1 Criar o banco

No pgAdmin ou no psql:

CREATE DATABASE "ClickInvest";

11.2 Confirmar o serviço

No Windows PowerShell:

Get-Service *postgres*

Teste a porta:

Test-NetConnection 127.0.0.1 -Port 5432

Resultado esperado:

TcpTestSucceeded : True

11.3 Executar os arquivos SQL

Execute exatamente nesta ordem:

1. schemas.sql
2. seed.sql
3. bd_equipe_clickpet.sql

A ordem é obrigatória porque:

schemas.sql cria schema, tipos, tabelas, índices, funções e triggers;

seed.sql cadastra a ClickPet e os dados institucionais iniciais;

bd_equipe_clickpet.sql cria/atualiza a estrutura de equipe e insere os cofundadores.

Pelo pgAdmin

Abra o servidor PostgreSQL.

Selecione o banco ClickInvest.

Abra Query Tool.

Carregue database/schemas.sql.

Execute.

Carregue database/seed.sql.

Execute.

Carregue database/bd_equipe_clickpet.sql.

Execute.

Pelo terminal

A partir da raiz do projeto:

psql -h 127.0.0.1 -p 5432 -U postgres -d ClickInvest -f database/schemas.sql
psql -h 127.0.0.1 -p 5432 -U postgres -d ClickInvest -f database/seed.sql
psql -h 127.0.0.1 -p 5432 -U postgres -d ClickInvest -f database/bd_equipe_clickpet.sql

11.4 Schema correto

O nome real é:

clickpet_institutional

A configuração correta é:

DB_SCHEMA=clickpet_institutional

Não use:

DB_SCHEMA=schemas

schemas.sql é o nome do arquivo, não o nome do schema PostgreSQL.

12. Validar o banco

Tabelas

SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'clickpet_institutional'
ORDER BY table_name;

Empresa

SELECT id, name, slug
FROM clickpet_institutional.companies
WHERE slug = 'clickpet';

O backend depende de:

slug = clickpet

Enum da equipe

SELECT unnest(
  enum_range(NULL::clickpet_institutional.content_category)
);

A lista deve conter:

team

Equipe atual

SELECT
  full_name,
  role_title,
  department,
  member_type,
  responsibilities,
  is_current,
  display_order
FROM clickpet_institutional.team_members
ORDER BY display_order;

Registros esperados:

Luis Soares — CEO;

Murilo Rodrigues — CTO;

Luis Macedo — Brand Strategist.

13. Executar o backend local

Na pasta backend:

npm start

Em desenvolvimento:

npm run dev

Saída esperada:

Servidor rodando na porta 3000
Ambiente: development

Teste:

http://localhost:3000/

Resposta esperada:

{
  "message": "ClickPet Investor Assistant API está rodando."
}

Caso exista o health check:

http://localhost:3000/api/health

14. Executar o frontend local

Abra:

frontend/index.html

No VS Code:

Botão direito → Open with Live Server

Endereços comuns:

http://localhost:5500
http://127.0.0.1:5500

Não abra por:

file:///C:/...

O Live Server deve servir o frontend pela porta permitida no CORS.

15. Endpoint principal

POST /api/chat
Content-Type: application/json

Body:

{
  "message": "Qual é o valuation da ClickPet?"
}

Resposta:

{
  "answer": "Resposta construída com base no contexto institucional.",
  "intent": "investment_round",
  "sources": ["investment_rounds"]
}

No ambiente local, o frontend envia para:

http://localhost:3000/api/chat

Em produção, o recomendado é frontend e backend no mesmo domínio, usando:

/api/chat

16. Intents suportadas

company_overview
investment_thesis
investment_round
market_opportunity
problem
solution
product
traction
team
business_model
growth_strategy
financial_projection
funding_use
competition
competitive_advantages
risks
vision
faq
unknown

Intent team

Deve cobrir:

equipe;

fundadores;

cofundadores;

CEO;

CTO;

Brand Strategist;

liderança;

cargos;

departamentos;

responsabilidades.

Ao adicionar uma intent nova, atualize:

intentClassifier.js;

JSON Schema de classificação;

prompt explicativo;

server.js;

contextRetriever.js;

enum/categoria PostgreSQL, quando aplicável;

frontend/app.js, quando houver uma fonte nova.

17. Perguntas para teste local

O que é a ClickPet?

Qual é a rodada de investimento?

Qual é o valuation pré-money?

Como a ClickPet ganha dinheiro?

Quem compõe a equipe atual?

Quem é o CTO?

Quais são os principais riscos?

Como os recursos captados serão utilizados?

Também teste algo não cadastrado:

Qual foi o faturamento exato no último mês?

Caso o dado não exista, o sistema não deve inventar uma resposta.

PARTE II — PREPARAÇÃO PARA PRODUÇÃO

18. Arquitetura recomendada de produção

Para simplificar CORS, HTTPS e manutenção, utilize o mesmo domínio para o frontend e para a API.

Endereço ou serviço

Função

https://invest.clickpet.com.br/

Entrega do frontend estático

https://invest.clickpet.com.br/api/chat

Endpoint público encaminhado pelo Nginx

http://127.0.0.1:3000

Processo Node.js acessível somente internamente

PostgreSQL

Banco local no VPS ou serviço privado externo

O processo Node.js não deve ficar diretamente exposto à internet.

O Nginx deve:

receber as conexões públicas;

servir os arquivos do frontend;

aplicar HTTPS;

encaminhar somente as rotas iniciadas por /api/ para o backend;

manter a porta 3000 inacessível externamente.

19. Variáveis de produção

Exemplo:

NODE_ENV=production

PORT=3000

DATABASE_URL=postgresql://clickpet_app:SENHA_FORTE_CODIFICADA@127.0.0.1:5432/ClickInvest

DB_POOL_MAX=10
DB_SCHEMA=clickpet_institutional
DB_CONNECTION_TIMEOUT_MS=10000
DB_IDLE_TIMEOUT_MS=30000
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=true
DB_LOG_QUERIES=false

OPENAI_API_KEY=CHAVE_REAL_DE_PRODUCAO

OPENAI_MODEL=gpt-4.1-mini
OPENAI_INTENT_MODEL=gpt-4.1-mini
OPENAI_RESPONSE_MODEL=gpt-4.1-mini

OPENAI_TEMPERATURE=0.2
OPENAI_MAX_OUTPUT_TOKENS=700
OPENAI_RESPONSE_MAX_OUTPUT_TOKENS=1200
OPENAI_REQUEST_TIMEOUT_MS=20000
OPENAI_MAX_RETRIES=1

ALLOWED_ORIGINS=https://invest.clickpet.com.br

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=20

CHAT_TIMEOUT_MS=25000
INTENT_CONFIDENCE_THRESHOLD=0.7

COMPANY_SLUG=clickpet
CONTEXT_DEFAULT_LIMIT=8
MAX_CONTEXT_CHARS=12000

DB_SSL

Banco no mesmo VPS:

DB_SSL=false

Banco PostgreSQL gerenciado e externo:

DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

Use os parâmetros exigidos pelo provedor do banco. Não desabilite a validação do certificado sem entender a implicação.

20. Ajuste necessário atrás de proxy reverso

Quando Express estiver atrás do Nginx e express-rate-limit for usado, configure o proxy confiável.

Em server.js, depois de criar o app:

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

Sem isso, o rate limit pode interpretar incorretamente o IP do cliente.

PARTE III — DEPLOY EM VPS / HOSTINGER VPS

21. Escolha da hospedagem

Para a arquitetura atual, uma VPS oferece controle direto sobre:

Node.js;

Nginx;

PM2;

PostgreSQL;

firewall;

SSL;

domínio;

backups;

logs.

Caso seja utilizado um serviço gerenciado de aplicações Node.js, verifique antes:

suporte a monorepo;

diretório raiz do backend;

suporte a frontend estático;

variáveis de ambiente;

PostgreSQL;

domínio customizado;

HTTPS;

processo de migrations;

persistência do serviço;

logs.

22. Preparar a VPS

Exemplo para Ubuntu/Debian:

sudo apt update
sudo apt upgrade -y
sudo apt install -y git nginx postgresql postgresql-contrib

Instale uma versão LTS do Node.js conforme a política do servidor.

Verifique:

node --version
npm --version
nginx -v
psql --version

23. Clonar na VPS

Exemplo de diretório:

sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/TheGustavoMacedo/Chat-ClickPet.git
sudo chown -R $USER:$USER /var/www/Chat-ClickPet
cd /var/www/Chat-ClickPet

Se o repositório for privado, use uma deploy key ou outro mecanismo seguro. Não grave token pessoal em scripts públicos.

24. Instalar dependências na VPS

cd /var/www/Chat-ClickPet/backend
npm ci --omit=dev

Se não existir package-lock.json confiável:

npm install --omit=dev

O lockfile deve ser corrigido e versionado antes da entrega final.

25. Criar usuário PostgreSQL de produção

Não use o superusuário postgres na aplicação pública.

Entre no PostgreSQL:

sudo -u postgres psql

Crie banco e usuário:

CREATE ROLE clickpet_app
WITH LOGIN
PASSWORD 'SUBSTITUA_POR_UMA_SENHA_FORTE';

CREATE DATABASE "ClickInvest"
OWNER clickpet_app;

Saia:

\q

Atenção

A senha usada no SQL acima não deve aparecer:

no Git;

no README final preenchida;

em issue;

em print;

em log;

em mensagem pública.

26. Importar os três arquivos SQL na VPS

Execute na ordem:

psql -h 127.0.0.1 -U clickpet_app -d ClickInvest -f /var/www/Chat-ClickPet/database/schemas.sql

psql -h 127.0.0.1 -U clickpet_app -d ClickInvest -f /var/www/Chat-ClickPet/database/seed.sql

psql -h 127.0.0.1 -U clickpet_app -d ClickInvest -f /var/www/Chat-ClickPet/database/bd_equipe_clickpet.sql

Caso os scripts exijam permissões administrativas para extensões, tipos ou ownership, execute a etapa inicial como postgres e depois aplique permissões ao usuário da aplicação.

Exemplo de permissões de leitura:

GRANT CONNECT ON DATABASE "ClickInvest" TO clickpet_app;
GRANT USAGE ON SCHEMA clickpet_institutional TO clickpet_app;
GRANT SELECT ON ALL TABLES IN SCHEMA clickpet_institutional TO clickpet_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA clickpet_institutional
GRANT SELECT ON TABLES TO clickpet_app;

Como o backend atual é de consulta, conceda somente o necessário.

27. Criar o .env de produção

cd /var/www/Chat-ClickPet/backend
nano .env

Cole as variáveis de produção.

Proteja o arquivo:

chmod 600 .env

Confirme que ele não está rastreado:

git status

O .env não deve aparecer como arquivo novo ou modificado rastreável.

28. Testar o backend manualmente

cd /var/www/Chat-ClickPet/backend
npm start

Em outro terminal:

curl http://127.0.0.1:3000/

Teste a API:

curl -X POST http://127.0.0.1:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Quem compõe a equipe atual da ClickPet?"}'

Somente prossiga quando:

o banco conectar;

a intent funcionar;

o contexto for encontrado;

a OpenAI responder;

o JSON retornar sem erro.

Interrompa o processo manual:

Ctrl + C

29. Manter o backend ativo com PM2

Instale:

sudo npm install -g pm2

Inicie:

cd /var/www/Chat-ClickPet
pm2 start backend/src/server.js \
  --name chat-clickpet-api \
  --cwd /var/www/Chat-ClickPet/backend

Salve:

pm2 save

Configure inicialização automática:

pm2 startup

O PM2 exibirá um comando adicional. Execute exatamente o comando apresentado e depois:

pm2 save

Comandos úteis:

pm2 status
pm2 logs chat-clickpet-api
pm2 restart chat-clickpet-api
pm2 stop chat-clickpet-api

30. Configurar Nginx

Crie:

sudo nano /etc/nginx/sites-available/chat-clickpet

Exemplo:

server {
    listen 80;
    listen [::]:80;

    server_name invest.clickpet.com.br;

    root /var/www/Chat-ClickPet/frontend;
    index index.html;

    client_max_body_size 20k;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 10s;
        proxy_send_timeout 35s;
        proxy_read_timeout 35s;
    }
}

Ative:

sudo ln -s /etc/nginx/sites-available/chat-clickpet \
  /etc/nginx/sites-enabled/chat-clickpet

Teste:

sudo nginx -t

Recarregue:

sudo systemctl reload nginx

31. Configurar o frontend para produção

O app.js deve usar URL relativa em produção.

Exemplo:

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api/chat"
    : "/api/chat";

Não deixe uma URL local fixa:

const API_URL = "http://localhost:3000/api/chat";

Isso quebraria no domínio público.

32. Configurar DNS

No provedor do domínio, crie um registro apontando o subdomínio para o IP público da VPS.

Exemplo:

Tipo: A
Nome: invest
Valor: IP_PUBLICO_DA_VPS

Resultado pretendido:

invest.clickpet.com.br

A propagação DNS pode levar algum tempo.

33. Configurar HTTPS

Depois que o domínio apontar corretamente:

sudo apt install -y certbot python3-certbot-nginx

Execute:

sudo certbot --nginx -d invest.clickpet.com.br

Teste a renovação:

sudo certbot renew --dry-run

Depois do HTTPS, confirme:

ALLOWED_ORIGINS=https://invest.clickpet.com.br

Reinicie:

pm2 restart chat-clickpet-api

34. Configurar firewall

Exemplo com UFW:

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status

Não abra publicamente:

3000
5432

O backend deve ser alcançado pelo Nginx, e o PostgreSQL deve ficar privado.

PARTE IV — TESTES DE PRODUÇÃO

35. Teste de disponibilidade

curl -I https://invest.clickpet.com.br

Health check:

curl https://invest.clickpet.com.br/api/health

Teste do chat:

curl -X POST https://invest.clickpet.com.br/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Qual é o valuation da ClickPet?"}'

36. Checklist funcional

Interface

logo correto;

fundo e gradiente corretos;

layout responsivo;

textarea cresce conforme a mensagem;

Enter envia;

Shift + Enter cria nova linha;

animação da mensagem funciona;

loading funciona;

fontes são exibidas;

mensagens longas não quebram o layout;

mobile testado.

Backend

GET / responde;

/api/health responde, se implementado;

POST /api/chat responde;

rate limit funciona;

CORS bloqueia origem indevida;

timeout funciona;

JSON inválido retorna 400;

erro interno não expõe stack ao investidor;

shutdown fecha o pool.

Banco

schema criado;

seed executado;

equipe executada;

team existe no enum;

slug = clickpet;

rodadas cadastradas;

riscos cadastrados;

equipe cadastrada;

FAQs cadastradas;

usuário da aplicação não é superusuário.

OpenAI

chave exclusiva de produção;

chave não está no Git;

modelo disponível;

timeout configurado;

retries limitados;

consumo monitorado;

limite de gastos configurado na conta quando disponível.

37. Testes de conteúdo

Teste no mínimo:

O que é a ClickPet?

Qual é a tese de investimento?

Qual é o valuation?

Quanto a ClickPet pretende captar?

Como os recursos serão utilizados?

Como a empresa ganha dinheiro?

Quais são os riscos?

Quem é o CEO?

Quem lidera a tecnologia?

Quem cuida da estratégia da marca?

Quem compõe a equipe atual?

Qual é o faturamento exato no último mês?

A última pergunta deve retornar indisponibilidade caso o banco não contenha esse dado.

PARTE V — SEGURANÇA

38. Arquivos que nunca devem ser publicados

backend/.env
*.pem
*.key
backups com dados reais
logs com credenciais
exports do banco
arquivos de configuração com senha

.gitignore recomendado:

node_modules/

.env
.env.*
!.env.example

*.log
npm-debug.log*

coverage/
dist/

.DS_Store
Thumbs.db

backups/
*.dump
*.backup

Caso algum segredo já tenha sido enviado ao Git:

revogue a chave;

altere a senha;

remova o arquivo do rastreamento;

avalie limpar o histórico;

nunca considere suficiente apenas apagar no commit mais recente.

39. Política de dados

Não cadastre no banco público:

CPF;

RG;

endereço;

telefone pessoal;

salário;

conta bancária;

dados familiares;

informações de saúde;

credenciais;

chaves;

documentos internos sem autorização.

A tabela de equipe deve conter somente dados profissionais e institucionais aprovados.

40. Rate limiting e custos

Configuração inicial:

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=20

Isso representa até 20 solicitações por IP dentro de 60 segundos.

Antes da abertura pública:

teste o limite;

monitore custo da OpenAI;

ajuste conforme o tráfego;

avalie cache para FAQs;

acompanhe erros e abuso;

evite retries excessivos.

CORS não impede chamadas diretas fora do navegador. Ele não substitui rate limiting, firewall e monitoramento.

41. Segurança do banco

não exponha a porta 5432;

use usuário específico;

não use postgres na aplicação;

conceda apenas permissões necessárias;

use senha forte;

use SSL se o banco for externo;

restrinja IPs;

ative backups;

teste restauração;

registre migrations.

PARTE VI — OPERAÇÃO E MANUTENÇÃO

42. Atualizar a aplicação

Na VPS:

cd /var/www/Chat-ClickPet
git pull origin main
cd backend
npm ci --omit=dev
pm2 restart chat-clickpet-api

Antes de atualizar:

faça backup;

leia migrations;

teste em homologação;

confirme variáveis novas;

confirme compatibilidade do banco.

43. Aplicar nova migration

Exemplo:

psql -h 127.0.0.1 \
  -U clickpet_app \
  -d ClickInvest \
  -f database/NOVA_MIGRATION.sql

Boas práticas:

numere ou nomeie claramente;

use transação;

use IF NOT EXISTS quando apropriado;

use ON CONFLICT para seeds idempotentes;

não reescreva migration aplicada em produção;

valide antes e depois;

mantenha backup.

44. Backup PostgreSQL

Backup manual:

mkdir -p /var/backups/chat-clickpet

pg_dump \
  -h 127.0.0.1 \
  -U clickpet_app \
  -d ClickInvest \
  -F c \
  -f /var/backups/chat-clickpet/ClickInvest_$(date +%Y-%m-%d_%H-%M).dump

Restauração deve ser testada em banco separado antes de ser necessária em emergência.

Não mantenha backups somente no mesmo servidor. Copie para armazenamento externo seguro.

45. Logs

PM2:

pm2 logs chat-clickpet-api

Nginx:

sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

PostgreSQL:

sudo journalctl -u postgresql

Os logs não devem mostrar:

OPENAI_API_KEY;

senha do banco;

DATABASE_URL completa;

conteúdo confidencial;

stack trace ao usuário final.

46. Monitoramento mínimo

Monitore:

disponibilidade do domínio;

tempo de resposta;

taxa de erro 4xx e 5xx;

consumo da OpenAI;

memória e CPU;

espaço em disco;

conexões PostgreSQL;

crescimento dos logs;

falhas de backup;

certificado HTTPS;

status do PM2;

status do Nginx;

status do PostgreSQL.

47. Rollback

Código:

cd /var/www/Chat-ClickPet
git log --oneline
git checkout COMMIT_ANTERIOR
cd backend
npm ci --omit=dev
pm2 restart chat-clickpet-api

Banco:

não tente desfazer mudanças destrutivas sem plano;

restaure backup quando necessário;

migrations de rollback devem ser planejadas;

não apague tabelas em produção sem validação.

PARTE VII — TROUBLESHOOTING

48. getaddrinfo ENOTFOUND

Indica host inválido.

Confira:

DATABASE_URL=postgresql://USUARIO:SENHA@127.0.0.1:5432/ClickInvest

Evite:

DATABASE_URL=DATABASE_URL=...

49. ECONNREFUSED

Indica que o PostgreSQL não aceitou conexão.

Verifique:

sudo systemctl status postgresql

No Windows:

Get-Service *postgres*
Test-NetConnection 127.0.0.1 -Port 5432

50. Relação não existe

Exemplo:

relação "schemas.investment_rounds" não existe

Use:

DB_SCHEMA=clickpet_institutional

51. Enum team inválido

Erro:

valor de entrada é inválido para enum ... content_category: "team"

Execute bd_equipe_clickpet.sql atualizado ou:

ALTER TYPE clickpet_institutional.content_category
ADD VALUE IF NOT EXISTS 'team';

52. CORS

Erro:

Origem não permitida pelo CORS

No navegador:

window.location.origin

Em produção:

ALLOWED_ORIGINS=https://invest.clickpet.com.br

Depois reinicie o backend.

53. Failed to fetch

Verifique:

backend ativo;

domínio correto;

HTTPS;

certificado;

CORS;

/api/chat;

Nginx;

PM2;

timeout;

console do navegador;

Network → Fetch/XHR.

54. Contexto vazio apesar de existir dado

O recuperador pode retornar:

{
  contextText: "...",
  sources: [...]
}

O servidor precisa ler contextText.

Exemplo:

function extractContext(contextResult) {
  if (typeof contextResult?.contextText === "string") {
    return contextResult.contextText.trim();
  }

  if (typeof contextResult?.context === "string") {
    return contextResult.context.trim();
  }

  return "";
}

55. Erro sem mensagem PostgreSQL

AggregateError pode ter error.message vazio.

Registre:

name;

code;

errors;

address;

port;

syscall;

stack.

Não retorne isso ao investidor.

PARTE VIII — CRITÉRIOS DE PUBLICAÇÃO

56. Checklist final obrigatório

Repositório

URL correta;

branch principal definida;

README.md atualizado;

.env.example atualizado;

.env fora do Git;

nenhum segredo no histórico;

package-lock.json versionado;

nomes dos SQL confirmados;

licença definida;

repositório público ou acesso concedido ao responsável.

Aplicação

frontend publicado;

backend publicado;

domínio configurado;

HTTPS ativo;

PM2 ativo;

Nginx ativo;

PostgreSQL ativo;

firewall ativo;

portas 3000 e 5432 não expostas;

CORS com domínio final;

NODE_ENV=production;

trust proxy configurado;

OpenAI funcionando;

banco preenchido;

backups configurados;

logs revisados;

perguntas testadas;

conteúdo aprovado pela ClickPet.

Experiência do investidor

interface carrega rapidamente;

logo aparece corretamente;

chat é utilizável no celular;

respostas são legíveis;

fontes aparecem;

erros são amigáveis;

nenhuma informação inventada;

nenhum dado sensível aparece;

aviso institucional exibido.

57. Scripts npm

Exemplo:

{
  "name": "clickpet-investor-backend",
  "version": "1.0.0",
  "private": true,
  "description": "Backend do assistente institucional da ClickPet para investidores",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js"
  }
}

Comandos:

npm start
npm run dev

58. Limitações atuais

aplicação pública sem login;

sem painel administrativo;

conteúdo atualizado por SQL;

sem persistência de histórico de conversa;

sem streaming;

dependência da OpenAI;

dependência do PostgreSQL;

rate limit por IP;

sem cache avançado;

sem suíte completa de testes automatizados;

sem ambiente de homologação definido no repositório.

59. Melhorias futuras

ambiente de homologação;

Docker;

Docker Compose;

CI/CD;

testes automatizados;

painel administrativo;

cache de FAQ;

streaming de respostas;

auditoria;

métricas;

alertas;

observabilidade;

embeddings;

busca híbrida;

versionamento de conteúdo;

controle de custos;

política de retenção;

analytics preservando privacidade.

60. Aviso institucional

As respostas são geradas com base na base institucional da ClickPet.

Informações financeiras, estratégicas ou sensíveis devem ser verificadas antes de qualquer decisão de investimento.

61. Licença
Todos os direitos reservados à ClickPet.
