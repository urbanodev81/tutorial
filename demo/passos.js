/*
 * Os passos de um sistema fictício de chamados. Mostram o que o pacote
 * oferece: texto por modo, passo que só existe num modo, balão no centro
 * (`selector: null`) e um alvo que não existe — o tutorial não quebra, o
 * balão vai para o centro (e o `tutorial-conferir` do CI acusaria).
 */
export const titulos = {
    painel: 'Painel',
    chamados: 'Chamados',
};

export const passos = {
    painel: [
        {
            selector: null,
            title: 'Bem-vindo',
            text: {
                aprender: 'Você está avaliando o sistema. Em um minuto mostramos onde fica cada coisa.',
                auxiliar: 'O painel resume a fila do dia.',
            },
        },
        {
            selector: '[data-tour="menu"]',
            title: 'O menu',
            text: 'As telas ficam aqui. No celular, o menu vira o botão do topo — o tutorial aponta o que estiver visível.',
        },
        {
            selector: '[data-tour="indicadores"]',
            title: 'Indicadores',
            text: 'Os chamados abertos, pelo prazo: no prazo, perto de vencer e estourados.',
        },
        {
            selector: '[data-tour="fila"]',
            title: 'Prazo mais apertado',
            text: 'Os que vencem primeiro. Abaixo da dobra? O tutorial rola até lá.',
        },
        {
            selector: '[data-tour="alvo-que-sumiu"]',
            title: 'Alvo ausente',
            text: 'Este passo aponta para um elemento que não existe. Em vez de quebrar, o balão vem para o centro.',
        },
        {
            selector: '[data-tour="ajuda"]',
            title: 'Ajuda',
            text: {
                aprender: 'O tutorial não volta sozinho. Para rever, é por este botão.',
                auxiliar: 'Cada tela tem o seu tutorial, sempre por este botão.',
            },
        },
        {
            selector: null,
            title: 'Antes de assinar',
            text: 'Este passo só existe no modo aprender: some quando o cliente deixa de estar em avaliação.',
            modo: 'aprender',
        },
    ],
    chamados: [
        {
            selector: '[data-tour="busca"]',
            title: 'Busca',
            text: 'Pelo número ou por uma palavra do título.',
        },
        {
            selector: '[data-tour="lista"]',
            title: 'A lista',
            text: 'Cada tela tem o seu tutorial: este é o da lista de chamados.',
        },
    ],
};
