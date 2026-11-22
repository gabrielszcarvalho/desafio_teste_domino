const {
  Domino, gerarJogoCompleto, lerPeca, ehCarroca, valorPeca, PECAS_POR_JOGADOR,
} = require('../src/domino');

// Gerador com semente (congruencial linear de 32 bits), para embaralhar sempre igual.
function geradorComSemente(semente) {
  let s = semente >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Partida usada nos testes de jogadas: o jogador 1 tem a 6-6 e começa.
function partidaDeJogadas() {
  return new Domino({
    maos: [
      ['6-6', '6-1', '2-3', '0-4', '1-1'],
      ['6-2', '1-5', '3-4', '0-5', '2-2'],
    ],
    monte: ['0-1', '0-2'],
  });
}

// Joga sempre a primeira jogada válida; sem jogada, puxa; sem monte, passa.
function jogarAteOFim(partida) {
  for (let i = 0; i < 500 && !partida.resultado; i++) {
    const [jogada] = partida.jogadasValidas();
    if (jogada) partida.baixarPeca(jogada.peca, jogada.lado);
    else if (partida.monte.length > 0) partida.puxarDoMonte();
    else partida.passarVez();
  }
}

describe('Peças', () => {
  test('o jogo completo tem 28 peças diferentes', () => {
    const pecas = gerarJogoCompleto();
    expect(pecas).toHaveLength(28);
    expect(new Set(pecas).size).toBe(28);
  });

  test('há 7 carroças e a soma de todos os pontos é 168', () => {
    const pecas = gerarJogoCompleto();
    expect(pecas.filter(ehCarroca)).toEqual(['0-0', '1-1', '2-2', '3-3', '4-4', '5-5', '6-6']);
    expect(pecas.reduce((soma, p) => soma + valorPeca(p), 0)).toBe(168);
  });

  test('a peça pode ser escrita em qualquer ordem', () => {
    expect(lerPeca('5-2')).toEqual([2, 5]);
    expect(lerPeca('2-5')).toEqual([2, 5]);
  });

  test.each(['7-1', 'a-b', '3', '3-3-3', ''])('"%s" não é uma peça válida', (texto) => {
    expect(() => lerPeca(texto)).toThrow('Peça inválida');
  });
});

describe('Distribuição', () => {
  test('cada jogador recebe 7 peças e sobram 14 no monte', () => {
    const partida = new Domino({ aleatorio: geradorComSemente(1) });
    expect(PECAS_POR_JOGADOR).toBe(7);
    expect(partida.pecasNaMao(1)).toHaveLength(7);
    expect(partida.pecasNaMao(2)).toHaveLength(7);
    expect(partida.monte).toHaveLength(14);
  });

  test('nenhuma peça se repete e nenhuma fica de fora', () => {
    const partida = new Domino({ aleatorio: geradorComSemente(2) });
    const todas = [...partida.pecasNaMao(1), ...partida.pecasNaMao(2), ...partida.monte];
    expect([...todas].sort()).toEqual([...gerarJogoCompleto()].sort());
  });

  test('a mesma semente distribui as mesmas peças', () => {
    const a = new Domino({ aleatorio: geradorComSemente(9) });
    const b = new Domino({ aleatorio: geradorComSemente(9) });
    expect(a.pecasNaMao(1)).toEqual(b.pecasNaMao(1));
    expect(a.monte).toEqual(b.monte);
  });

  test('sem gerador informado, embaralha com o sorteio padrão', () => {
    const partida = new Domino();
    expect(partida.pecasNaMao(1)).toHaveLength(7);
  });

  test('a distribuição fixa não pode repetir peças', () => {
    expect(() => new Domino({ maos: [['6-6', '1-2'], ['2-1', '3-3']] })).toThrow('repetida');
  });

  test('pecasNaMao devolve uma cópia e só aceita os jogadores 1 e 2', () => {
    const partida = partidaDeJogadas();
    partida.pecasNaMao(1).pop();
    expect(partida.pecasNaMao(1)).toHaveLength(5);
    expect(() => partida.pecasNaMao(3)).toThrow('Jogador deve ser 1 ou 2');
  });
});

describe('Quem começa', () => {
  test('começa quem tem a 6-6, mesmo sendo o jogador 2', () => {
    const partida = new Domino({ maos: [['1-2', '3-4'], ['6-6', '0-1']] });
    expect(partida.vez).toBe(2);
    expect(partida.pecaDeAbertura).toBe('6-6');
  });

  test('sem 6-6, a maior carroça vale mais do que uma peça de soma maior', () => {
    const partida = new Domino({ maos: [['5-5', '0-1'], ['4-4', '6-5']] });
    expect(partida.vez).toBe(1);
    expect(partida.pecaDeAbertura).toBe('5-5');
  });

  test('sem carroças, começa a peça de maior soma', () => {
    const partida = new Domino({ maos: [['6-5', '0-1'], ['6-4', '2-3']] });
    expect(partida.vez).toBe(1);
    expect(partida.pecaDeAbertura).toBe('5-6');
  });

  test('com somas iguais, desempata pela maior ponta', () => {
    const partida = new Domino({ maos: [['4-5', '0-1'], ['3-6', '0-2']] });
    expect(partida.vez).toBe(2);
    expect(partida.pecaDeAbertura).toBe('3-6');
  });

  test('a primeira jogada tem que ser a peça de abertura', () => {
    const partida = partidaDeJogadas();
    expect(partida.jogadasValidas()).toEqual([{ peca: '6-6', lado: 'direita' }]);
    expect(() => partida.baixarPeca('1-6')).toThrow('deve começar com a peça 6-6');
  });
});

describe('Jogadas', () => {
  test('as peças são viradas para encaixar nas duas pontas da mesa', () => {
    const partida = partidaDeJogadas();
    partida.baixarPeca('6-6');
    partida.baixarPeca('6-2', 'direita');
    partida.baixarPeca('6-1', 'esquerda');
    expect(partida.mesaComoTexto()).toBe('[1|6][6|6][6|2]');
    expect(partida.extremidades()).toEqual([1, 2]);
  });

  test('a mesa começa vazia, sem pontas', () => {
    expect(partidaDeJogadas().extremidades()).toBeNull();
  });

  test('a vez alterna depois de cada peça baixada', () => {
    const partida = partidaDeJogadas();
    expect(partida.vez).toBe(1);
    partida.baixarPeca('6-6');
    expect(partida.vez).toBe(2);
    partida.baixarPeca('2-6');
    expect(partida.vez).toBe(1);
  });

  test('lista as jogadas válidas do jogador da vez, com o lado', () => {
    const partida = partidaDeJogadas();
    partida.baixarPeca('6-6');
    partida.baixarPeca('6-2', 'direita');
    partida.baixarPeca('6-1', 'esquerda');
    // vez do jogador 2, pontas 1 e 2
    expect(partida.jogadasValidas()).toEqual([
      { peca: '1-5', lado: 'esquerda' },
      { peca: '2-2', lado: 'direita' },
    ]);
  });

  test('uma carroça encaixa como as outras peças', () => {
    const partida = partidaDeJogadas();
    partida.baixarPeca('6-6');
    partida.baixarPeca('6-2', 'direita');
    partida.baixarPeca('6-1', 'esquerda');
    partida.baixarPeca('2-2', 'direita');
    partida.baixarPeca('1-1', 'esquerda');
    expect(partida.mesaComoTexto()).toBe('[1|1][1|6][6|6][6|2][2|2]');
  });

  test('não aceita peça que não encaixa na ponta escolhida', () => {
    const partida = partidaDeJogadas();
    partida.baixarPeca('6-6');
    expect(() => partida.baixarPeca('3-4', 'direita')).toThrow('não encaixa no 6 da direita');
    expect(() => partida.baixarPeca('3-4', 'esquerda')).toThrow('não encaixa no 6 da esquerda');
    expect(partida.pecasNaMao(2)).toContain('3-4');
  });

  test('não aceita peça que o jogador não tem', () => {
    const partida = partidaDeJogadas();
    partida.baixarPeca('6-6');
    expect(() => partida.baixarPeca('6-1')).toThrow('O jogador 2 não tem a peça 1-6');
  });

  test('não aceita lado diferente de esquerda ou direita', () => {
    const partida = partidaDeJogadas();
    expect(() => partida.baixarPeca('6-6', 'meio')).toThrow('lado');
  });
});

describe('Puxar do monte e passar a vez', () => {
  function partidaDeCompra() {
    return new Domino({
      maos: [['6-6', '0-1'], ['2-3', '4-5']],
      monte: ['1-2', '6-4', '3-5'],
    });
  }

  test('sem jogada, puxa do monte até conseguir jogar', () => {
    const partida = partidaDeCompra();
    partida.baixarPeca('6-6');
    expect(partida.jogadasValidas()).toEqual([]);
    expect(partida.puxarDoMonte()).toBe('1-2');
    expect(partida.puxarDoMonte()).toBe('4-6');
    expect(partida.pecasNaMao(2)).toEqual(['2-3', '4-5', '1-2', '4-6']);
    expect(partida.monte).toEqual(['3-5']);
  });

  test('não pode puxar quando tem jogada possível', () => {
    const partida = partidaDeCompra();
    partida.baixarPeca('6-6');
    partida.puxarDoMonte();
    partida.puxarDoMonte(); // agora tem a 4-6
    expect(() => partida.puxarDoMonte()).toThrow('não é permitido puxar');
  });

  test('não pode passar enquanto houver peças no monte', () => {
    const partida = partidaDeCompra();
    partida.baixarPeca('6-6');
    expect(() => partida.passarVez()).toThrow('puxe antes de passar');
  });

  test('não pode passar quando tem jogada possível', () => {
    const partida = partidaDeJogadas();
    partida.baixarPeca('6-6');
    expect(() => partida.passarVez()).toThrow('não é permitido passar');
  });

  test('com o monte vazio e sem jogada, passa a vez', () => {
    const partida = partidaDeCompra();
    partida.baixarPeca('6-6');
    partida.puxarDoMonte();
    partida.puxarDoMonte();
    partida.baixarPeca('4-6', 'direita');
    // jogador 1: só tem 0-1, pontas 6 e 4
    expect(partida.puxarDoMonte()).toBe('3-5');
    expect(() => partida.puxarDoMonte()).toThrow('monte está vazio');
    partida.passarVez();
    expect(partida.vez).toBe(2);
    expect(partida.resultado).toBeNull();
  });
});

describe('Fim de jogo', () => {
  test('batida: vence quem fica sem peças e ganha os pontos da mão do adversário', () => {
    const partida = new Domino({ maos: [['6-6', '6-5'], ['0-0', '1-2', '3-4']] });
    partida.baixarPeca('6-6');
    partida.passarVez();
    partida.baixarPeca('6-5');
    expect(partida.resultado).toEqual({ vencedor: 1, motivo: 'batida', pontos: 10 });
  });

  test('trancado: ninguém consegue jogar e vence quem tem menos pontos', () => {
    const partida = new Domino({ maos: [['6-6', '0-1'], ['2-3', '4-4']] });
    partida.baixarPeca('6-6');
    partida.passarVez();
    partida.passarVez();
    expect(partida.resultado).toEqual({ vencedor: 1, motivo: 'trancado', pontos: 13 });
  });

  test('trancado com pontos iguais termina empatado', () => {
    const partida = new Domino({ maos: [['6-6', '0-3'], ['1-2', '0-0']] });
    partida.baixarPeca('6-6');
    partida.passarVez();
    partida.passarVez();
    expect(partida.resultado).toEqual({ vencedor: null, motivo: 'trancado', pontos: 0 });
  });

  test('o jogador 2 também pode vencer no trancado', () => {
    const partida = new Domino({ maos: [['6-6', '5-4'], ['0-1', '2-0']] });
    partida.baixarPeca('6-6');
    partida.passarVez();
    partida.passarVez();
    expect(partida.resultado).toEqual({ vencedor: 2, motivo: 'trancado', pontos: 9 });
  });

  test('uma jogada entre dois passes zera a contagem de passes', () => {
    const partida = new Domino({ maos: [['6-6', '6-5', '0-0'], ['1-2', '3-4']] });
    partida.baixarPeca('6-6');
    partida.passarVez(); // jogador 2 passa
    partida.baixarPeca('6-5'); // jogador 1 joga
    partida.passarVez(); // jogador 2 passa de novo
    expect(partida.resultado).toBeNull();
    expect(partida.vez).toBe(1);
  });

  test('depois do fim, não há jogadas e nenhuma ação é aceita', () => {
    const partida = new Domino({ maos: [['6-6', '6-5'], ['0-0', '1-2', '3-4']] });
    partida.baixarPeca('6-6');
    partida.passarVez();
    partida.baixarPeca('6-5');
    expect(partida.jogadasValidas()).toEqual([]);
    expect(() => partida.baixarPeca('0-0')).toThrow('já terminou');
    expect(() => partida.puxarDoMonte()).toThrow('já terminou');
    expect(() => partida.passarVez()).toThrow('já terminou');
  });
});

describe('Partidas completas sorteadas', () => {
  test.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])('semente %i: a partida termina e a mesa é uma corrente válida', (semente) => {
    const partida = new Domino({ aleatorio: geradorComSemente(semente) });
    jogarAteOFim(partida);

    expect(partida.resultado).not.toBeNull();
    expect(['batida', 'trancado']).toContain(partida.resultado.motivo);

    // cada peça encosta na seguinte pelo mesmo número
    for (let i = 1; i < partida.mesa.length; i++) {
      expect(partida.mesa[i][0]).toBe(partida.mesa[i - 1][1]);
    }

    // nenhuma peça sumiu ou foi duplicada
    const naMesa = partida.mesa.map(([a, b]) => (a <= b ? `${a}-${b}` : `${b}-${a}`));
    const todas = [...naMesa, ...partida.pecasNaMao(1), ...partida.pecasNaMao(2), ...partida.monte];
    expect([...todas].sort()).toEqual([...gerarJogoCompleto()].sort());

    if (partida.resultado.motivo === 'batida') {
      expect(partida.pecasNaMao(partida.resultado.vencedor)).toHaveLength(0);
    }
  });
});
