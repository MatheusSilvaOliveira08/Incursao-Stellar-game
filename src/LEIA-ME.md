# Incursão Stellar

Jogo estilo *Space Invaders*. Abra esta pasta no VS Code (Arquivo > Abrir Pasta).
Para rodar, sirva a pasta com um servidor local (ex.: extensão **Live Server**) e
abra o `index.html`. É necessário um servidor porque o jogo usa módulos ES
(`<script type="module">`), que não funcionam abrindo o arquivo direto pelo `file://`.

## Controles
- **A** / **D** — mover a nave
- **Espaço** — atirar

## Naves do jogador
1. Nave 1 — tiro simples, velocidade normal.
2. Nave 2 — movimento horizontal mais rápido.
3. Nave 3 — mesma velocidade da nave 2, mas o tiro se divide em dois.

A evolução acontece resgatando astronautas que caem na tela:
- 1º astronauta cai **após a fase 2** (nave 1 → nave 2).
- 2º astronauta cai **após a fase 4** (nave 2 → nave 3).
Se o astronauta cair fora da tela, o upgrade é perdido.
Ao trocar de nave, há uma curta animação de transição (a nave "pula" com anéis de energia se expandindo).

## Barra de vida
A vida é feita de astronautas. O jogo já começa com o **astronauta inicial**, que é
o **1º ponto** da barra. Os dois astronautas resgatados são o 2º e o 3º ponto.
- Início: 1 vida (astronauta inicial visível na barra). Um único tiro inimigo = game over.
- Com 1 astronauta resgatado: 2 vidas (2 tiros para perder).
- Com 2 astronautas resgatados: 3 vidas (3 tiros para perder).

Os ícones aparecem no canto superior esquerdo, em ordem: astronauta inicial,
depois o 1º resgatado, depois o 2º. Ao levar um tiro, o ícone da direita some
(dano), mas a nave **não regride** de forma. Quando resta só o astronauta inicial
e o jogador é atingido, é game over.

## Inimigos por fase
| Fase | Inimigo | Quantidade | Observação |
|------|---------|-----------|------------|
| 1 | Inimigo 1 | 2 x 5 (10) | tiro simples |
| 2 | Inimigo 1 | 3 x 6 (18) | mais inimigos que a fase 1 |
| 3 | Inimigo 2 | 2 x 6 (12) | movimento mais rápido |
| 4 | Inimigo 2 | 3 x 7 (21) | mais inimigos que a fase 3 |
| 5 | Inimigo 3 | 1 x 4 (4)  | tiro em leque (padrão diferente) |
| 6 | Inimigo 3 | 1 x 6 (6)  | tiro em leque |
| 7 | Inimigo 4 | 1 x 3 (3)  | mais rápido, tiro em leque, **2 vidas cada** |
| 8 | Inimigo 4 | 1 x 4 (4)  | fase final — concluí-la vence o jogo |

Concluir a fase 8 vence o jogo.
Os números de linhas/colunas, velocidades e padrões ficam em
`src/utils/constants.js` (objetos `ENEMY_TYPES` e `PHASES`), fáceis de ajustar.

## Vitória e ranking
O jogo termina ao concluir a **fase 8** (a última, definida em `FINAL_LEVEL`).
Ao vencer, aparece uma tela de vitória com animação (fogos no fundo + título
brilhante) e uma **tabela de ranking** comparando esta partida com as anteriores,
destacando a linha da partida atual.

As partidas (vitórias e derrotas) são salvas no navegador via `localStorage`
(chave `incursao-stellar-ranking`), então o histórico persiste entre sessões no
mesmo navegador. Para zerar o ranking, limpe o armazenamento do site ou rode no
console: `localStorage.removeItem("incursao-stellar-ranking")`.

Ao **perder**, a tela de Game Over mostra **Restart** e, abaixo, **Ranking**. O
botão Ranking abre a mesma tabela (sem a animação de vitória), com um **Restart**
no rodapé.

## Estrutura
```
incursao-stellar/
├── index.html
├── .editorconfig
└── src/
    ├── index.js
    ├── style.css
    ├── classes/
    │   ├── Astronaut.js
    │   ├── Grid.js
    │   ├── Invader.js
    │   ├── Obstacle.js
    │   ├── Particle.js
    │   ├── Player.js
    │   ├── Projectile.js
    │   ├── SoundEffects.js
    │   └── Star.js
    ├── utils/
    │   └── constants.js
    └── assets/
        ├── images/   (sprites já incluídos)
        └── audios/   (shoot, hit, explosion, next_level — já incluídos)
```

## Observação sobre as imagens
Os sprites em `src/assets/images/` já estão com **fundo transparente** (o fundo
roxo/preto original e as molduras finas das bordas foram removidos), prontos para
aparecer recortados sobre o cenário. A imagem `exemplo_nave.png` (na raiz) é a nave
que você enviou como exemplo, também já recortada — não é usada pelo jogo.
