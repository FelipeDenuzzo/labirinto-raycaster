/**
 * Módulo de Processamento e Conversão de Imagens de Labirinto
 * Compatível com Node.js e Navegador (Vanilla JS).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MazeParser = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Converte array de pixels (RGBA) em uma grade 2D discretizada.
   * 1 = Parede (escuro), 0 = Caminho livre (claro).
   *
   * @param {Uint8ClampedArray|Array<number>} pixels - Buffer RGBA da imagem
   * @param {number} imgLargura - Largura original da imagem
   * @param {number} imgAltura - Altura original da imagem
   * @param {number} colunas - Quantidade de colunas desejada na grade
   * @param {number} linhas - Quantidade de linhas desejada na grade
   * @param {number} [limiarLuminosidade=128] - Limiar abaixo do qual é considerado preto/parede
   * @returns {number[][]} Matriz 2D com 0 e 1
   */
  function amostrarGrade(pixels, imgLargura, imgAltura, colunas, linhas, limiarLuminosidade = 128) {
    if (!pixels || imgLargura <= 0 || imgAltura <= 0 || colunas <= 0 || linhas <= 0) {
      throw new Error('Parâmetros inválidos para amostrarGrade');
    }

    const grade = [];

    for (let cy = 0; cy < linhas; cy++) {
      const linha = [];
      const y0 = Math.floor((cy * imgAltura) / linhas);
      const y1 = Math.max(y0 + 1, Math.floor(((cy + 1) * imgAltura) / linhas));

      for (let cx = 0; cx < colunas; cx++) {
        const x0 = Math.floor((cx * imgLargura) / colunas);
        const x1 = Math.max(x0 + 1, Math.floor(((cx + 1) * imgLargura) / colunas));

        let somaLuminosidade = 0;
        let totalAmostras = 0;

        for (let py = y0; py < y1; py++) {
          for (let px = x0; px < x1; px++) {
            const idx = (py * imgLargura + px) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            // Luminância padrão ITU-R BT.601
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            somaLuminosidade += lum;
            totalAmostras++;
          }
        }

        const mediaLum = totalAmostras > 0 ? somaLuminosidade / totalAmostras : 255;
        // Se escuro (< limiar), é parede (1), caso contrário livre (0)
        linha.push(mediaLum < limiarLuminosidade ? 1 : 0);
      }
      grade.push(linha);
    }

    return grade;
  }

  /**
   * Garante que as bordas externas da matriz sejam sólidas (1) para evitar
   * que o jogador caia fora dos limites do motor raycaster.
   *
   * @param {number[][]} matriz
   * @returns {number[][]} Nova matriz com perímetro fechado
   */
  function garantirParedesPerimetro(matriz) {
    const altura = matriz.length;
    const largura = matriz[0].length;
    const resultado = matriz.map(linha => [...linha]);

    for (let x = 0; x < largura; x++) {
      resultado[0][x] = 1;
      resultado[altura - 1][x] = 1;
    }

    for (let y = 0; y < altura; y++) {
      resultado[y][0] = 1;
      resultado[y][largura - 1] = 1;
    }

    return resultado;
  }

  /**
   * Aplica e valida os pontos de início e saída no mapa.
   * Se o ponto de início ou saída estiver sobre uma célula de parede,
   * a célula é automaticamente desobstruída para garantir jogabilidade.
   *
   * @param {number[][]} matriz
   * @param {{x: number, y: number}|null} pontoInicio
   * @param {{x: number, y: number}|null} pontoSaida
   * @returns {{ mapa: number[][], inicioValido: boolean, saidaValida: boolean }}
   */
  function aplicarPontosNoMapa(matriz, pontoInicio, pontoSaida) {
    const altura = matriz.length;
    const largura = matriz[0].length;
    const mapa = matriz.map(linha => [...linha]);

    let inicioValido = false;
    let saidaValida = false;

    if (pontoInicio && pontoInicio.x >= 0 && pontoInicio.x < largura && pontoInicio.y >= 0 && pontoInicio.y < altura) {
      mapa[pontoInicio.y][pontoInicio.x] = 0; // Desobstrui e garante spawn livre
      inicioValido = true;
    }

    if (pontoSaida && pontoSaida.x >= 0 && pontoSaida.x < largura && pontoSaida.y >= 0 && pontoSaida.y < altura) {
      mapa[pontoSaida.y][pontoSaida.x] = 2; // Bloco luminoso de saída
      saidaValida = true;
    }

    return { mapa, inicioValido, saidaValida };
  }

  return {
    amostrarGrade,
    garantirParedesPerimetro,
    aplicarPontosNoMapa
  };
}));
