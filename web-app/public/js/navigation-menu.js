// Menu de navegação entre seções

function initNavigationMenu() {
  // Criar estrutura do menu
  const menuHTML = `
    <div id="nav-menu" class="nav-menu">
      <button id="nav-toggle" class="nav-toggle" aria-label="Abrir menu de navegação">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav id="nav-sidebar" class="nav-sidebar">
        <div class="nav-header">
          <h3>Navegação</h3>
          <button id="nav-close" class="nav-close" aria-label="Fechar menu">&times;</button>
        </div>

        <ul class="nav-list">
          <li><a href="#presentation" class="nav-link" data-section="presentation">Sobre o SiMM</a></li>
          <li><a href="#data-export" class="nav-link" data-section="data-export">Download de Dados</a></li>
          <li><a href="#dashboard" class="nav-link" data-section="dashboard">Dashboard de Métricas</a></li>
          <li><a href="#collection-history-section" class="nav-link" data-section="collection-history-section">Histórico de Coletas</a></li>
          <li><a href="#likes-timeline-section" class="nav-link" data-section="likes-timeline-section">Timeline de Likes</a></li>
          <li><a href="#hashtag-cloud-section" class="nav-link" data-section="hashtag-cloud-section">Nuvem de Hashtags</a></li>
          <li><a href="#hashtag-network-section" class="nav-link" data-section="hashtag-network-section">Rede de Hashtags</a></li>
          <li><a href="#engagement-section" class="nav-link" data-section="engagement-section">Distribuição de Engajamento</a></li>
          <li><a href="#influencers-section" class="nav-link" data-section="influencers-section">Top Influenciadores</a></li>
          <li><a href="#platform-comparison-section" class="nav-link" data-section="platform-comparison-section">Comparativo de Plataformas</a></li>
          <li><a href="#content-performance-section" class="nav-link" data-section="content-performance-section">Performance de Conteúdo</a></li>
          <li><a href="#temporal-heatmap-section" class="nav-link" data-section="temporal-heatmap-section">Atividade Temporal</a></li>
          <li><a href="#hashtag-dashboard-section" class="nav-link" data-section="hashtag-dashboard-section">Dashboard de Hashtags</a></li>
          <li><a href="#narrative-analysis-section" class="nav-link" data-section="narrative-analysis-section">Análise de Narrativas</a></li>
          <li><a href="#timeline-section" class="nav-link" data-section="timeline-section">Timeline de Posts</a></li>
          <li><a href="#gallery-section" class="nav-link" data-section="gallery-section">Galeria de Mídia</a></li>
        </ul>
      </nav>

      <div id="nav-overlay" class="nav-overlay"></div>
    </div>
  `;

  // Inserir no início do body
  document.body.insertAdjacentHTML('afterbegin', menuHTML);

  // Event listeners
  const toggle = document.getElementById('nav-toggle');
  const sidebar = document.getElementById('nav-sidebar');
  const overlay = document.getElementById('nav-overlay');
  const closeBtn = document.getElementById('nav-close');
  const navLinks = document.querySelectorAll('.nav-link');

  // Abrir menu
  toggle.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  // Fechar menu
  function closeMenu() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);

  // Navegação com scroll suave
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const targetId = link.getAttribute('data-section');
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        // Fechar menu
        closeMenu();

        // Expandir seção se estiver colapsada
        const content = targetSection.querySelector('.section-content');
        const toggleBtn = targetSection.querySelector('.toggle-section');

        if (content && content.classList.contains('collapsed')) {
          toggleBtn.click();
        }

        // Scroll suave com offset para header
        setTimeout(() => {
          const headerOffset = 80;
          const elementPosition = targetSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }, 100);
      }
    });
  });

  // Highlight da seção atual durante scroll
  highlightCurrentSection();
  window.addEventListener('scroll', highlightCurrentSection);
}

function highlightCurrentSection() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  let currentSection = '';
  const scrollPosition = window.pageYOffset + 150;

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;

    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      currentSection = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-section') === currentSection) {
      link.classList.add('active');
    }
  });
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initNavigationMenu);
