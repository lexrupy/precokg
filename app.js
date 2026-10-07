import { 
  calculatePricePerKg, 
  formatCurrency, 
  groupItemsByProduct,
  createHistorySession 
} from './src/calculator.js';

const STORAGE_ITEMS_KEY = 'precokg_saved_items_v2';
const STORAGE_HISTORY_KEY = 'precokg_history_sessions_v2';
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
      historySessions: [],
      isHistoryModalOpen: false,
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
        
        // Conta quantos itens já existem neste grupo para gerar numeração sequencial
        const groupItemsCount = this.savedItems.filter(
          item => (item.group || 'Geral').trim().toLowerCase() === group.toLowerCase()
        ).length;
        const nextIndex = groupItemsCount + 1;
        
        // Se não houver nome, usa 'Item X (xxxg)'
        const name = this.productName.trim() || `Item ${nextIndex} (${this.weightGrams}g)`;

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

      // Adiciona o item à lista ativa
      this.savedItems.unshift(newItem);
      this.persistStorage();

      // Salva o último grupo utilizado no localStorage para retenção
      localStorage.setItem(STORAGE_GROUP_KEY, this.currentResult.group);

      // Limpa os dados específicos do item, mas MANTÉM o groupName ativo!
      this.productName = '';
      this.weightGrams = '';
      this.productPrice = '';
      this.currentResult = null;
    },

    removeItem(id) {
      this.savedItems = this.savedItems.filter(item => item.id !== id);
      this.persistStorage();
    },

    clearAndSaveToHistory() {
      if (this.savedItems.length === 0) return;

      // Gera a sessão de histórico estruturada por Data e Grupo
      const session = createHistorySession(this.savedItems);
      if (session) {
        this.historySessions.unshift(session);
        this.persistHistory();
      }

      // Limpa a tela ativa
      this.savedItems = [];
      this.persistStorage();
    },

    openHistoryModal() {
      this.isHistoryModalOpen = true;
    },

    closeHistoryModal() {
      this.isHistoryModalOpen = false;
    },

    removeHistorySession(id) {
      if (confirm('Deseja excluir esta consulta do histórico?')) {
        this.historySessions = this.historySessions.filter(s => s.id !== id);
        this.persistHistory();
      }
    },

    clearAllHistory() {
      if (confirm('Tem certeza de que deseja apagar todo o histórico de consultas?')) {
        this.historySessions = [];
        this.persistHistory();
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

        const storedHistory = localStorage.getItem(STORAGE_HISTORY_KEY);
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          if (Array.isArray(parsed)) this.historySessions = parsed;
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

    persistHistory() {
      try {
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(this.historySessions));
      } catch (e) {
        console.warn('Erro ao gravar histórico no localStorage:', e);
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

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isHistoryModalOpen) {
        this.closeHistoryModal();
      }
    });
  }
});

app.mount('#app');
