// Menu de navegação interativo e minimalista

(function() {
  'use strict';

  // Criar estrutura do menu
  function createNavigationMenu() {
    // Botão toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'nav-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');
    toggleBtn.innerHTML = '<span></span>';

    // Container do menu
    const navMenu = document.createElement('nav');
    navMenu.className = 'nav-menu hidden';
    navMenu.setAttribute('aria-label', 'Section navigation');

    // Lista de itens do menu
    const navList = document.createElement('ul');
    navList.className = 'nav-menu-items';

    // Definir seções do menu (agrupadas tematicamente)
    const sections = [
      // Informações Gerais
      { id: 'presentation', title: 'Sobre o SiMM' },
      { id: 'data-export', title: 'Download de Dados' },
      { id: 'dashboard', title: 'Dashboard de Métricas' },
      { id: 'collection-history-section', title: 'Histórico de Coletas' },

      // Análise de Hashtags
      { id: 'hashtags-section', title: 'Hashtags Mais Usadas' },
      { id: 'network-section', title: 'Rede de Hashtags' },
      { id: 'hashtag-dashboard-section', title: 'Dashboard de Hashtags' },

      // Engajamento e Influência
      { id: 'likes-timeline-section', title: 'Timeline de Likes' },
      { id: 'influencers-section', title: 'Top Influenciadores' },
      { id: 'content-performance-section', title: 'Performance de Conteúdo' },

      // Análise Comparativa e Temporal
      { id: 'platform-comparison-section', title: 'Comparativo de Plataformas' },
      { id: 'temporal-heatmap-section', title: 'Atividade Temporal' },

      // Análise de Conteúdo
      { id: 'narrative-analysis-section', title: 'Análise de Narrativas' },
      { id: 'gallery-section', title: 'Galeria de Mídia' }
    ];

    // Criar itens do menu
    sections.forEach(section => {
      const sectionElement = document.getElementById(section.id);
      if (sectionElement) {
        const li = document.createElement('li');
        li.className = 'nav-menu-item';

        const link = document.createElement('a');
        link.className = 'nav-menu-link';
        link.href = `#${section.id}`;
        link.textContent = section.title;
        link.setAttribute('data-section', section.id);

        li.appendChild(link);
        navList.appendChild(li);
      }
    });

    navMenu.appendChild(navList);
    document.body.appendChild(toggleBtn);
    document.body.appendChild(navMenu);

    return { toggleBtn, navMenu };
  }

  // Inicializar menu
  function initNavigationMenu() {
    const { toggleBtn, navMenu } = createNavigationMenu();

    // Toggle menu
    toggleBtn.addEventListener('click', () => {
      const isHidden = navMenu.classList.contains('hidden');
      navMenu.classList.toggle('hidden');
      toggleBtn.classList.toggle('active');
      toggleBtn.setAttribute('aria-expanded', isHidden);
    });

    // Navegação suave e fechar menu ao clicar
    const navLinks = navMenu.querySelectorAll('.nav-menu-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('data-section');
        const section = document.getElementById(sectionId);

        if (section) {
          // Expandir seção se estiver colapsada
          const content = section.querySelector('.section-content');
          if (content && content.classList.contains('collapsed')) {
            const toggleButton = section.querySelector('.toggle-section');
            if (toggleButton) {
              toggleButton.click();
            }
          }

          // Scroll suave
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Fechar menu em dispositivos móveis
          if (window.innerWidth <= 768) {
            navMenu.classList.add('hidden');
            toggleBtn.classList.remove('active');
            toggleBtn.setAttribute('aria-expanded', 'false');
          }

          // Atualizar item ativo
          navLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    });

    // Destacar seção ativa ao rolar
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          navLinks.forEach(link => {
            if (link.getAttribute('data-section') === sectionId) {
              navLinks.forEach(l => l.classList.remove('active'));
              link.classList.add('active');
            }
          });
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observar todas as seções
    document.querySelectorAll('main section').forEach(section => {
      if (section.id) {
        observer.observe(section);
      }
    });

    // Fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
        if (!navMenu.classList.contains('hidden')) {
          navMenu.classList.add('hidden');
          toggleBtn.classList.remove('active');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      }
    });

    // Fechar menu com tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !navMenu.classList.contains('hidden')) {
        navMenu.classList.add('hidden');
        toggleBtn.classList.remove('active');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigationMenu);
  } else {
    initNavigationMenu();
  }
})();
