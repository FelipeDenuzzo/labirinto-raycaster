// tests/test-maze-parser.js
const assert = require('assert');
const { amostrarGrade, garantirParedesPerimetro, aplicarPontosNoMapa } = require('../src/maze-parser');

console.log('Iniciando testes de maze-parser...');

// Teste 1: Amostragem simples de pixels em grade
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
    pixels[idx + 3] = 255; // Alpha
  }
}

const grade = amostrarGrade(pixels, largura, altura, 4, 4, 128);
assert.strictEqual(grade[0][0], 0, 'Canto deve ser livre (0)');
assert.strictEqual(grade[1][1], 1, 'Centro deve ser parede (1)');
assert.strictEqual(grade[2][2], 1, 'Centro deve ser parede (1)');
assert.strictEqual(grade[0][3], 0, 'Canto deve ser livre (0)');

// Teste 2: Fechamento perimetral de bordas
const comPerimetro = garantirParedesPerimetro(grade);
assert.strictEqual(comPerimetro[0][0], 1, 'Borda superior esquerda deve ser 1');
assert.strictEqual(comPerimetro[0][3], 1, 'Borda superior direita deve ser 1');
assert.strictEqual(comPerimetro[3][0], 1, 'Borda inferior esquerda deve ser 1');
assert.strictEqual(comPerimetro[3][3], 1, 'Borda inferior direita deve ser 1');
assert.strictEqual(comPerimetro[1][1], 1, 'Centro mantido');

// Teste 3: Aplicação de pontos de início e saída
// Caso o admin clique em cima de uma célula que era parede (1,1), ela deve ser desobstruída para 0
const { mapa, inicioValido, saidaValida } = aplicarPontosNoMapa(comPerimetro, { x: 1, y: 1 }, { x: 2, y: 2 });
assert.strictEqual(inicioValido, true, 'Início deve ser válido');
assert.strictEqual(saidaValida, true, 'Saída deve ser válida');
assert.strictEqual(mapa[1][1], 0, 'Spawn do jogador deve ser transitável (0)');
assert.strictEqual(mapa[2][2], 2, 'Saída deve ser marcada como 2');

// Teste 4: Tratamento de pontos fora dos limites
const invalidos = aplicarPontosNoMapa(comPerimetro, { x: -1, y: 10 }, { x: 2, y: 2 });
assert.strictEqual(invalidos.inicioValido, false, 'Ponto fora dos limites deve ser inválido');

console.log('✓ Todos os testes de maze-parser passaram com sucesso!');
