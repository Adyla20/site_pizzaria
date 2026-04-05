/* =============================================
   ALDS Pizzaria — Admin JavaScript
   Gerencia login, pizzas, pedidos e avaliações
   ============================================= */

// ── Credenciais fixas ──
const ADMIN_EMAIL = 'adylaiasmiim811@gmail.com';
const ADMIN_SENHA = '12345678';

// ── Utilitários ──
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function formatarData(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function estrelas(nota) {
  return '★'.repeat(Number(nota)) + '☆'.repeat(5 - Number(nota));
}

// ==============================================
// LOGIN PAGE
// ==============================================
function loginAdmin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  const erro  = document.getElementById('loginError');
  const btn   = document.getElementById('btnLogin');

  if (email === ADMIN_EMAIL && senha === ADMIN_SENHA) {
    sessionStorage.setItem('adminLogado', 'true');
    btn.textContent = '✔ Entrando...';
    btn.disabled = true;
    // Resolve caminho relativo para funcionar com file:// e servidores
    const base = location.href.replace(/admin\.html.*$/, '');
    location.href = base + 'admin-dashboard.html';
  } else {
    erro.style.display = 'block';
    document.getElementById('loginSenha').value = '';
    document.getElementById('loginSenha').focus();
    // Shake animation
    erro.style.animation = 'none';
    requestAnimationFrame(() => { erro.style.animation = 'shake .4s ease'; });
  }
}

function toggleSenha() {
  const input = document.getElementById('loginSenha');
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ==============================================
// DASHBOARD
// ==============================================

// ── Verificar autenticação ──
function checkAuth() {
  if (sessionStorage.getItem('adminLogado') !== 'true') {
    const base = location.href.replace(/admin-dashboard\.html.*$/, '');
    location.href = base + 'admin.html';
  }
}

function logout() {
  sessionStorage.removeItem('adminLogado');
  const base = location.href.replace(/admin-dashboard\.html.*$/, '');
  location.href = base + 'admin.html';
}

// ── Navegação por tabs ──
function trocarTab(tabId, btnEl) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));

  document.getElementById('tab-' + tabId).classList.add('active');
  if (btnEl) btnEl.classList.add('active');

  const titulos = { pizzas: 'Pizzas', pedidos: 'Pedidos', avaliacoes: 'Avaliações' };
  document.getElementById('topbarTitle').textContent = titulos[tabId] || '';

  // Fecha sidebar no mobile após navegar
  fecharSidebar();
}

