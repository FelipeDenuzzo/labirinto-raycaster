# 📱 Labirinto Raycaster 3D Mobile

Jogo de labirinto pseudo-3D (Raycaster) otimizado para celulares e navegadores modernos, com suporte a modos híbridos de controle (Giroscópio 360° vs Botões virtuais na tela) e módulo administrativo para conversão instantânea de imagens de labirinto em mapas jogáveis 3D.

---

## 🕹️ Modos de Controle

O jogo oferece suporte a dois esquemas de controle adaptáveis:

### 1. 🧭 Modo Giroscópio 360° (Rotação Física)
- **Como funciona:** O jogador fica em pé ou sentado e gira no próprio eixo segurando o aparelho para olhar em 360°.
- **Sensores:** Utiliza `webkitCompassHeading` no iOS e `alpha` (com compensação de orientação) no Android.
- **Movimento:** Botão único virtual **"AVANÇAR"** na parte inferior da tela.

### 2. 🕹️ Modo Botões na Tela (Controle Tátil)
- **Como funciona:** Não exige giroscópio físico. O jogador controla a navegação totalmente por 3 botões ergonômicos na base da tela:
  - `↺ GIRAR ESQUERDA`: Gira suavemente a visão no sentido anti-horário.
  - `⬆ AVANÇAR`: Caminha para a frente na direção apontada.
  - `↻ GIRAR DIREITA`: Gira suavemente a visão no sentido horário.
- **Multi-toque:** Suporte a toque contínuo simultâneo para avançar e girar ao mesmo tempo.

---

## ⚙️ Criador de Labirinto (Painel Admin)

Você pode transformar qualquer imagem de labirinto (linhas pretas com fundo branco) em um mapa jogável 3D em tempo real:

1. Na tela inicial, clique em **"⚙️ CARREGAR LABIRINTO (ADMIN)"**.
2. Toque na caixa de upload e selecione sua imagem (ex: `assets/exemplo-labirinto.png`).
3. Ajuste a resolução da grade pelo controle deslizante (**15×15 a 35×35**, padrão: 20×20).
4. Escolha o modo de controle da fase: **Giroscópio 360°** ou **Botões na Tela**.
5. No mapa de pré-visualização interativo:
   - **1º Clique:** Define o Ponto de Início (🟢 Spawn do jogador).
   - **2º Clique:** Define a Saída (🏁 Bloco verde esmeralda luminoso no labirinto).
6. Clique em **"▶️ JOGAR ESTA FASE"** para iniciar imediatamente!

---

## 🧪 Testes Automatizados

O projeto conta com testes unitários em Node.js para o módulo de amostragem de imagem e para o gerenciador de controles:

```bash
node tests/test-maze-parser.js
node tests/test-controls.js
```

---

## 🚀 Como Executar Localmente

```bash
# 1. Acesse o diretório do projeto
cd labirinto-raycaster

# 2. Inicie um servidor estático local
npx serve -l 3000
# ou
python3 -m http.server 3000
```

Abra no navegador em `http://localhost:3000` (ou no IP local da sua rede Wi-Fi pelo celular).

> **Dica para iOS (Safari):** Para testar o giroscópio físico em celulares Apple, acesse via `localhost` ou exponha através de um túnel HTTPS:
> ```bash
> npx localtunnel --port 3000
> ```
