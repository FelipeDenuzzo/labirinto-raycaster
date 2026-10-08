# Labirinto Raycaster: Upload de Imagem e Modos Híbridos de Controle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o upload de imagem de labirinto (linhas pretas em fundo branco) com conversão automática em mapa jogável 3D, seleção interativa de início/saída e suporte a controles híbridos por fase (Giroscópio 360° vs 3 Botões na tela).

**Architecture:** Módulo puro de conversão de imagem em grade (`src/maze-parser.js`), gerenciador desacoplado de esquemas de controle (`src/controls.js`), modal administrativo com preview interativo em canvas 2D e integração no motor Raycaster existente em `index.html`.

**Tech Stack:** HTML5, Vanilla JavaScript (ES6+), Canvas 2D API, Raycasting engine, Node.js para testes automatizados.

**Spec:** [docs/superpowers/specs/2026-10-08-labirinto-custom-e-controles-hibridos-design.md](file:///Users/felipedenuzzo/.gemini/antigravity-ide/scratch/labirinto-raycaster/docs/superpowers/specs/2026-10-08-labirinto-custom-e-controles-hibridos-design.md)

## Global Constraints
- Zero dependências npm no runtime cliente (código 100% nativo Vanilla JS e HTML5).
- Resolução de grade ajustável entre 15×15 e 35×35 (padrão 20×20).
- Modo de botões com 3 botões ergonômicos: Girar Esquerda ↺, Avançar ⬆ e Girar Direita ↻.
- Bordas externas do mapa sempre sólidas (`1`), exceto no ponto de saída (`2`).
- Spawn do jogador e saída nunca podem ficar presos dentro de parede sólida.

## Review Focus
1. **Spawn ou saída clicados sobre parede preta**: A célula deve ser desobstruída para livre (`0`) automaticamente para evitar spawn preso.
2. **Multi-toque na barra de botões**: O jogador deve poder segurar o botão Avançar ⬆ e Girar ↺ ou ↻ simultaneamente sem cancelamento de eventos.
3. **Inversão de modo sem reiniciar página**: Ao alternar de fase com botões para giroscópio (ou vice-versa), os listeners de `deviceorientation` e os botões virtuais devem ser devidamente ativados/desativados sem vazamento de estado.
4. **Bordas abertas na imagem**: A imagem original pode ter aberturas nas laterais; o algoritmo deve reforçar as paredes perimetrais para evitar vazamento do jogador para o vazio do raycaster.
5. **Tentativa de iniciar sem marcar início e saída**: O botão de início deve ser bloqueado com mensagem clara de instrução até que ambos os pontos estejam selecionados.

---

### Task 1: Módulo de Processamento e Conversão de Imagem (`src/maze-parser.js`)

**Files:**
- Create: `src/maze-parser.js`
- Test: `tests/test-maze-parser.js`

**Interfaces:**
- Produces:
  - `amostrarGrade(pixels, imgLargura, imgAltura, colunas, linhas, limiarLuminosidade): number[][]`
  - `garantirParedesPerimetro(matriz): number[][]`
  - `aplicarPontosNoMapa(matriz, pontoInicio, pontoSaida): { mapa: number[][], inicioValido: boolean, saidaValida: boolean }`

- [ ] **Step 1: Write the failing test**

Criar `tests/test-maze-parser.js` testando:
- Conversão de matriz de pixels simulada (quadrado preto central com fundo branco) em grade com `1` (parede) e `0` (vazio).
- Garantia de fechamento de bordas.
- Aplicação de ponto de início e saída com desobstrução de células sólidas.

```javascript
// tests/test-maze-parser.js
const assert = require('assert');
const { amostrarGrade, garantirParedesPerimetro, aplicarPontosNoMapa } = require('../src/maze-parser');

// Teste 1: Amostragem simples
const largura = 4;
const altura = 4;
// Cria 4x4 pixels: fundo branco (255) com 2x2 centro preto (0)
const pixels = new Uint8ClampedArray(largura * altura * 4);
for (let y = 0; y < altura; y++) {
  for (let x = 0; x < largura; x++) {
    const idx = (y * largura + x) * 4;
    const ehCentro = (x >= 1 && x <= 2 && y >= 1 && y <= 2);
    const cor = ehCentro ? 0 : 255;
    pixels[idx] = cor;
    pixels[idx + 1] = cor;
    pixels[idx + 2] = cor;
    pixels[idx + 3] = 255;
  }
}

const grade = amostrarGrade(pixels, largura, altura, 4, 4, 128);
assert.strictEqual(grade[0][0], 0, 'Canto deve ser livre');
assert.strictEqual(grade[1][1], 1, 'Centro deve ser parede');

// Teste 2: Fechamento perimetral
const comPerimetro = garantirParedesPerimetro(grade);
assert.strictEqual(comPerimetro[0][0], 1, 'Borda superior esquerda deve ser 1');
assert.strictEqual(comPerimetro[3][3], 1, 'Borda inferior direita deve ser 1');

// Teste 3: Aplicação de início e saída
const { mapa, inicioValido, saidaValida } = aplicarPontosNoMapa(comPerimetro, { x: 1, y: 1 }, { x: 2, y: 2 });
assert.strictEqual(inicioValido, true);
assert.strictEqual(saidaValida, true);
assert.strictEqual(mapa[1][1], 0, 'Spawn deve ser transitável (0)');
assert.strictEqual(mapa[2][2], 2, 'Saída deve ser marcada como 2');

console.log('✓ Todos os testes de maze-parser passaram com sucesso!');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test-maze-parser.js`
Expected: FAIL (módulo `../src/maze-parser` não encontrado).

- [ ] **Step 3: Implement `src/maze-parser.js`**

Implementar as funções `amostrarGrade`, `garantirParedesPerimetro` e `aplicarPontosNoMapa` com suporte a Node.js e navegador (exportação universal UMD/CommonJS).

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test-maze-parser.js`
Expected: PASS com `✓ Todos os testes de maze-parser passaram com sucesso!`.

- [ ] **Step 5: Commit**

```bash
git add src/maze-parser.js tests/test-maze-parser.js
git commit -m "feat: adicionar modulo de processamento e amostragem de labirinto"
```

---

### Task 2: Gerenciador de Controles Híbridos (`src/controls.js`)

**Files:**
- Create: `src/controls.js`
- Test: `tests/test-controls.js`

**Interfaces:**
- Produces:
  - `class GerenciadorControles`:
    - `definirModo(modo: 'giroscopio' | 'botoes')`
    - `obterEstadoMovimento(): { avancando: boolean, girandoEsquerda: boolean, girandoDireita: boolean }`
    - `atualizarAnguloJogador(anguloAtual, deltaTempo, velocidadeGiro): number`
    - `vincularBotoes(btnAvancar, btnGirarEsq, btnGirarDir)`
    - `desvincular()`

- [ ] **Step 1: Write the failing test**

Criar `tests/test-controls.js` testando:
- Alternância de modos (`'giroscopio'` vs `'botoes'`).
- Atualização matemática de ângulo ao girar para a esquerda e para a direita em modo botões.
- Estado de avanço com suporte a múltiplos toques simulados.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test-controls.js`
Expected: FAIL (módulo `../src/controls` não encontrado).

- [ ] **Step 3: Implement `src/controls.js`**

Implementar a classe `GerenciadorControles` com:
- Tratamento de `PointerEvents` para botões virtuais (com suporte a toque contínuo).
- Desativação limpa de ouvintes quando desvinculado ou quando o modo for alterado.
- Cálculo de rotação e compatibilidade isomórfica (Node/Browser).

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test-controls.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/controls.js tests/test-controls.js
git commit -m "feat: adicionar gerenciador de controles hibridos"
```

---

### Task 3: Interface do Modal Admin e Canvas de Preview Interativo (`index.html`)

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes:
  - `src/maze-parser.js` (`amostrarGrade`, `garantirParedesPerimetro`, `aplicarPontosNoMapa`)
  - `src/controls.js` (`GerenciadorControles`)
- Produces:
  - Elementos UI: `#modal-admin`, `#input-imagem-labirinto`, `#slider-tamanho-grade`, `#preview-labirinto`, `#seletor-modo-controle`, `#btn-jogar-custom`.

- [ ] **Step 1: Adicionar estilos CSS e marcação HTML do Modal Admin em `index.html`**

- Adicionar botão `"⚙️ CARREGAR LABIRINTO"` na tela inicial (`#tela-inicio`).
- Criar a estrutura do modal `#modal-admin`:
  - Botão fechar (✕).
  - Input de upload de imagem com área de drop estilizada.
  - Slider de tamanho da grade com exibição numérica (ex: 20×20).
  - Seletor de modo com botões estilizados: `[🧭 Giroscópio 360°]` e `[🕹️ Botões na Tela]`.
  - Canvas interativo `#preview-labirinto` para desenho da matriz em 2D.
  - Legenda de instrução: *"Clique 1: Início (🟢) | Clique 2: Saída (🏁)"*.
  - Botão `#btn-jogar-custom` (desabilitado inicialmente até selecionar início e saída).

- [ ] **Step 2: Implementar lógica de interação do Preview e Upload no cliente**

- `FileReader` para carregar a imagem e desenhar no canvas de amostragem.
- Ao mudar o slider de resolução: reamostrar a imagem imediatamente e redesenhar o preview.
- Toque/clique no canvas de preview:
  - Se não houver início: define `pontoInicio = { x, y }`.
  - Se houver início mas não saída: define `pontoSaida = { x, y }`.
  - Se ambos já existirem: clique reseta e define novo início.
- Habilita o botão `#btn-jogar-custom` assim que início e saída forem válidos.

- [ ] **Step 3: Testar manualmente a usabilidade do modal no navegador**

- Subir uma imagem teste de labirinto;
- Alterar o slider e verificar re-renderização imediata;
- Clicar nas células para marcar 🟢 e 🏁;
- Verificar indicação visual correta.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: adicionar modal administrativo com upload e preview interativo"
```

---

### Task 4: Integração dos Controles e Motor Raycaster (`index.html`)

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes:
  - `GerenciadorControles`
  - Matriz gerada pelo `maze-parser`

- [ ] **Step 1: Adicionar barra de 3 botões tátil no HTML e CSS**

- Adicionar container `#controles-botoes` com 3 botões:
  - `#btn-girar-esq`: `↺`
  - `#btn-avancar-botoes`: `⬆ AVANÇAR`
  - `#btn-girar-dir`: `↻`
- Estilizar com `backdrop-filter: blur`, cantos arredondados, feedback ao toque (`:active`) e posições ergonômicas para os polegares.

- [ ] **Step 2: Conectar o loop de jogo ao `GerenciadorControles` e à fase personalizada**

- No loop de atualização:
  - Se modo for `'botoes'`: aplicar rotação contínua ao jogador quando os botões esquerdo/direito estiverem pressionados.
  - Permitir avanço suave com colisão para ambos os modos.
- Atualizar o `#hud-info` com base no modo (`"Gire o corpo 360° para olhar"` vs `"Use os botões na tela para navegar"`).
- Ao clicar em `"JOGAR ESTA FASE"`:
  - Definir a matriz de colisão do jogo como o mapa gerado.
  - Posicionar o jogador em `pontoInicio.x + 0.5`, `pontoInicio.y + 0.5`.
  - Configurar o modo de controle da partida.
  - Fechar o modal e iniciar o jogo.

- [ ] **Step 3: Ajustar tela de vitória e fluxo de reinício**

- Na vitória: além de "JOGAR NOVAMENTE", adicionar opção "CARREGAR NOVO LABIRINTO" que abre o modal admin.

- [ ] **Step 4: Testar no navegador com servidor local**

- Rodar servidor local temporário.
- Testar jogo com a fase padrão e com labirinto personalizado.
- Testar movimentação no modo botões (girar e andar).

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: integrar controles hibridos e mapa customizado no raycaster"
```

---

### Task 5: Imagem de Exemplo, Verificação Geral e Atualização do README

**Files:**
- Create: `exemplo-labirinto.png` (ou script utilitário para gerar labirinto de demonstração)
- Modify: `README.md`

- [ ] **Step 1: Criar imagem de exemplo de labirinto para testes rápidos**

- Criar `assets/exemplo-labirinto.png` (fundo branco, linhas pretas nítidas) para que o usuário possa testar o upload imediatamente.

- [ ] **Step 2: Atualizar documentação em `README.md`**

- Documentar o novo modo de botões e como funciona o upload de labirinto pelo Admin.

- [ ] **Step 3: Executar todos os testes automatizados**

Run: `node tests/test-maze-parser.js && node tests/test-controls.js`
Expected: Todos os testes passando sem erros.

- [ ] **Step 4: Commit**

```bash
git add README.md assets/ tests/
git commit -m "docs: documentar upload de labirinto e controles hibridos"
```
