'use strict';

const PECAS_POR_JOGADOR = 7;

// As 28 peças do dominó duplo-seis, no formato 'menor-maior': '0-0', '0-1', ..., '6-6'.
function gerarJogoCompleto() {
  const pecas = [];
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) pecas.push(`${a}-${b}`);
  }
  return pecas;
}

function lerPeca(peca) {
  const m = /^([0-6])-([0-6])$/.exec(peca);
  if (!m) throw new Error(`Peça inválida: "${peca}"`);
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a <= b ? [a, b] : [b, a];
}

function normalizar(peca) {
  return lerPeca(peca).join('-');
}

function ehCarroca(peca) {
  const [a, b] = lerPeca(peca);
  return a === b;
}

function valorPeca(peca) {
  const [a, b] = lerPeca(peca);
  return a + b;
}

function embaralhar(lista, aleatorio) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

class Domino {
  // Sem opções: embaralha e distribui 7 peças para cada jogador; o resto vira o monte.
  // `maos` e `monte` permitem montar uma distribuição fixa (usado nos testes).
  constructor({ aleatorio = Math.random, maos = null, monte = null } = {}) {
    if (maos) {
      this.maos = { 1: maos[0].map(normalizar), 2: maos[1].map(normalizar) };
      this.monte = (monte || []).map(normalizar);
      validarDistribuicao([...this.maos[1], ...this.maos[2], ...this.monte]);
    } else {
      const pecas = embaralhar(gerarJogoCompleto(), aleatorio);
      this.maos = {
        1: pecas.slice(0, PECAS_POR_JOGADOR),
        2: pecas.slice(PECAS_POR_JOGADOR, 2 * PECAS_POR_JOGADOR),
      };
      this.monte = pecas.slice(2 * PECAS_POR_JOGADOR);
    }

    this.mesa = []; // peças em ordem, já viradas: [[6, 6], [6, 3], [3, 1]]
    this.passesSeguidos = 0;
    this.resultado = null;
    const abertura = this.#definirAbertura();
    this.vez = abertura.jogador;
    this.pecaDeAbertura = abertura.peca;
  }

  pecasNaMao(jogador) {
    validarJogador(jogador);
    return [...this.maos[jogador]];
  }

  pontosNaMao(jogador) {
    validarJogador(jogador);
    return this.maos[jogador].reduce((soma, peca) => soma + valorPeca(peca), 0);
  }

  extremidades() {
    if (this.mesa.length === 0) return null;
    return [this.mesa[0][0], this.mesa[this.mesa.length - 1][1]];
  }

  // Jogadas possíveis para o jogador da vez: [{ peca, lado }]
  jogadasValidas() {
    if (this.resultado) return [];
    if (this.mesa.length === 0) return [{ peca: this.pecaDeAbertura, lado: 'direita' }];
    const [esquerda, direita] = this.extremidades();
    const jogadas = [];
    for (const peca of this.maos[this.vez]) {
      const [a, b] = lerPeca(peca);
      if (a === esquerda || b === esquerda) jogadas.push({ peca, lado: 'esquerda' });
      if (a === direita || b === direita) jogadas.push({ peca, lado: 'direita' });
    }
    return jogadas;
  }

  baixarPeca(peca, lado = 'direita') {
    this.#exigirPartidaEmAndamento();
    const normalizada = normalizar(peca);
    if (lado !== 'esquerda' && lado !== 'direita') {
      throw new Error('O lado deve ser "esquerda" ou "direita"');
    }
    const mao = this.maos[this.vez];
    if (!mao.includes(normalizada)) throw new Error(`O jogador ${this.vez} não tem a peça ${normalizada}`);

    const [a, b] = lerPeca(normalizada);
    if (this.mesa.length === 0) {
      if (normalizada !== this.pecaDeAbertura) {
        throw new Error(`A partida deve começar com a peça ${this.pecaDeAbertura}`);
      }
      this.mesa.push([a, b]);
    } else {
      const [esquerda, direita] = this.extremidades();
      if (lado === 'direita') {
        if (a === direita) this.mesa.push([a, b]);
        else if (b === direita) this.mesa.push([b, a]);
        else throw new Error(`A peça ${normalizada} não encaixa no ${direita} da direita`);
      } else if (b === esquerda) {
        this.mesa.unshift([a, b]);
      } else if (a === esquerda) {
        this.mesa.unshift([b, a]);
      } else {
        throw new Error(`A peça ${normalizada} não encaixa no ${esquerda} da esquerda`);
      }
    }

    mao.splice(mao.indexOf(normalizada), 1);
    this.passesSeguidos = 0;
    if (mao.length === 0) {
      this.#encerrar(this.vez, 'batida');
    } else {
      this.#trocarVez();
    }
  }

  // Sem jogada possível, o jogador puxa uma peça do monte. Retorna a peça puxada.
  puxarDoMonte() {
    this.#exigirPartidaEmAndamento();
    if (this.jogadasValidas().length > 0) throw new Error('Há jogada possível: não é permitido puxar');
    if (this.monte.length === 0) throw new Error('O monte está vazio');
    const peca = this.monte.shift();
    this.maos[this.vez].push(peca);
    return peca;
  }

  // Sem jogada possível e com o monte vazio, o jogador passa a vez.
  passarVez() {
    this.#exigirPartidaEmAndamento();
    if (this.jogadasValidas().length > 0) throw new Error('Há jogada possível: não é permitido passar');
    if (this.monte.length > 0) throw new Error('Ainda há peças no monte: puxe antes de passar');
    this.passesSeguidos++;
    if (this.passesSeguidos === 2) {
      // jogo trancado: vence quem tem menos pontos na mão
      const p1 = this.pontosNaMao(1);
      const p2 = this.pontosNaMao(2);
      this.#encerrar(p1 === p2 ? null : p1 < p2 ? 1 : 2, 'trancado');
    } else {
      this.#trocarVez();
    }
  }

  mesaComoTexto() {
    return this.mesa.map(([a, b]) => `[${a}|${b}]`).join('');
  }

  // Quem tem a maior carroça começa com ela; sem carroças, quem tem a peça de maior soma.
  #definirAbertura() {
    const candidatas = [1, 2].flatMap((jogador) => this.maos[jogador].map((peca) => ({ jogador, peca })));
    const peso = ({ peca }) => (ehCarroca(peca) ? 100 : 0) + valorPeca(peca) * 2 + lerPeca(peca)[1] / 10;
    return candidatas.reduce((melhor, atual) => (peso(atual) > peso(melhor) ? atual : melhor));
  }

  #encerrar(vencedor, motivo) {
    let pontos = 0;
    if (vencedor !== null) pontos = this.pontosNaMao(vencedor === 1 ? 2 : 1);
    this.resultado = { vencedor, motivo, pontos };
  }

  #trocarVez() {
    this.vez = this.vez === 1 ? 2 : 1;
  }

  #exigirPartidaEmAndamento() {
    if (this.resultado) throw new Error('A partida já terminou');
  }
}

function validarJogador(jogador) {
  if (jogador !== 1 && jogador !== 2) throw new Error('Jogador deve ser 1 ou 2');
}

function validarDistribuicao(pecas) {
  const vistas = new Set();
  for (const peca of pecas) {
    if (vistas.has(peca)) throw new Error(`Peça repetida na distribuição: ${peca}`);
    vistas.add(peca);
  }
}

module.exports = {
  Domino, gerarJogoCompleto, lerPeca, ehCarroca, valorPeca, PECAS_POR_JOGADOR,
};
