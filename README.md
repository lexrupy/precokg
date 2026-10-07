# ⚖️ Calculadora de Preço por Kg (SPA & PWA 100% Offline)

Aplicativo web responsivo, rápido e moderno projetado para uso prático em supermercados e feiras. Permite comparar rapidamente o custo real dos produtos por quilograma (kg), identificando automaticamente qual embalagem ou marca possui o melhor custo/benefício.

Funciona **100% offline**, pode ser instalado no celular Android/iOS (PWA) e está pronto para publicação direta no **GitHub Pages**.

---

## 🚀 Funcionalidades

- **Cálculo Imediato por Kg:** Insira o peso em gramas (ex: `500` para meio quilo) e o valor em reais (ex: `14,90`) para obter na hora o preço equivalente a 1 kg.
- **Atalhos Rápidos de Peso:** Chips rápidos com pesos comuns (`15g`, `30g`, `60g`, `100g`, `200g`, `250g`, `400g`, `500g`, `1000g`).
- **Agrupamento Inteligente por Produto:** Defina o grupo (ex: *Café*, *Arroz*, *Sabão*) e o aplicativo mantém o grupo selecionado para as próximas inserções. As comparações são feitas exclusivamente entre produtos do mesmo grupo.
- **Destaque do Campeão por Grupo:** Identifica e destaca o melhor custo/benefício de cada grupo (**⭐ Melhor Custo**), calculando o percentual de diferença entre as opções.
- **Limpar & Salvar Automático:** Ao clicar em **🧹 Limpar e Salvar**, a lista ativa é esvaziada para a próxima compra e os registros são arquivados permanentemente.
- **Modal de Histórico Estruturado:** Consulte comparações anteriores organizadas por Data/Hora e depois por Grupo/Tabela de Itens (com botão no topo e atalho ESC).
- **Tema Escuro Compacto & Moderno:** Interface de alta densidade e excelente usabilidade touch, ideal para visualização rápida no celular.
- **100% Offline & PWA:** Todas as bibliotecas (Vue.js e Pico.css) e ícones estão vendorizados localmente. Não realiza nenhuma requisição para CDNs externas após instalado.
- **Instalável no Smartphone:** Suporte a Web App Manifest e Service Worker com estratégia *Cache-First*.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 & CSS3 Moderno**
- **[Pico.css v2](https://picocss.com)** (Vendorizado localmente)
- **[Vue.js 3](https://vuejs.org)** (Vendorizado localmente para reatividade limpa sem necessidade de bundler)
- **Service Worker** com API de Cache Nativa
- **[Vitest](https://vitest.dev)** para suíte de testes unitários automatizados

---

## 🧪 Executando os Testes

A lógica de cálculo e seleção do menor preço foi construída com testes automatizados desde o início.

Para rodar os testes:

```bash
# Executar suíte de testes uma vez
npm test

# Executar em modo observador (watch)
npm run test:watch
```

---

## 🌐 Publicação no GitHub Pages

O projeto foi construído para funcionar diretamente na raiz do repositório estático:

1. Inicialize o git e adicione o remoto:
   ```bash
   git init
   git remote add origin git@github.com:lexrupy/precokg.git
   git add .
   git commit -m "feat: calculadora de preço por kg PWA offline"
   git branch -M main
   git push -u origin main
   ```

2. No GitHub, acesse as configurações do repositório:
   - Vá em **Settings** > **Pages**
   - Em **Build and deployment** > **Source**, selecione **Deploy from a branch**
   - Escolha a branch **main** e pasta **/ (root)**
   - Clique em **Save**

Seu aplicativo estará acessível online em:
`https://lexrupy.github.io/precokg/`
