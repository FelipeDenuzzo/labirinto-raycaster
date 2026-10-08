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

// Teste 5: Modo Arrastar na Tela
ctrl.definirModo('arrastar');
assert.strictEqual(ctrl.modo, 'arrastar');

// Sem toque: parado
assert.strictEqual(ctrl.obterEstadoMovimento().avancando, false);
novoAngulo = ctrl.atualizarAnguloJogador(0, 1.0, 0.045);
assert.strictEqual(novoAngulo, 0, 'Sem arrasto não deve girar');

// Arrastar para cima: deltaY = -40, deltaX = 0 -> avança para frente
ctrl.processarVetorArraste(0, -40);
assert.strictEqual(ctrl.obterEstadoMovimento().avancando, true, 'Arrastar para cima deve acionar avanço');
novoAngulo = ctrl.atualizarAnguloJogador(0, 1.0, 0.045);
assert.strictEqual(novoAngulo, 0, 'Arrasto reto para cima não deve girar');

// Arrastar para a direita: deltaY = 0, deltaX = 50 -> gira para direita
ctrl.processarVetorArraste(50, 0);
assert.strictEqual(ctrl.obterEstadoMovimento().avancando, false, 'Arrasto lateral não avança');
novoAngulo = ctrl.atualizarAnguloJogador(0, 1.0, 0.045);
assert.ok(novoAngulo > 0, 'Arrastar para a direita deve girar para a direita');

// Arrastar para a esquerda: deltaY = 0, deltaX = -50 -> gira para esquerda
ctrl.processarVetorArraste(-50, 0);
novoAngulo = ctrl.atualizarAnguloJogador(0, 1.0, 0.045);
assert.ok(novoAngulo < 0, 'Arrastar para a esquerda deve girar para a esquerda');

// Arrastar na diagonal (cima + direita): avança e gira simultaneamente
ctrl.processarVetorArraste(45, -35);
assert.strictEqual(ctrl.obterEstadoMovimento().avancando, true, 'Diagonal para cima deve avançar');
novoAngulo = ctrl.atualizarAnguloJogador(0, 1.0, 0.045);
assert.ok(novoAngulo > 0, 'Diagonal para a direita deve girar');

// Soltar o dedo: deve zerar todos os movimentos
ctrl.finalizarArraste();
assert.strictEqual(ctrl.obterEstadoMovimento().avancando, false, 'Soltar o dedo deve parar o avanço');
novoAngulo = ctrl.atualizarAnguloJogador(0, 1.0, 0.045);
assert.strictEqual(novoAngulo, 0, 'Soltar o dedo deve parar a rotação');

console.log('✓ Todos os testes de controls passaram com sucesso!');

