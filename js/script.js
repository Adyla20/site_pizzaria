/* =============================================
   ALDS Pizzaria — JavaScript Principal
   Integrado com localStorage
   ============================================= */

// ==============================================
// DADOS PADRÃO (usados quando localStorage está vazio)
// ==============================================
const PIZZAS_PADRAO = [
  { id: 'p1', nome: 'Margherita',          categoria: 'classica', preco: 38.00, descricao: 'Molho de tomate, mozzarella fresca, manjericão e fio de azeite',              imagem: '' },
  { id: 'p2', nome: 'Calabresa',           categoria: 'classica', preco: 40.00, descricao: 'Molho de tomate, calabresa fatiada, cebola roxa e azeitonas',                  imagem: '' },
  { id: 'p3', nome: '4 Queijos',           categoria: 'classica', preco: 44.00, descricao: 'Mozzarella, parmesão, provolone e gorgonzola sobre molho branco',              imagem: '' },
  { id: 'p4', nome: 'Frango com Catupiry', categoria: 'classica', preco: 42.00, descricao: 'Frango desfiado temperado, Catupiry original e milho',                         imagem: '' },
  { id: 'p5', nome: 'ALDS Suprema',        categoria: 'especial', preco: 52.00, descricao: 'Calabresa, bacon, champignon, pimentão, cebola e duplo queijo',                imagem: '' },
  { id: 'p6', nome: 'Portuguesa',          categoria: 'especial', preco: 46.00, descricao: 'Presunto, ovos, azeitonas, cebola, ervilha e mozzarella',                      imagem: '' },
  { id: 'p7', nome: 'Pepperoni Premium',   categoria: 'especial', preco: 50.00, descricao: 'Generosa camada de pepperoni importado com mozzarella extra',                  imagem: '' },
  { id: 'p8', nome: 'Nutella com Morango', categoria: 'doce',     preco: 48.00, descricao: 'Base de Nutella, morangos frescos fatiados e leite condensado',                imagem: '' },
  { id: 'p9', nome: 'Romeu & Julieta',     categoria: 'doce',     preco: 40.00, descricao: 'Queijo minas frescal com goiabada cascão derretida',                           imagem: '' },
];

// ==============================================
// LOCALSTORAGE — helpers
// ==============================================
function getPizzas() {
  const salvas = localStorage.getItem('pizzas');
  if (!salvas) {
    localStorage.setItem('pizzas', JSON.stringify(PIZZAS_PADRAO));
    return PIZZAS_PADRAO;
  }
  return JSON.parse(salvas);
}

function getPedidos() {
  return JSON.parse(localStorage.getItem('pedidos') || '[]');
}

function getAvaliacoes() {
  return JSON.parse(localStorage.getItem('avaliacoes') || '[]');
}

// ==============================================
// CARDÁPIO — renderização dinâmica
// ==============================================
const EMOJI_CAT  = { classica: '🍕', especial: '🔥', doce: '🍫' };
const LABEL_CAT  = { classica: 'Clássica', especial: 'Especial', doce: 'Doce' };
const CLASS_CAT  = { classica: '', especial: ' especial', doce: ' doce' };

function renderizarCardapio() {
  const grid   = document.getElementById('pizzaGrid');
  if (!grid) return;

  const pizzas = getPizzas();
  const filtroAtivo = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';

  if (pizzas.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:#888;padding:40px 0;grid-column:1/-1">Nenhuma pizza disponível no momento.</p>';
    return;
  }

  grid.innerHTML = pizzas.map(p => {
    const emoji   = EMOJI_CAT[p.categoria]  || '🍕';
    const label   = LABEL_CAT[p.categoria]  || p.categoria;
    const cls     = CLASS_CAT[p.categoria]  || '';
    const hidden  = (filtroAtivo !== 'all' && p.categoria !== filtroAtivo) ? ' hidden' : '';
    const imgHtml = p.imagem
      ? `<img src="${escHtml(p.imagem)}" alt="${escHtml(p.nome)}" class="pizza-card-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="pizza-emoji" style="display:none">${emoji}</div>`
      : `<div class="pizza-emoji">${emoji}</div>`;

    const precoFmt = `R$ ${Number(p.preco).toFixed(2).replace('.', ',')}`;
    const nomeEsc  = escHtml(p.nome);

    return `
      <div class="pizza-card${hidden}" data-category="${p.categoria}">
        <div class="pizza-img-wrap">
          ${imgHtml}
          <span class="pizza-tag${cls}">${label}</span>
        </div>
        <div class="pizza-info">
          <h3>${nomeEsc}</h3>
          <p>${escHtml(p.descricao)}</p>
          <div class="pizza-footer">
            <span class="price">${precoFmt}</span>
            <button class="btn-add" data-nome="${nomeEsc}" data-preco="${p.preco}">+ Adicionar</button>
          </div>
        </div>
      </div>`;
  }).join('');

  // Event delegation para botões "+ Adicionar"
  grid.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => {
      adicionarAoPedido(btn.dataset.nome, parseFloat(btn.dataset.preco));
    });
  });

  // Animação de entrada
  observarCards();
}