// ── Sidebar mobile ──
function toggleSidebar() {
  document.getElementById('adminSidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

function fecharSidebar() {
  document.getElementById('adminSidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ==============================================
// PIZZAS — CRUD
// ==============================================

function getPizzas() {
  return JSON.parse(localStorage.getItem('pizzas') || '[]');
}

function setPizzas(arr) {
  localStorage.setItem('pizzas', JSON.stringify(arr));
}

function atualizarBadgePizzas() {
  const el = document.getElementById('badgePizzas');
  if (el) el.textContent = getPizzas().length;
}

function renderizarTabelaPizzas() {
  const pizzas = getPizzas();
  atualizarBadgePizzas();
  const container = document.getElementById('pizzasContainer');
  if (!container) return;

  if (pizzas.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🍕</span>
        <p>Nenhuma pizza cadastrada ainda.</p>
        <br>
        <button class="btn-admin-primary" onclick="abrirFormPizza()" style="margin-top:8px">+ Adicionar primeira pizza</button>
      </div>`;
    return;
  }

  const rows = pizzas.map(p => {
    const imgHtml = p.imagem
      ? `<img src="${escHtml(p.imagem)}" class="pizza-thumb" alt="${escHtml(p.nome)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="pizza-thumb-emoji" style="display:none">${categoriaEmoji(p.categoria)}</div>`
      : `<div class="pizza-thumb-emoji">${categoriaEmoji(p.categoria)}</div>`;

    return `
      <tr>
        <td>${imgHtml}</td>
        <td><strong>${escHtml(p.nome)}</strong></td>
        <td><span class="cat-badge cat-${p.categoria}">${categoriaNome(p.categoria)}</span></td>
        <td><strong>${formatarPreco(p.preco)}</strong></td>
        <td style="max-width:220px;font-size:.82rem;color:#666">${escHtml(p.descricao)}</td>
        <td style="white-space:nowrap">
          <button class="btn-icon btn-icon-edit" onclick="editarPizza('${p.id}')" title="Editar">✏️ Editar</button>
          <button class="btn-icon btn-icon-del"  onclick="removerPizza('${p.id}')" title="Remover">🗑️ Remover</button>
        </td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <div class="admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Imagem</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Descrição</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function categoriaEmoji(cat) {
  return { classica: '🍕', especial: '🔥', doce: '🍫' }[cat] || '🍕';
}

function categoriaNome(cat) {
  return { classica: 'Clássica', especial: 'Especial', doce: 'Doce' }[cat] || cat;
}

// ── Formulário de pizza ──
function abrirFormPizza(id) {
  const modal = document.getElementById('modalPizza');
  const form  = document.getElementById('formPizza');
  form.reset();
  document.getElementById('pizzaId').value = '';
  document.getElementById('imgPreviewWrap').style.display = 'none';
  document.getElementById('formPizzaTitulo').textContent = 'Nova Pizza';

  if (id) {
    const pizza = getPizzas().find(p => p.id === id);
    if (!pizza) return;
    document.getElementById('formPizzaTitulo').textContent = 'Editar Pizza';
    document.getElementById('pizzaId').value          = pizza.id;
    document.getElementById('pizzaNome').value        = pizza.nome;
    document.getElementById('pizzaCategoria').value   = pizza.categoria;
    document.getElementById('pizzaPreco').value       = pizza.preco;
    document.getElementById('pizzaDescricao').value   = pizza.descricao;
    document.getElementById('pizzaImagem').value      = pizza.imagem || '';
    previewImagem();
  }

  modal.classList.add('open');
  document.getElementById('pizzaNome').focus();
}

function fecharFormPizza() {
  document.getElementById('modalPizza').classList.remove('open');
}

function previewImagem() {
  const url  = document.getElementById('pizzaImagem').value.trim();
  const wrap = document.getElementById('imgPreviewWrap');
  const img  = document.getElementById('imgPreview');
  if (url) {
    img.src = url;
    wrap.style.display = 'block';
  } else {
    wrap.style.display = 'none';
  }
}

function salvarPizza(e) {
  e.preventDefault();

  const id          = document.getElementById('pizzaId').value;
  const nome        = document.getElementById('pizzaNome').value.trim();
  const categoria   = document.getElementById('pizzaCategoria').value;
  const preco       = parseFloat(document.getElementById('pizzaPreco').value);
  const descricao   = document.getElementById('pizzaDescricao').value.trim();
  const imagem      = document.getElementById('pizzaImagem').value.trim();

  const pizzas = getPizzas();

  if (id) {
    // Editar
    const idx = pizzas.findIndex(p => p.id === id);
    if (idx !== -1) {
      pizzas[idx] = { id, nome, categoria, preco, descricao, imagem };
    }
  } else {
    // Novo
    pizzas.push({ id: gerarId(), nome, categoria, preco, descricao, imagem });
  }

  setPizzas(pizzas);
  fecharFormPizza();
  renderizarTabelaPizzas();
  mostrarNotificacao(id ? '✔ Pizza atualizada!' : '✔ Pizza adicionada!');
}

function editarPizza(id) {
  abrirFormPizza(id);
}

function removerPizza(id) {
  const pizza = getPizzas().find(p => p.id === id);
  if (!pizza) return;
  if (!confirm(`Remover a pizza "${pizza.nome}"?\n\nEsta ação não pode ser desfeita.`)) return;

  const novas = getPizzas().filter(p => p.id !== id);
  setPizzas(novas);
  renderizarTabelaPizzas();
  mostrarNotificacao('🗑️ Pizza removida.');
}

// ==============================================
// PEDIDOS
// ==============================================

function getPedidos() {
  return JSON.parse(localStorage.getItem('pedidos') || '[]');
}

function atualizarBadgePedidos() {
  const el = document.getElementById('badgePedidos');
  if (el) el.textContent = getPedidos().length;
}

function renderizarPedidos() {
  const pedidos  = getPedidos();
  atualizarBadgePedidos();
  const container = document.getElementById('pedidosContainer');
  if (!container) return;

  if (pedidos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📦</span>
        <p>Nenhum pedido recebido ainda.</p>
      </div>`;
    return;
  }

  // Mais recentes primeiro
  const ordenados = [...pedidos].reverse();
  container.innerHTML = ordenados.map((p, i) => `
    <div class="pedido-card">
      <div class="pedido-card-header">
        <span class="pedido-num">Pedido #${pedidos.length - i} — ${escHtml(p.nome)}</span>
        <span class="pedido-data">${formatarData(p.data)}</span>
      </div>
      <div class="pedido-itens">📋 ${escHtml(p.itens)}</div>
      <div class="pedido-footer">
        <span class="pedido-total">${formatarPreco(p.total)}</span>
        <span class="pedido-endereco">
          📞 ${escHtml(p.telefone)}
          ${p.endereco ? ' &nbsp;|&nbsp; 📍 ' + escHtml(p.endereco) : ''}
          ${p.obs ? ' &nbsp;|&nbsp; 💬 ' + escHtml(p.obs) : ''}
        </span>
      </div>
    </div>`).join('');
}

function limparPedidos() {
  if (!confirm('Limpar todos os pedidos? Esta ação não pode ser desfeita.')) return;
  localStorage.removeItem('pedidos');
  renderizarPedidos();
  mostrarNotificacao('🗑️ Pedidos limpos.');
}

// ==============================================
// AVALIAÇÕES
// ==============================================

function getAvaliacoes() {
  return JSON.parse(localStorage.getItem('avaliacoes') || '[]');
}

function atualizarBadgeAvaliacoes() {
  const el = document.getElementById('badgeAvaliacoes');
  if (el) el.textContent = getAvaliacoes().length;
}

function renderizarAvaliacoes() {
  const avs = getAvaliacoes();
  atualizarBadgeAvaliacoes();
  const container = document.getElementById('avaliacoesContainer');
  if (!container) return;

  if (avs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⭐</span>
        <p>Nenhuma avaliação recebida ainda.</p>
      </div>`;
    return;
  }

  const mediaTotal = avs.reduce((s, a) => s + Number(a.nota), 0) / avs.length;

  container.innerHTML = `
    <div style="background:#fff;border-radius:10px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:16px;box-shadow:0 1px 4px rgba(0,0,0,.07)">
      <span style="font-size:2rem">⭐</span>
      <div>
        <strong style="font-family:Oswald,sans-serif;font-size:1.4rem">${mediaTotal.toFixed(1)}</strong>
        <span style="color:#6b7280;font-size:.85rem"> / 5.0 &nbsp;·&nbsp; ${avs.length} avaliação${avs.length !== 1 ? 'ões' : ''}</span>
      </div>
    </div>
    ${[...avs].reverse().map(a => `
      <div class="avaliacao-card">
        <div class="avaliacao-nota" title="${a.nota} estrelas">${estrelas(a.nota)}</div>
        <div class="avaliacao-body">
          <div class="avaliacao-header">
            <span class="avaliacao-nome">${escHtml(a.nome)}</span>
            <span class="avaliacao-data">${formatarData(a.data)}</span>
          </div>
          ${a.comentario ? `<p class="avaliacao-comentario">"${escHtml(a.comentario)}"</p>` : '<p class="avaliacao-comentario" style="font-style:italic;opacity:.5">Sem comentário</p>'}
        </div>
      </div>`).join('')}`;
}

function limparAvaliacoes() {
  if (!confirm('Limpar todas as avaliações? Esta ação não pode ser desfeita.')) return;
  localStorage.removeItem('avaliacoes');
  renderizarAvaliacoes();
  mostrarNotificacao('🗑️ Avaliações limpas.');
}

// ==============================================
// NOTIFICAÇÃO INTERNA (admin)
// ==============================================
function mostrarNotificacao(msg) {
  const existing = document.getElementById('adminToast');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'adminToast';
  el.textContent = msg;
  Object.assign(el.style, {
    position: 'fixed', bottom: '24px', right: '24px',
    background: '#111', color: '#fff', padding: '12px 24px',
    borderRadius: '8px', fontFamily: 'Roboto,sans-serif', fontSize: '.9rem',
    border: '1px solid #C9A227', zIndex: '9999',
    opacity: '0', transform: 'translateY(10px)',
    transition: 'opacity .3s, transform .3s',
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

// ==============================================
// SEGURANÇA — XSS prevention
// ==============================================
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==============================================
// INICIALIZAÇÃO — detecta qual página está ativa
// ==============================================
document.addEventListener('DOMContentLoaded', () => {

  // LOGIN PAGE
  if (document.getElementById('loginForm')) {
    // Se já está logado, redireciona direto
    if (sessionStorage.getItem('adminLogado') === 'true') {
      const base = location.href.replace(/admin\.html.*$/, '');
      location.href = base + 'admin-dashboard.html';
    }
    return;
  }

  // DASHBOARD PAGE
  if (document.getElementById('tab-pizzas')) {
    checkAuth();
    renderizarTabelaPizzas();
    renderizarPedidos();
    renderizarAvaliacoes();

    // Fecha modal ao clicar fora
    document.getElementById('modalPizza').addEventListener('click', function(e) {
      if (e.target === this) fecharFormPizza();
    });

    // Escuta mudanças no localStorage feitas em outras abas
    window.addEventListener('storage', (e) => {
      if (e.key === 'pedidos')    renderizarPedidos();
      if (e.key === 'avaliacoes') renderizarAvaliacoes();
      if (e.key === 'pizzas')     renderizarTabelaPizzas();
    });
  }
});
