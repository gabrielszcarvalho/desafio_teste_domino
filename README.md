# desafio_teste_domino

Partida de dominó para 2 jogadores em JavaScript com casos de teste em JavaScript (Jest).

**Colaborador:** Gabriel Carvalho

## Especificação

- Dominó duplo-seis: 28 peças, de `0-0` a `6-6`. Cada peça pode ser escrita em qualquer ordem (`5-2` é a mesma peça que `2-5`).
- Cada jogador recebe 7 peças; as 14 que sobram formam o monte.
- **Quem começa:** quem tiver a maior carroça (peça dupla), jogando com ela. Se ninguém tiver carroça, começa quem tiver a peça de maior soma; em caso de empate na soma, vale a peça com a maior ponta.
- Na sua vez, o jogador baixa uma peça que encaixe numa das duas pontas da mesa (esquerda ou direita). A peça é virada automaticamente para encaixar.
- Se não tiver peça que encaixe, puxa do monte até conseguir jogar. Não pode puxar se tiver jogada possível.
- Com o monte vazio e sem jogada possível, passa a vez.
- **Batida:** vence quem ficar sem peças primeiro e ganha a soma dos pontos que sobraram na mão do adversário.
- **Trancado:** se os dois passarem seguidos, ninguém consegue mais jogar. Vence quem tiver menos pontos na mão e ganha os pontos do adversário; com pontos iguais, dá empate.

O jogo fica em `src/domino.js` (classe `Domino`) e os testes em `__tests__/domino.spec.js`.

## Casos de teste

A maioria dos testes monta as mãos dos jogadores à mão, para cada situação acontecer de forma previsível (quem começa, compra no monte, batida, tranca, empate). As partidas completas usam um gerador com semente para embaralhar.

O que é testado:

- peças: as 28 peças, as 7 carroças, a soma de 168 pontos e peças inválidas;
- distribuição: 7 peças para cada um, 14 no monte, nenhuma peça repetida ou faltando;
- quem começa: 6-6 com qualquer jogador, maior carroça, maior soma e desempate;
- jogadas: encaixe nas duas pontas, peça virada, carroça, vez alternando, jogadas válidas, peça que não encaixa, peça que o jogador não tem e lado inválido;
- monte: puxar até poder jogar, não puxar com jogada possível, não passar com monte cheio e passar com monte vazio;
- fim de jogo: batida, trancado com vitória de cada jogador, empate e nenhuma ação depois do fim;
- 10 partidas completas sorteadas: todas terminam, a mesa forma uma corrente válida e nenhuma peça some.

## Como rodar

Precisa do Node.js 18 ou mais novo.

```bash
npm install
```

```bash
npm test
```

Para ver a cobertura dos testes:

```bash
npm run coverage
```
