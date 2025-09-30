// Renomeado para 'main.js' para melhor convenção.

let carregando = false;

// Função principal para carregar os produtos
async function carregarProdutos() {
    if (carregando) return;
    carregando = true;

    const catalogo = document.getElementById("catalogo-container");
    
    // Mostra o loader
    catalogo.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p class="loading-text">Carregando tesouros da moda...</p>
        </div>
    `;

    try {
        // Adiciona timestamp para forçar o cache-busting e garantir dados atualizados
        const timestamp = new Date().getTime();
        const url = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSqry6hSwMtqwpDOO48E4cykXEk_8VHYVBvmt2N0X79k9_lLoK6-vhgdX395wUPNpkOsh29xA98a6BW/pub?output=csv&gid=0&single=true&t=${timestamp}`;
        
        const resposta = await fetch(url, {
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!resposta.ok) throw new Error('Erro ao buscar dados');
        
        const data = await resposta.text();
        catalogo.innerHTML = ''; // Limpa o loader
        
        // Ignora a primeira linha (cabeçalho)
        const linhas = data.split("\n").slice(1);
        let produtosAdicionados = 0;
        
        linhas.forEach((linha, index) => {
            if (!linha.trim()) return;
            
            // Regex melhorado para lidar com vírgulas dentro de aspas (CSV)
            const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/; 
            const colunas = linha.split(regex).map(col => col.replace(/^"|"$/g, '').trim());
            const [nome, descricao, imagem] = colunas;
            
            if(nome && descricao && imagem) {
                const card = document.createElement("div");
                card.classList.add("produto");
                
                // Lógica de badge (mantida, mas refatorada para ser mais simples)
                const badges = ['✨ Novo', '🔥 Top', '💎 Premium', '⭐ Destaque'];
                const badge = index % 3 === 0 ? badges[Math.floor(Math.random() * badges.length)] : '';
                
                card.innerHTML = `
                    ${badge ? `<div class="produto-badge">${badge}</div>` : ''}
                    <img src="${imagem.trim()}" alt="${nome}" class="produto-image" loading="lazy">
                    <div class="produto-info">
                        <h3 class="produto-nome">${nome}</h3>
                        <p class="produto-descricao">${descricao}</p>
                    </div>
                `;
                
                catalogo.appendChild(card);
                produtosAdicionados++;
            }
        });
        
        if (produtosAdicionados === 0) {
            catalogo.innerHTML = '<div class="loading"><p class="loading-text">Nenhum produto encontrado no momento.</p></div>';
        }
        
    } catch (erro) {
        console.error('Erro:', erro);
        catalogo.innerHTML = '<div class="loading"><p class="loading-text">Erro ao carregar produtos. Tente novamente.</p></div>';
    } finally {
        carregando = false;
    }
}

// --- Lógica de Carrossel Automático (Mobile) ---

const catalogoElement = document.getElementById('catalogo-container');
const intervalTime = 2500; // 4 segundos, conforme solicitado
let autoScrollInterval;
let isUserInteracting = false;
let interactionTimeout;

// Função que calcula e aplica o scroll para o próximo item
function scrollNextProduct() {
    if (window.innerWidth > 768 || !catalogoElement || isUserInteracting) return;
    
    const produtos = catalogoElement.querySelectorAll('.produto');
    if (produtos.length === 0) return;
    
    const itemFullWidth = produtos[0].offsetWidth + 20; 
    const maxScroll = catalogoElement.scrollWidth - catalogoElement.clientWidth;
    
    let newScrollLeft = catalogoElement.scrollLeft + itemFullWidth;
    
    if (newScrollLeft >= maxScroll - 1) {
        newScrollLeft = 0;
    }

    catalogoElement.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
    });
}

// Inicia o carrossel automático
function startAutoScroll() {
    clearInterval(autoScrollInterval);
    autoScrollInterval = setInterval(scrollNextProduct, intervalTime);
}

// Para o carrossel temporariamente quando o usuário toca ou scrolla
function stopAutoScrollTemporarily() {
    // Se já estiver interagindo, apenas reseta o timeout
    if (!isUserInteracting) {
        isUserInteracting = true;
        clearInterval(autoScrollInterval);
    }
    
    // Limpa o timeout anterior e define um novo
    clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(() => {
        isUserInteracting = false;
        startAutoScroll();
    }, 5000); // Espera 5 segundos após a última interação para reiniciar
}

// Configura os listeners de interação
function setupCarouselListeners() {
    // Só configura se estiver em mobile
    if (window.innerWidth <= 768 && catalogoElement) {
        // Eventos para desktop/mouse (embora o auto-scroll não inicie em desktop)
        catalogoElement.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
        catalogoElement.addEventListener('mouseleave', () => {
            if (!isUserInteracting) startAutoScroll();
        });

        // Eventos para mobile (toque e scroll)
        catalogoElement.addEventListener('touchstart', stopAutoScrollTemporarily);
        catalogoElement.addEventListener('scroll', stopAutoScrollTemporarily);
        
        startAutoScroll(); // Inicia o carrossel
    } else {
        clearInterval(autoScrollInterval); // Garante que não está rodando em desktop
    }
}

// Inicialização: carrega os produtos e depois configura o carrossel
function init() {
    carregarProdutos().then(() => {
        // Aguarda um breve momento para garantir que os produtos foram adicionados ao DOM
        setTimeout(setupCarouselListeners, 500); 
    });
    
    // Recalcula e re-inicia o carrossel em caso de redimensionamento (e.g., rotacionar o celular)
    window.addEventListener('resize', () => {
        setupCarouselListeners();
        scrollNextProduct(); // Executa um scroll imediato se mudar de modo
    });
}

// Verifica o estado do DOM para iniciar o script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}