function observarCards() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.pizza-card').forEach(el => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(24px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    observer.observe(el);
  });
}

// ==============================================
// FILTROS DO CARDÁPIO
// ==============================================
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.pizza-card').forEach(card => {
      card.classList.toggle('hidden', filter !== 'all' && card.dataset.category !== filter);
    });
  });
});

// ==============================================
// CARRINHO
// ==============================================
const carrinho = [];

function adicionarAoPedido(nome, preco) {
  const existente = carrinho.find(item => item.nome === nome);
  if (existente) {
    existente.qtd++;
  } else {
    carrinho.push({ nome, preco, qtd: 1 });
  }
  renderizarCarrinho();
  mostrarToast(`${nome} adicionado ao pedido! 🍕`);
}

function removerItem(index) {
  carrinho.splice(index, 1);
  renderizarCarrinho();
}

function renderizarCarrinho() {
  const lista    = document.getElementById('carrinhoLista');
  const totalDiv = document.getElementById('carrinhoTotal');
  const totalVal = document.getElementById('totalValor');

  lista.innerHTML = '';

  if (carrinho.length === 0) {
    lista.innerHTML = '<li class="carrinho-vazio">Nenhum item adicionado ainda.</li>';
    totalDiv.style.display = 'none';
    return;
  }

  let total = 0;
  carrinho.forEach((item, i) => {
    total += item.preco * item.qtd;
    const li = document.createElement('li');
    li.className = 'carrinho-item';
    li.innerHTML = `
      <span>${item.qtd}x ${escHtml(item.nome)}</span>
      <span>
        R$ ${(item.preco * item.qtd).toFixed(2).replace('.', ',')}
        <button onclick="removerItem(${i})" title="Remover">✕</button>
      </span>`;
    lista.appendChild(li);
  });

  totalDiv.style.display = 'flex';
  totalVal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// ==============================================
// PEDIDO — salva no localStorage
// ==============================================
function enviarPedido(e) {
  e.preventDefault();

  const nome     = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const endereco = document.getElementById('endereco').value.trim();
  const obs      = document.getElementById('obs').value.trim();

  const erroEl = document.getElementById('telefoneErro');
  if (!validarTelefone(telefone)) {
    if (erroEl) {
      erroEl.textContent = 'Informe um telefone válido no formato (XX) XXXXX-XXXX.';
      erroEl.style.display = 'block';
    }
    document.getElementById('telefone').focus();
    return;
  }
  if (erroEl) erroEl.style.display = 'none';

  if (carrinho.length === 0) {
    mostrarToast('Adicione ao menos uma pizza antes de pedir! 🍕');
    return;
  }

  const itensTxt = carrinho.map(i => `${i.qtd}x ${i.nome}`).join(', ');
  const total    = carrinho.reduce((s, i) => s + i.preco * i.qtd, 0);

  // Salvar no localStorage
  const pedidos = getPedidos();
  pedidos.push({
    nome, telefone, endereco, obs,
    itens: itensTxt,
    itensList: carrinho.map(i => ({ nome: i.nome, preco: i.preco, qtd: i.qtd })),
    total,
    data: new Date().toISOString(),
  });
  localStorage.setItem('pedidos', JSON.stringify(pedidos));

  // Modal de confirmação
  const msg = `
    Olá, <strong>${escHtml(nome)}</strong>! Recebemos seu pedido:<br>
    <strong>${escHtml(itensTxt)}</strong><br>
    Total: <strong>R$ ${total.toFixed(2).replace('.', ',')}</strong><br>
    ${endereco ? `Endereço: ${escHtml(endereco)}<br>` : ''}
    Em breve entraremos em contato pelo número <strong>${escHtml(telefone)}</strong>.
  `;
  document.getElementById('modalMensagem').innerHTML = msg;
  document.getElementById('modal').classList.add('open');

  e.target.reset();
  carrinho.length = 0;
  renderizarCarrinho();
}

function fecharModal() {
  document.getElementById('modal').classList.remove('open');
}

document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) fecharModal();
});

// ==============================================
// AVALIAÇÕES — sistema de estrelas
// ==============================================
let notaSelecionada = 0;

function initEstrelas() {
  const estrelas = document.querySelectorAll('#estrelasInput .estrela');
  if (!estrelas.length) return;

  estrelas.forEach(s => {
    s.addEventListener('mouseenter', () => {
      const val = parseInt(s.dataset.valor);
      estrelas.forEach(e => e.classList.toggle('ativa', parseInt(e.dataset.valor) <= val));
    });
    s.addEventListener('mouseleave', () => {
      estrelas.forEach(e => e.classList.toggle('ativa', parseInt(e.dataset.valor) <= notaSelecionada));
    });
    s.addEventListener('click', () => {
      notaSelecionada = parseInt(s.dataset.valor);
      document.getElementById('notaAvaliacao').value = notaSelecionada;
      estrelas.forEach(e => e.classList.toggle('ativa', parseInt(e.dataset.valor) <= notaSelecionada));
    });
  });
}

