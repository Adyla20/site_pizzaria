# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Site estático da **ALDS Pizzaria Delivery** com área administrativa. HTML, CSS e JavaScript puro, sem frameworks ou build tools. Todos os dados persistem via `localStorage`.

## Estrutura

```
alds_pizzaria/
├── index.html              # Site público (cardápio, avaliações, pedido)
├── admin.html              # Login da área administrativa
├── admin-dashboard.html    # Painel admin (pizzas, pedidos, avaliações)
├── css/
│   ├── style.css           # Estilos do site público
│   └── admin.css           # Estilos do painel admin
├── js/
│   ├── script.js           # Lógica do site público + localStorage
│   └── admin.js            # Lógica do painel admin
└── imagem_logo.jpeg        # Logo oficial da pizzaria
```

## Abrir no navegador

Abrir `index.html` diretamente no navegador (duplo clique ou arrastar). Não requer servidor.

## Paleta de cores

| Variável CSS  | Cor          | Uso                    |
|---------------|--------------|------------------------|
| `--blue`      | `#1A8FE3`    | Cor primária           |
| `--gold`      | `#C9A227`    | Destaques e bordas     |
| `--dark`      | `#111111`    | Fundo escuro / texto   |

## Fontes

Google Fonts no `<head>`: **Oswald** (títulos/labels) e **Roboto** (corpo).

## localStorage — chaves usadas

| Chave        | Tipo   | Escrito por          | Lido por                        |
|--------------|--------|----------------------|---------------------------------|
| `pizzas`     | Array  | admin.js + padrão JS | script.js, admin.js             |
| `pedidos`    | Array  | script.js            | admin.js                        |
| `avaliacoes` | Array  | script.js            | script.js (público), admin.js   |

Se `pizzas` não existir, `script.js` inicializa com 9 pizzas padrão (`PIZZAS_PADRAO`).

## Autenticação admin

- Credenciais fixas em `js/admin.js` (`ADMIN_EMAIL`, `ADMIN_SENHA`)
- Sessão via `sessionStorage.adminLogado = 'true'`
- `admin-dashboard.html` chama `checkAuth()` no load e redireciona para `admin.html` se não autenticado

## Seções do site (âncoras)

- `#home` — Hero/banner
- `#cardapio` — Grade dinâmica de pizzas (renderizada via JS a partir do localStorage)
- `#avaliacoes` — Cards públicos + formulário de avaliação com estrelas
- `#sobre` — Sobre nós
- `#pedido` — Carrinho + formulário

## Sincronização admin ↔ site

Quando admin.html e index.html estão abertos em abas diferentes, o evento `storage` do browser dispara automaticamente no index.html sempre que o admin altera `pizzas` ou `avaliacoes`, re-renderizando o cardápio em tempo real.

## Estrutura dos objetos de dados

**Pizza** (chave `pizzas`):
```json
{ "id": "abc123", "nome": "Margherita", "categoria": "classica", "preco": 38.00, "descricao": "...", "imagem": "https://..." }
```
Categorias válidas: `classica`, `especial`, `doce`.

**Pedido** (chave `pedidos`):
```json
{ "nome": "João", "telefone": "...", "endereco": "...", "obs": "...", "itens": "1x Margherita, 2x Calabresa", "itensList": [{ "nome": "Margherita", "preco": 38.00, "qtd": 1 }], "total": 38.00, "data": "2024-01-01T00:00:00.000Z" }
```

**Avaliação** (chave `avaliacoes`):
```json
{ "nome": "Maria", "nota": 5, "comentario": "...", "data": "2024-01-01T00:00:00.000Z" }
```

## Detalhes de implementação

- **Carrinho** (`script.js`): array `carrinho` em memória — não persiste no localStorage; zera ao fechar/recarregar a página.
- **`admin.js` é carregado em duas páginas**: detecta qual página está ativa no `DOMContentLoaded` checando se `#loginForm` ou `#tab-pizzas` existe no DOM.
- **`escHtml()`** está duplicada em `script.js` e `admin.js` (sem módulos compartilhados).
- **IDs de pizza** são gerados com `Date.now().toString(36) + Math.random()` (função `gerarId()` em `admin.js`).
