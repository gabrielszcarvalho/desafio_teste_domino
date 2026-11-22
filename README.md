# desafio_teste_domino

Partida de dominó para 2 jogadores em JavaScript com casos de teste em JavaScript (Jest).

## Colaborador

- Gabriel Carvalho | RA: 24027655-2

## Especificação

- Dominó duplo-seis: 28 peças, de `0-0` a `6-6`. Cada peça pode ser escrita em qualquer ordem (`5-2` é a mesma peça que `2-5`).
- Cada jogador recebe 7 peças; as 14 que sobram formam o monte.
- **Quem começa:** quem tiver a maior carroça (peça dupla), jogando com ela. Se ninguém tiver carroça, começa quem tiver a peça de maior soma; em caso de empate na soma, vale a peça com a maior ponta.
- Na sua vez, o jogador baixa uma peça que encaixe numa das duas pontas da mesa (esquerda ou direita). A peça é virada automaticamente para encaixar.
- Se não tiver peça que encaixe, puxa do monte até conseguir jogar. Não pode puxar se tiver jogada possível.
- Com o monte vazio e sem jogada possível, passa a vez.
- **Batida:** vence quem ficar sem peças primeiro e ganha a soma dos pontos que sobraram na mão do adversário.
- **Trancado:** se os dois passarem seguidos, ninguém consegue mais jogar. Vence quem tiver menos pontos na mão e ganha os pontos do adversário; com pontos iguais, dá empate.

## Contrato da implementação

O jogo fica em `src/domino.js` (CommonJS) e é importado nos testes com `require('../src/domino')`:

```js
module.exports = { Domino, gerarJogoCompleto, lerPeca, ehCarroca, valorPeca, PECAS_POR_JOGADOR };
```

- As peças são textos no formato `'menor-maior'`, como `'2-5'`. Onde o jogo recebe uma peça, aceita também a ordem invertida (`'5-2'`).
- `PECAS_POR_JOGADOR`: `7`.
- `gerarJogoCompleto()`: as 28 peças, de `'0-0'` a `'6-6'`.
- `lerPeca(peca)`: `[menor, maior]`. Texto que não é peça: mensagem com `"Peça inválida"`.
- `ehCarroca(peca)`: `true` para peças duplas.
- `valorPeca(peca)`: soma dos dois lados.

### `new Domino(opcoes?)`

Sem opções, embaralha as peças, dá 7 para cada jogador e deixa 14 no monte. Opções:

- `aleatorio`: função que devolve um número entre 0 e 1, usada para embaralhar (padrão: `Math.random`);
- `maos` e `monte`: distribuição fixa, no formato `maos: [[peças do jogador 1], [peças do jogador 2]]` e `monte: [peças]`. Peça repetida: mensagem com `"repetida"`.

### Propriedades

- `vez`: jogador da vez (`1` ou `2`), começando por quem tem a peça de abertura;
- `pecaDeAbertura`: a peça que deve abrir a partida;
- `monte`: lista de peças, na ordem em que serão puxadas;
- `mesa`: peças na mesa, em ordem e já viradas, como `[[1, 6], [6, 6], [6, 2]]`;
- `resultado`: `null` durante a partida e, no fim, `{ vencedor, motivo, pontos }`, com `vencedor` igual a `1`, `2` ou `null` (empate) e `motivo` igual a `'batida'` ou `'trancado'`.

### Métodos

- `pecasNaMao(jogador)`: cópia da lista de peças do jogador.
- `pontosNaMao(jogador)`: soma dos pontos das peças na mão.
- `extremidades()`: `[esquerda, direita]` das pontas da mesa, ou `null` com a mesa vazia.
- `jogadasValidas()`: lista de `{ peca, lado }` que o jogador da vez pode baixar.
- `baixarPeca(peca, lado = 'direita')`: baixa a peça na ponta `'esquerda'` ou `'direita'`.
- `puxarDoMonte()`: puxa a primeira peça do monte e devolve qual foi.
- `passarVez()`: passa a vez (só com o monte vazio e sem jogada possível).
- `mesaComoTexto()`: a mesa no formato `[1|6][6|6][6|2]`.

Erros dos métodos (mensagens contêm o trecho entre aspas):

- jogador diferente de 1 e 2: `"Jogador deve ser 1 ou 2"`;
- primeira peça diferente da de abertura: `"deve começar com a peça <peça>"`;
- peça que o jogador não tem: `"não tem a peça"`; peça que não encaixa: `"não encaixa"`; lado inválido: `"lado"`;
- puxar com jogada possível: `"não é permitido puxar"`; monte vazio: `"monte está vazio"`;
- passar com jogada possível: `"não é permitido passar"`; passar com peças no monte: `"puxe antes de passar"`;
- qualquer ação depois do fim: `"já terminou"`.

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

São 48 casos de teste. Uma implementação correta deve terminar com `Tests: 48 passed, 48 total`.

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
