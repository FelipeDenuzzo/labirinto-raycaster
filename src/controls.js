/**
 * Gerenciador de Controles Híbridos (Giroscópio vs Botões Virtuais)
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
     * @param {'giroscopio' | 'botoes'} modoInicial
     */
    constructor(modoInicial = 'giroscopio') {
      this.modo = modoInicial;
      this.avancando = false;
      this.girandoEsquerda = false;
      this.girandoDireita = false;
      this._listeners = [];
    }

    /**
     * Altera o modo ativo e redefine estados de movimento.
     * @param {'giroscopio' | 'botoes'} novoModo
     */
    definirModo(novoModo) {
      if (novoModo !== 'giroscopio' && novoModo !== 'botoes') {
        throw new Error('Modo inválido. Use "giroscopio" ou "botoes".');
      }
      this.modo = novoModo;
      this.avancando = false;
      this.girandoEsquerda = false;
      this.girandoDireita = false;
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
     * Calcula o novo ângulo do jogador baseado nos botões virtuais.
     * No modo giroscópio, não interfere na rotação do jogador.
     *
     * @param {number} anguloAtual - Ângulo em radianos
     * @param {number} [delta=1] - Fator de escala de tempo/frame
     * @param {number} [velocidadeGiro=0.045] - Velocidade angular em radianos/frame
     * @returns {number} Novo ângulo em radianos
     */
    atualizarAnguloJogador(anguloAtual, delta = 1, velocidadeGiro = 0.045) {
      if (this.modo !== 'botoes') {
        return anguloAtual;
      }

      let ang = anguloAtual;
      if (this.girandoEsquerda) {
        ang -= velocidadeGiro * delta;
      }
      if (this.girandoDireita) {
        ang += velocidadeGiro * delta;
      }

      // Normaliza para o intervalo [-PI, PI]
      const doisPi = Math.PI * 2;
      while (ang > Math.PI) ang -= doisPi;
      while (ang < -Math.PI) ang += doisPi;
      return ang;
    }

    /**
     * Vincula elementos DOM de botão aos eventos de toque/pointer.
     *
     * @param {HTMLElement|null} btnAvancar
     * @param {HTMLElement|null} btnGirarEsq
     * @param {HTMLElement|null} btnGirarDir
     */
    vincularBotoes(btnAvancar, btnGirarEsq, btnGirarDir) {
      this.desvincular();

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
      this.avancando = false;
      this.girandoEsquerda = false;
      this.girandoDireita = false;
    }
  }

  return {
    GerenciadorControles
  };
}));
