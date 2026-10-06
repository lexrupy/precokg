import { calculatePricePerKg, findCheapestItemId, formatCurrency } from './src/calculator.js';

const STORAGE_KEY = 'precokg_saved_items_v1';

const { createApp } = window.Vue;

const app = createApp({
  data() {
    return {
      productName: '',
      weightGrams: '',
      productPrice: '',
      currentResult: null,
      savedItems: [],
      errorMessage: '',
      deferredPrompt: null
    };
  },

  computed: {
    cheapestId() {
      return findCheapestItemId(this.savedItems);
    },

    cheapestItem() {
      if (!this.cheapestId) return null;
      return this.savedItems.find(item => item.id === this.cheapestId) || null;
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

        const name = this.productName.trim() || `Produto ${this.savedItems.length + 1}`;

        this.currentResult = {
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
        name: this.currentResult.name,
        grams: this.currentResult.grams,
        price: this.currentResult.price,
        pricePerKg: this.currentResult.pricePerKg,
        formattedPrice: this.currentResult.formattedPrice,
        formattedPricePerKg: this.currentResult.formattedPricePerKg,
        savedAt: new Date().toISOString()
      };

      // Adiciona no início da lista
      this.savedItems.unshift(newItem);
      this.persistStorage();

      // Limpa os campos para o próximo item
      this.productName = '';
      this.productPrice = '';
      this.currentResult = null;
    },

    removeItem(id) {
      this.savedItems = this.savedItems.filter(item => item.id !== id);
      this.persistStorage();
    },

    clearAllItems() {
      if (confirm('Deseja limpar todos os produtos comparados?')) {
        this.savedItems = [];
        this.persistStorage();
      }
    },

    getDiffPercent(item) {
      if (!this.cheapestItem || !this.cheapestItem.pricePerKg) return 0;
      const diff = ((item.pricePerKg - this.cheapestItem.pricePerKg) / this.cheapestItem.pricePerKg) * 100;
      return Math.round(diff);
    },

    getDiffCurrency(item) {
      if (!this.cheapestItem || !this.cheapestItem.pricePerKg) return 'R$ 0,00';
      const diff = item.pricePerKg - this.cheapestItem.pricePerKg;
      return formatCurrency(diff);
    },

    loadStorage() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.savedItems = parsed;
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar dados do localStorage:', e);
      }
    },

    persistStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.savedItems));
      } catch (e) {
        console.warn('Erro ao gravar no localStorage:', e);
      }
    },

    setupPwaPrompt() {
      window.addEventListener('beforeinstallprompt', (e) => {
        // Previne abertura padrão e armazena o evento
        e.preventDefault();
        this.deferredPrompt = e;
      });

      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
        console.log('App instalado com sucesso!');
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
            .then(reg => {
              console.log('ServiceWorker registrado com sucesso:', reg.scope);
            })
            .catch(err => {
              console.warn('Falha ao registrar ServiceWorker:', err);
            });
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
