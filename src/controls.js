/**
 * Gerenciador de Controles Híbridos (Giroscópio vs Botões Virtuais vs Arrastar na Tela)
 * Compatível com Node.js e Navegador.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ControlsManager = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class GerenciadorControles {
    /**
     * @param {'giroscopio' | 'botoes' | 'arrastar'} modoInicial
     */
    constructor(modoInicial = 'giroscopio') {
      this.modo = modoInicial;
      this.avancando = false;
      this.girandoEsquerda = false;
      this.girandoDireita = false;
      this.intensidadeGiro = 1.0;
      this._listeners = [];
      this.origemArraste = null;
    }

    /**
     * Altera o modo ativo e redefine estados de movimento.
     * @param {'giroscopio' | 'botoes' | 'arrastar'} novoModo
     */
    definirModo(novoModo) {
      if (novoModo !== 'giroscopio' && novoModo !== 'botoes' && novoModo !== 'arrastar') {
        throw new Error('Modo inválido. Use "giroscopio", "botoes" ou "arrastar".');
      }
      this.modo = novoModo;
      this.finalizarArraste();
    }

    setAvancando(ativo) {
      this.avancando = Boolean(ativo);
    }

    setGirandoEsquerda(ativo) {
      this.girandoEsquerda = Boolean(ativo);
    }

    setGirandoDireita(ativo) {
      this.girandoDireita = Boolean(ativo);
    }

    obterEstadoMovimento() {
      return {
        avancando: this.avancando,
        girandoEsquerda: this.girandoEsquerda,
        girandoDireita: this.girandoDireita
      };
    }

    /**
     * Processa deslocamento do dedo (deltaX, deltaY) em pixels.
     * - deltaY negativo (arrastar para cima) => Avançar
     * - deltaX positivo (arrastar para direita) => Girar Direita
     * - deltaX negativo (arrastar para esquerda) => Girar Esquerda
     *
     * @param {number} deltaX
     * @param {number} deltaY
     * @param {number} [deadzone=18] - Raio neutro aumentado para dar firmeza e evitar tremores
     */
    processarVetorArraste(deltaX, deltaY, deadzone = 18) {
      if (this.modo !== 'arrastar') return;

      // Avançar ao puxar para cima (com curso firme)
      if (deltaY < -deadzone) {
        this.avancando = true;
      } else {
        this.avancando = false;
      }

      // Girar para os lados com resposta densa, ponderada e progressiva
      const absX = Math.abs(deltaX);
      if (absX > deadzone) {
        // Normaliza de 0 a 1 ao longo de um deslocamento suave de 60px
        const progresso = Math.min(1.0, (absX - deadzone) / 55);
        // Curva exponencial suave (evita solavancos bruscos, resposta muito mais densa)
        const intensidade = Math.pow(progresso, 1.25) * 0.85;

        if (deltaX > 0) {
          this.girandoDireita = true;
          this.girandoEsquerda = false;
        } else {
          this.girandoEsquerda = true;
          this.girandoDireita = false;
        }
        this.intensidadeGiro = intensidade;
      } else {
        this.girandoDireita = false;
        this.girandoEsquerda = false;
        this.intensidadeGiro = 0;
      }
    }

    /**
     * Finaliza o toque de arraste e zera todos os movimentos.
     */
    finalizarArraste() {
      this.avancando = false;
      this.girandoEsquerda = false;
      this.girandoDireita = false;
      this.intensidadeGiro = 0;
      this.origemArraste = null;
    }

    /**
     * Calcula o novo ângulo do jogador baseado nos botões ou no arraste.
     * No modo giroscópio, não interfere na rotação do jogador.
     *
     * @param {number} anguloAtual - Ângulo em radianos
     * @param {number} [delta=1] - Fator de escala de tempo/frame
     * @param {number} [velocidadeGiro=0.045] - Velocidade angular em radianos/frame
     * @returns {number} Novo ângulo em radianos
     */
    atualizarAnguloJogador(anguloAtual, delta = 1, velocidadeGiro = 0.045) {
      if (this.modo !== 'botoes' && this.modo !== 'arrastar') {
        return anguloAtual;
      }

      let ang = anguloAtual;
      // No modo arrastar, aplica velocidade angular mais densa e ponderada
      const velBase = (this.modo === 'arrastar') ? 0.036 : velocidadeGiro;
      const mult = (this.modo === 'arrastar') ? (this.intensidadeGiro || 0) : 1.0;

      if (this.girandoEsquerda) {
        ang -= velBase * delta * mult;
      }
      if (this.girandoDireita) {
        ang += velBase * delta * mult;
      }

      // Normaliza para o intervalo [-PI, PI]
      const doisPi = Math.PI * 2;
      while (ang > Math.PI) ang -= doisPi;
      while (ang < -Math.PI) ang += doisPi;
      return ang;
    }

    /**
     * Vincula a área de toque e o anel indicador tátil para o modo Arrastar.
     *
     * @param {HTMLElement} areaToque - Ex: canvas ou div do jogo
     * @param {HTMLElement} [indicadorBase] - Container do anel visual
     * @param {HTMLElement} [indicadorPonto] - Ponto central do joystick
     */
    vincularArraste(areaToque, indicadorBase, indicadorPonto) {
      if (!areaToque) return;

      const onPointerDown = (e) => {
        if (this.modo !== 'arrastar') return;
        e.preventDefault();

        this.origemArraste = { x: e.clientX, y: e.clientY };

        if (indicadorBase) {
          indicadorBase.style.left = `${e.clientX}px`;
          indicadorBase.style.top = `${e.clientY}px`;
          indicadorBase.style.display = 'block';
          indicadorBase.style.opacity = '1';
        }
        if (indicadorPonto) {
          indicadorPonto.style.transform = 'translate(-50%, -50%)';
        }
      };

      const onPointerMove = (e) => {
        if (this.modo !== 'arrastar' || !this.origemArraste) return;
        e.preventDefault();

        const dx = e.clientX - this.origemArraste.x;
        const dy = e.clientY - this.origemArraste.y;

        this.processarVetorArraste(dx, dy);

        // Feedback visual do botão analógico
        if (indicadorPonto) {
          const maxRaio = 36;
          const dist = Math.hypot(dx, dy);
          const ang = Math.atan2(dy, dx);
          const r = Math.min(dist, maxRaio);
          const px = Math.cos(ang) * r;
          const py = Math.sin(ang) * r;
          indicadorPonto.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
        }
      };

      const onPointerUp = (e) => {
        if (this.modo !== 'arrastar') return;
        this.finalizarArraste();

        if (indicadorBase) {
          indicadorBase.style.display = 'none';
          indicadorBase.style.opacity = '0';
        }
      };

      areaToque.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);

      this._listeners.push(
        { el: areaToque, ev: 'pointerdown', fn: onPointerDown },
        { el: window, ev: 'pointermove', fn: onPointerMove },
        { el: window, ev: 'pointerup', fn: onPointerUp },
        { el: window, ev: 'pointercancel', fn: onPointerUp }
      );
    }

    /**
     * Vincula elementos DOM de botão aos eventos de toque/pointer para o modo Botões.
     */
    vincularBotoes(btnAvancar, btnGirarEsq, btnGirarDir) {
      const vincularPressionar = (elemento, aoPressionar) => {
        if (!elemento) return;

        const onDown = (e) => {
          e.preventDefault();
          aoPressionar(true);
          elemento.classList.add('pressionado');
        };

        const onUp = (e) => {
          e.preventDefault();
          aoPressionar(false);
          elemento.classList.remove('pressionado');
        };

        elemento.addEventListener('pointerdown', onDown);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);

        this._listeners.push(
          { el: elemento, ev: 'pointerdown', fn: onDown },
          { el: window, ev: 'pointerup', fn: onUp },
          { el: window, ev: 'pointercancel', fn: onUp }
        );
      };

      if (btnAvancar) {
        vincularPressionar(btnAvancar, (ativo) => this.setAvancando(ativo));
      }
      if (btnGirarEsq) {
        vincularPressionar(btnGirarEsq, (ativo) => this.setGirandoEsquerda(ativo));
      }
      if (btnGirarDir) {
        vincularPressionar(btnGirarDir, (ativo) => this.setGirandoDireita(ativo));
      }
    }

    desvincular() {
      for (const item of this._listeners) {
        item.el.removeEventListener(item.ev, item.fn);
      }
      this._listeners = [];
      this.finalizarArraste();
    }
  }

  return {
    GerenciadorControles
  };
}));
