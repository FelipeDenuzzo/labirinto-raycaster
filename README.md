# 📱 Labirinto Raycaster 360° Mobile

Jogo de labirinto 3D pseudo-retrô (Raycaster) otimizado para celulares em modo paisagem, onde o jogador gira o próprio corpo no eixo para olhar em 360° e avança pelo botão de toque.

## 🕹️ Como Funciona
- **Visão 360° (Giro no Próprio Eixo):** Utiliza o sensor de bússola/giroscópio (`webkitCompassHeading` no iOS e `alpha` no Android) com compensação de tela em modo paisagem.
- **Calibração de Início:** A direção em que o jogador estiver olhando ao clicar em *"ENTRAR NO LABIRINTO"* se torna o ponto zero frontal do corredor.
- **Movimento:** Botão virtual "AVANÇAR" na tela.
- **Destaque da Saída:** Bloco de saída verde/esmeralda luminoso ao final do labirinto.

## 🚀 Como Testar no Celular

Para testar no celular na mesma rede Wi-Fi:

```bash
# 1. Entre na pasta
cd /Users/felipedenuzzo/.gemini/antigravity-ide/scratch/labirinto-raycaster

# 2. Inicie um servidor local simples
npx serve -l 3000
# ou
python3 -m http.server 3000
```

Abra no navegador do celular apontando para `http://<IP_DO_SEU_MAC>:3000`.

> **Nota para iOS (Safari):** O Safari exige HTTPS para acessar a API de orientação de dispositivos (`DeviceOrientationEvent`) em endereços que não sejam `localhost`. Você pode usar `ngrok` ou similar para testar via HTTPS no iPhone:
> ```bash
> npx localtunnel --port 3000
> ```
