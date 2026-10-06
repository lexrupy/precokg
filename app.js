import { 
  calculatePricePerKg, 
  formatCurrency, 
  groupItemsByProduct 
} from './src/calculator.js';

const STORAGE_ITEMS_KEY = 'precokg_saved_items_v2';
const STORAGE_ARCHIVES_KEY = 'precokg_archived_sessions_v1';
const STORAGE_GROUP_KEY = 'precokg_last_group_v1';

const { createApp } = window.Vue;

const app = createApp({
  data() {
    return {
      groupName: '',
      productName: '',
      weightGrams: '',
      productPrice: '',
      currentResult: null,
      savedItems: [],
      archivedSessions: [],
      showArchive: false,
      errorMessage: '',
      deferredPrompt: null
    };
  },

  computed: {
    groupedItems() {
      return groupItemsByProduct(this.savedItems);
    }
  },

  methods: {
    setPreset(grams) {
      this.weightGrams = grams;
      this.errorMessage = '';
    },

    handleCalculate() {
      this.errorMessage = '';
      try {
        if (!this.weightGrams || Number(this.weightGrams) <= 0) {
          throw new Error('Informe um peso em gramas válido (maior que 0).');
        }

        if (!this.productPrice) {
          throw new Error('Informe o preço do produto.');
        }

        const pricePerKg = calculatePricePerKg(this.weightGrams, this.productPrice);
        const rawPrice = typeof this.productPrice === 'string'
          ? parseFloat(this.productPrice.replace(',', '.'))
          : Number(this.productPrice);

        const group = this.groupName.trim() || 'Geral';
        const name = this.productName.trim() || `Item ${this.savedItems.length + 1}`;

        this.currentResult = {
          group,
          name,
          grams: Number(this.weightGrams),
          price: rawPrice,
          pricePerKg,
          formattedPrice: formatCurrency(rawPrice),
          formattedPricePerKg: formatCurrency(pricePerKg)
        };
      } catch (err) {
        this.errorMessage = err.message || 'Erro ao calcular. Verifique os valores inseridos.';
      }
    },

    saveCurrentResult() {
      if (!this.currentResult) return;

      const newItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        group: this.currentResult.group,
        name: this.currentResult.name,
        grams: this.currentResult.grams,
        price: this.currentResult.price,
        pricePerKg: this.currentResult.pricePerKg,
        formattedPrice: this.currentResult.formattedPrice,
        formattedPricePerKg: this.currentResult.formattedPricePerKg,
        savedAt: new Date().toISOString()
      };

      // Adiciona o item à lista
      this.savedItems.unshift(newItem);
      this.persistStorage();

      // Salva o último grupo utilizado no localStorage para retenção
      localStorage.setItem(STORAGE_GROUP_KEY, this.currentResult.group);

      // Limpa os dados do item ESPECÍFICO, mas MANTÉM o groupName ativo!
      this.productName = '';
      this.weightGrams = '';
      this.productPrice = '';
      this.currentResult = null;
    },

    removeItem(id) {
      this.savedItems = this.savedItems.filter(item => item.id !== id);
      this.persistStorage();
    },

    clearAllItems() {
      if (confirm('Deseja limpar todos os itens comparados da lista atual?')) {
        this.savedItems = [];
        this.persistStorage();
      }
    },

    archiveCurrentSession() {
      if (this.savedItems.length === 0) return;

      const now = new Date();
      const dateFormatted = now.toLocaleDateString('pt-BR') + ' ' + 
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const newArchive = {
        id: 'arch_' + Date.now(),
        date: dateFormatted,
        totalItems: this.savedItems.length,
        groups: this.groupedItems.map(g => ({
          key: g.key,
          groupName: g.groupName,
          cheapestItem: g.cheapestItem,
          itemsCount: g.items.length
        }))
      };

      this.archivedSessions.unshift(newArchive);
      this.savedItems = [];
      this.persistStorage();
      this.persistArchives();
    },

    deleteArchive(id) {
      if (confirm('Excluir este registro arquivado?')) {
        this.archivedSessions = this.archivedSessions.filter(s => s.id !== id);
        this.persistArchives();
      }
    },

    getDiffPercentInGroup(item, group) {
      if (!group.cheapestItem || !group.cheapestItem.pricePerKg) return 0;
      const diff = ((item.pricePerKg - group.cheapestItem.pricePerKg) / group.cheapestItem.pricePerKg) * 100;
      return Math.round(diff);
    },

    getDiffCurrencyInGroup(item, group) {
      if (!group.cheapestItem || !group.cheapestItem.pricePerKg) return 'R$ 0,00';
      const diff = item.pricePerKg - group.cheapestItem.pricePerKg;
      return formatCurrency(diff);
    },

    loadStorage() {
      try {
        const storedItems = localStorage.getItem(STORAGE_ITEMS_KEY);
        if (storedItems) {
          const parsed = JSON.parse(storedItems);
          if (Array.isArray(parsed)) this.savedItems = parsed;
        }

        const storedArchives = localStorage.getItem(STORAGE_ARCHIVES_KEY);
        if (storedArchives) {
          const parsed = JSON.parse(storedArchives);
          if (Array.isArray(parsed)) this.archivedSessions = parsed;
        }

        const lastGroup = localStorage.getItem(STORAGE_GROUP_KEY);
        if (lastGroup) {
          this.groupName = lastGroup;
        }
      } catch (e) {
        console.warn('Erro ao carregar dados do localStorage:', e);
      }
    },

    persistStorage() {
      try {
        localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(this.savedItems));
      } catch (e) {
        console.warn('Erro ao gravar no localStorage:', e);
      }
    },

    persistArchives() {
      try {
        localStorage.setItem(STORAGE_ARCHIVES_KEY, JSON.stringify(this.archivedSessions));
      } catch (e) {
        console.warn('Erro ao gravar arquivos no localStorage:', e);
      }
    },

    setupPwaPrompt() {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
      });

      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
      });
    },

    async installPwa() {
      if (!this.deferredPrompt) return;
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        this.deferredPrompt = null;
      }
    },

    registerServiceWorker() {
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('./sw.js')
            .catch(err => console.warn('Falha ao registrar ServiceWorker:', err));
        });
      }
    }
  },

  mounted() {
    this.loadStorage();
    this.setupPwaPrompt();
    this.registerServiceWorker();
  }
});

app.mount('#app');
