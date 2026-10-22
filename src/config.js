import { reactive } from 'vue';

/**
 * A configuração do tutorial, uma por aplicação. O pacote não sabe nada do
 * projeto: os passos, o nome da chave de "visto", como descobrir a tela atual
 * e como ouvir a navegação chegam daqui (ver README, "Instalar").
 *
 * Reativa e de MÓDULO, como o estado do tour: o layout remonta a cada
 * navegação, e o módulo ES vive uma vez só por carga de página.
 */
export const config = reactive({
    // { [tela]: [{ selector, title, text }] } — o formato do `tourSteps.js`.
    passos: {},
    // { [tela]: 'Título da tela' } — aparece no resumo.
    titulos: {},
    // Uma chave só por projeto: pular ou concluir QUALQUER tela marca visto.
    chaveVisto: 'tutorial-visto',
    // () => chave da tela atual, ou null. Em Inertia, o `usePageKey.js`.
    resolverTela: () => null,
    // (avisar) => desinscrever. Chamado a cada navegação terminada; em
    // Inertia, `(f) => router.on('finish', f)`.
    aoNavegar: null,
    // { superficieAberta, reivindicar, liberar } — o `useSuperficieExclusiva`
    // do projeto: uma superfície flutuante aberta por vez. Sem ele, o tour só não fecha quando outra
    // superfície abre.
    superficie: null,
    // 'aprender': abre sozinho uma vez e fala como orientação.
    // 'auxiliar': só pelo botão de ajuda, e o texto de cada passo pode mudar.
    // Pode ser uma função, para quem decide por usuário (a avaliação do USI).
    modo: 'aprender',
    // O formato das variáveis de tema do projeto: 'inteira' (`--surface:
    // #fff`) ou 'canais' (`--surface: 255 255 255`, o do Tailwind com
    // `rgb(var(--x) / <alpha-value>)`). Errar aqui deixa o balão sem fundo.
    cores: 'inteira',
    // A régua de z-index é do projeto: o tutorial fica acima da gaveta
    // lateral e abaixo do toast e da confirmação.
    zIndex: 100,
    // () => void — mostra "Ver todos os tutoriais" no resumo. Sem ela, o botão
    // não aparece: botão para lugar nenhum é pior que botão nenhum.
    aoVerTodos: null,
    textos: {},
});

export const TEXTOS_PADRAO = {
    passo: (n, total) => `Passo ${n} de ${total}`,
    arraste: 'Arraste',
    arrasteTitulo: 'Arraste para mover o balão',
    pular: 'Pular tutorial',
    anterior: 'Anterior',
    proximo: 'Próximo',
    concluir: 'Concluir',
    sairTitulo: 'Sair do tutorial?',
    sairTexto: 'Ele não volta sozinho. Para ver de novo, use o botão de ajuda no topo da tela.',
    continuar: 'Continuar',
    sair: 'Sair do tutorial',
    resumoTitulo: 'Tutorial concluído',
    resumoVisto: 'O que você viu:',
    resumoOutras: 'Outras telas têm o tutorial delas: procure o botão de ajuda (?) no topo.',
    fechar: 'Fechar',
    verDeNovo: 'Ver este tutorial de novo',
    verTodos: 'Ver todos os tutoriais',
};

export function configurarTutorial(opcoes = {}) {
    const { textos, ...resto } = opcoes;
    Object.assign(config, resto);
    if (textos) config.textos = { ...config.textos, ...textos };

    return config;
}

export function texto(nome) {
    return config.textos[nome] ?? TEXTOS_PADRAO[nome];
}

export function modoAtual() {
    const modo = typeof config.modo === 'function' ? config.modo() : config.modo;

    return modo === 'auxiliar' ? 'auxiliar' : 'aprender';
}
