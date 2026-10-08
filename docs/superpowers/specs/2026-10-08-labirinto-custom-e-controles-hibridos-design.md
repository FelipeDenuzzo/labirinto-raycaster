# Especificação Técnica: Labirinto Raycaster - Upload de Imagem e Modos Híbridos de Controle

- **Data:** 2026-10-08
- **Status:** Aprovado
- **Escopo:** Módulo de Upload & Conversão de Imagens de Labirinto + Suporte a Modos Híbridos de Controle (Giroscópio 360° vs Botões na Tela).

---

## 1. Visão Geral

O objetivo deste projeto é expandir o jogo pseudo-3D Raycaster mobile permitindo que:
1. O Administrador faça upload de uma imagem de labirinto (linhas pretas com fundo branco) e o sistema a converta automaticamente em um mapa jogável 3D em tempo real.
2. O Administrador selecione o Ponto de Partida do jogador (Spawn) e a Saída clicando diretamente sobre a pré-visualização da grade.
3. As fases suportem esquemas de controle diferenciados:
   - **Modo Giroscópio:** Rotação 360° no próprio eixo pelo sensor do celular + botão na tela para avançar.
   - **Modo Botões:** 3 botões ergonômicos na tela (**Girar para a Esquerda ↺**, **Avançar ⬆**, **Girar para a Direita ↻**) sem exigir giroscópio físico.

---

## 2. Arquitetura do Sistema

O sistema é 100% executado no lado do cliente (navegador), sem necessidade de backend ou dependências externas pesadas:

```
[Upload de Imagem (JPG/PNG)]
          │
          ▼
[Canvas de Processamento 2D]
  - Sub-amostragem por grade (NxN)
  - Limiarização de luminosidade (Preto = Parede [1], Branco = Livre [0])
  - Fechamento seguro de bordas
          │
          ▼
[Canvas Interativo de Preview (Modal Admin)]
  - Clique 1: Define Spawn do Jogador (🟢)
  - Clique 2: Define Saída do Labirinto (🏁)
  - Seletor de Modo: [Giroscópio 360°] vs [3 Botões na Tela]
          │
          ▼
[Motor Raycaster (index.html)]
  - Carrega matriz gerada no loop 3D
  - Configura listeners de input adequados ao modo selecionado
```

---

## 3. Componentes e Interfaces

### 3.1 Painel Administrativo (`#modal-admin`)
- **Gatilho de Abertura:** Botão `"⚙️ Carregar Labirinto (Admin)"` na tela inicial do jogo.
- **Upload:** Input de arquivo (`<input type="file" accept="image/*">`).
- **Controle de Resolução:** Slider de tamanho de grade (15×15 até 35×35, padrão inicial: 20×20).
- **Seletor de Modo de Controle:** Rádio/botões para alternar entre:
  - `Giroscópio 360°`
  - `Botões na Tela (Girar Esquerda, Avançar, Girar Direita)`
- **Canvas de Preview Interativo:**
  - Renderiza a miniatura 2D da matriz resultante.
  - Interação por toque/clique:
    - 1º clique: posiciona a partida (🟢).
    - 2º clique: posiciona a saída (🏁).
    - Cliques subsequentes reposicionam ou permitem limpar.
  - Garante que a célula clicada para início/saída seja convertida em espaço livre transitável se tiver sido classificada como parede.
- **Botão Iniciar:** `"▶️ JOGAR ESTA FASE"`, habilitado quando Início e Saída estiverem definidos.

### 3.2 Esquema de Controles Dinâmicos

#### Modo 1: Giroscópio 360°
- HUD Superior: `"Gire o corpo 360° para olhar"`
- Entrada: Eventos `deviceorientation` (compatível com iOS `webkitCompassHeading` e Android `alpha`).
- Botão: Botão único `"AVANÇAR"` centralizado na parte inferior da tela.

#### Modo 2: Botões na Tela
- HUD Superior: `"Use os botões na tela para navegar"`
- Desativação de orientação: Desconecta listeners de giroscópio para evitar movimentos indesejados.
- Barra de Controles:
  - `Botão Esquerda (↺)`: Girar câmera no sentido anti-horário (velocidade angular constante enquanto pressionado).
  - `Botão Avançar (⬆)`: Movimentar jogador para frente no ângulo atual (com detecção de colisão contínua).
  - `Botão Direita (↻)`: Girar câmera no sentido horário (velocidade angular constante enquanto pressionado).
- Suporte a multi-toque (`PointerEvents`) permitindo movimentar e girar simultaneamente.

---

## 4. Algoritmo de Conversão de Imagem

1. **Leitura da Imagem:** Via `FileReader` lendo como DataURL, instanciando `Image()`.
2. **Discretização em Grade:**
   - Para uma grade de tamanho $W \times H$:
   - Cada célula $(x, y)$ corresponde a uma janela de pixels $[x \cdot \Delta x, (x+1) \cdot \Delta x] \times [y \cdot \Delta y, (y+1) \cdot \Delta y]$ da imagem original.
   - Amostra-se a luminância média:
     $$L = \frac{1}{N}\sum (0.299 \cdot R + 0.587 \cdot G + 0.114 \cdot B)$$
   - Se $L < 128$: Célula é parede sólida (`1`).
   - Se $L \ge 128$: Célula é caminho livre (`0`).
3. **Bordas de Segurança:**
   - A linha superior, linha inferior, coluna esquerda e coluna direita são forçadas para `1` (parede), exceto na célula de saída, impedindo que o jogador atravesse para fora do mapa.

---

## 5. Tratamento de Erros e Casos de Borda

- **Arquivo Inválido:** Notificação amigável se o arquivo não for uma imagem suportada.
- **Spawn Preso em Parede:** Se o usuário clicar em uma célula preta para marcar início ou saída, a célula é automaticamente desobstruída (vira `0` e o ponto correspondente).
- **Falta de Giroscópio:** Se a fase exigir giroscópio mas o dispositivo não responder ao evento (ex: desktop ou permissão recusada), o jogo oferece um atalho para alternar para o modo de botões sem travar a experiência.
- **Vitória:** Ao colidir com a célula de saída (`2`), exibe a tela de vitória com opções para reiniciar ou abrir o painel para carregar um novo labirinto.

---

## 6. Plano de Testes e Validação

1. **Teste de Imagem de Labirinto:** Upload de imagem preta e branca; verificar se as paredes são geradas fielmente.
2. **Teste de Resolução:** Mover o slider de resolução (15 a 35) e checar adaptação visual imediata.
3. **Teste de Pontos:** Marcar início e saída; confirmar que o jogador inicia na coordenada correta e avista o bloco de saída verde.
4. **Teste de Controles por Botões:** Testar rotação contínua (↺ e ↻) e avanço (⬆) tanto individualmente quanto em toques simultâneos.
5. **Teste de Giroscópio:** Testar no modo giroscópio a rotação natural do aparelho e o avanço.
6. **Teste de Ciclo de Vitória:** Encontrar a saída, ver tela de parabéns e reiniciar ou carregar outro labirinto.