function salvarAvaliacao(e) {
  e.preventDefault();
  const nota       = parseInt(document.getElementById('notaAvaliacao').value);
  const nome       = document.getElementById('nomeAvaliador').value.trim();
  const comentario = document.getElementById('comentarioAvaliacao').value.trim();

  if (nota === 0) {
    mostrarToast('Selecione uma nota antes de enviar! ⭐');
    return;
  }

  const avaliacoes = getAvaliacoes();
  avaliacoes.push({ nome, nota, comentario, data: new Date().toISOString() });
  localStorage.setItem('avaliacoes', JSON.stringify(avaliacoes));

  e.target.reset();
  notaSelecionada = 0;
  document.querySelectorAll('#estrelasInput .estrela').forEach(e => e.classList.remove('ativa'));

  renderizarAvaliacoesPublicas();
  mostrarToast('Obrigado pela sua avaliação! ⭐');
}

function renderizarAvaliacoesPublicas() {
  const grid = document.getElementById('avaliacoesGrid');
  if (!grid) return;

  const avs = getAvaliacoes();
  if (avs.length === 0) {
    grid.innerHTML = '<p class="sem-avaliacoes">Seja o primeiro a avaliar! ⭐</p>';
    return;
  }

  const media = avs.reduce((s, a) => s + Number(a.nota), 0) / avs.length;
  const ultimas = [...avs].reverse().slice(0, 6);

  grid.innerHTML = `
    <div class="media-geral">
      <span class="media-numero">${media.toFixed(1)}</span>
      <div>
        <div class="media-estrelas">${'★'.repeat(Math.round(media))}${'☆'.repeat(5 - Math.round(media))}</div>
        <span class="media-total">${avs.length} avaliação${avs.length !== 1 ? 'ões' : ''}</span>
      </div>
    </div>
    <div class="avaliacoes-cards">
      ${ultimas.map(a => `
        <div class="avaliacao-pub-card">
          <div class="avaliacao-pub-estrelas">${'★'.repeat(a.nota)}${'☆'.repeat(5 - a.nota)}</div>
          <p class="avaliacao-pub-comentario">${escHtml(a.comentario || '—')}</p>
          <span class="avaliacao-pub-nome">— ${escHtml(a.nome)}</span>
        </div>`).join('')}
    </div>`;
}

// ==============================================
// TOAST
// ==============================================
function mostrarToast(msg) {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '28px', left: '50%',
    transform: 'translateX(-50%) translateY(20px)',
    background: '#111', color: '#fff', padding: '12px 28px',
    borderRadius: '50px', fontFamily: 'Roboto, sans-serif',
    fontSize: '.92rem', border: '1px solid #C9A227',
    zIndex: '9998', opacity: '0',
    transition: 'opacity .3s, transform .3s', whiteSpace: 'nowrap',
  });

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity   = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 350);
  }, 2500);
}

// ==============================================
// MENU MOBILE
// ==============================================
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// ==============================================
// HEADER SCROLL
// ==============================================
window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  header.style.background = window.scrollY > 60
    ? 'rgba(17,17,17,0.98)'
    : 'rgba(17,17,17,0.92)';
});

// ==============================================
// FEATURE CARDS — animação (estáticos no HTML)
// ==============================================
const featureObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0)';
      featureObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card').forEach(el => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(24px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  featureObserver.observe(el);
});

// ==============================================
// XSS prevention
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
// ATUALIZAÇÃO EM TEMPO REAL (outra aba/admin)
// ==============================================
window.addEventListener('storage', (e) => {
  if (e.key === 'pizzas')     renderizarCardapio();
  if (e.key === 'avaliacoes') renderizarAvaliacoesPublicas();
});

// ==============================================
// MÁSCARA DE TELEFONE
// ==============================================
function aplicarMascaraTelefone(e) {
  let v = e.target.value.replace(/\D/g, '').slice(0, 11);
  let mascara = '';
  if (v.length === 0) {
    mascara = '';
  } else if (v.length <= 2) {
    mascara = '(' + v;
  } else if (v.length <= 7) {
    mascara = '(' + v.slice(0, 2) + ') ' + v.slice(2);
  } else {
    mascara = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
  }
  e.target.value = mascara;

  const erroEl = document.getElementById('telefoneErro');
  if (erroEl) erroEl.style.display = 'none';
}

function validarTelefone(valor) {
  // Aceita (XX) XXXXX-XXXX — 11 dígitos (celular)
  return /^\(\d{2}\) \d{5}-\d{4}$/.test(valor);
}

// ==============================================
// INICIALIZAÇÃO
// ==============================================
renderizarCardapio();
renderizarAvaliacoesPublicas();
initEstrelas();

const campoTelefone = document.getElementById('telefone');
if (campoTelefone) {
  campoTelefone.addEventListener('input', aplicarMascaraTelefone);
}
