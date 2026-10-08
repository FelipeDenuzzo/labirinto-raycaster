// tests/test-controls.js
const assert = require('assert');
const { GerenciadorControles } = require('../src/controls');

console.log('Iniciando testes de controls...');

// Teste 1: Instanciação e modo padrão
const ctrl = new GerenciadorControles('giroscopio');
assert.strictEqual(ctrl.modo, 'giroscopio');

// Teste 2: Alternância de modo
ctrl.definirModo('botoes');
assert.strictEqual(ctrl.modo, 'botoes');

// Teste 3: Rotação no modo botões
// Estado inicial de rotação deve ser neutro
assert.strictEqual(ctrl.obterEstadoMovimento().girandoEsquerda, false);
assert.strictEqual(ctrl.obterEstadoMovimento().girandoDireita, false);

// Simula toque no botão de girar esquerda
ctrl.setGirandoEsquerda(true);
assert.strictEqual(ctrl.obterEstadoMovimento().girandoEsquerda, true);

// Ângulo inicial 0; girar para esquerda deve subtrair ângulo
let novoAngulo = ctrl.atualizarAnguloJogador(0, 1.0, 0.05); // angulo, deltaFrames, velocidade
assert.ok(novoAngulo < 0, 'Girar esquerda deve reduzir o ângulo');

// Reset e girar direita
ctrl.setGirandoEsquerda(false);
ctrl.setGirandoDireita(true);
novoAngulo = ctrl.atualizarAnguloJogador(0, 1.0, 0.05);
assert.ok(novoAngulo > 0, 'Girar direita deve aumentar o ângulo');

// Teste 4: No modo giroscópio, a rotação por botões não se aplica
ctrl.definirModo('giroscopio');
ctrl.setGirandoDireita(true);
novoAngulo = ctrl.atualizarAnguloJogador(0, 1.0, 0.05);
assert.strictEqual(novoAngulo, 0, 'Modo giroscópio não rotaciona com botões virtuais');

console.log('✓ Todos os testes de controls passaram com sucesso!');
