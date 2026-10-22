import { computed, reactive } from 'vue';
import { config, modoAtual } from './config.js';

/**
 * O tutorial, um por TELA. Nasceu no Sócrates, teve os furos corrigidos no Duo
 * (16/10/2026) e ganhou anel e véu por token no USI (22/10/2026); este pacote
 * parte da versão do USI. Mesmos nomes de função das três cópias: nome
 * diferente para a mesma coisa é o defeito mais caro da casa.
 *
 * Estado de MÓDULO, não de componente: o layout remonta a cada navegação, e o
 * módulo ES vive uma vez só por carga de página — quem importa enxerga o
 * mesmo estado.
 *
 * Pular e concluir marcam visto IGUALMENTE. Tour que volta sozinho porque a
 * pessoa pulou é o mesmo que não ter botão de pular.
 */
const state = reactive({
    active: false,
    pageKey: null,
    stepIndex: 0,
    // Tela esperando a navegação terminar para começar — a tela que lista
    // todos os tutoriais pede o de outra tela e navega até lá.
    pendingPageKey: null,
});

// `localStorage` pode não existir (aba anônima com o armazenamento bloqueado):
// sem memória, o tour só deixa de abrir sozinho — nunca quebra a tela.
function marcarVisto() {
    try {
        localStorage.setItem(config.chaveVisto, '1');
    } catch {
        // sem memória, sem problema
    }
}

export function tourCompleted() {
    try {
        return localStorage.getItem(config.chaveVisto) === '1';
    } catch {
        return true;
    }
}

export function esquecerVisto() {
    try {
        localStorage.removeItem(config.chaveVisto);
    } catch {
        // idem
    }
}

/**
 * Os passos de uma tela no modo atual. Um passo pode existir só num modo
 * (`modo: 'aprender'`) e pode ter um texto por modo
 * (`text: { aprender, auxiliar }`): no USI, o texto da avaliação deixa de
 * falar em avaliação depois que a imobiliária assina.
 */
export function stepsFor(pageKey, modo = modoAtual()) {
    const brutos = (pageKey && config.passos[pageKey]) || [];

    return brutos
        .filter((passo) => ! passo.modo || passo.modo === modo)
        .map((passo) => ({
            ...passo,
            text: typeof passo.text === 'object' && passo.text !== null
                ? (passo.text[modo] ?? passo.text.aprender ?? '')
                : passo.text,
        }));
}

export function hasTour(pageKey) {
    return stepsFor(pageKey).length > 0;
}

export function useTour() {
    const steps = computed(() => stepsFor(state.pageKey));
    const currentStep = computed(() => (state.active ? steps.value[state.stepIndex] ?? null : null));
    const isFirstStep = computed(() => state.stepIndex === 0);
    const isLastStep = computed(() => state.stepIndex === steps.value.length - 1);
    const stepNumber = computed(() => state.stepIndex + 1);
    const totalSteps = computed(() => steps.value.length);

    function start(pageKey) {
        if (! hasTour(pageKey)) return;
        state.pageKey = pageKey;
        state.stepIndex = 0;
        state.active = true;
    }

    /**
     * Abre sozinho, se for a hora: modo aprender e ainda não visto. No modo
     * auxiliar o tutorial NUNCA abre sozinho — fica no botão de ajuda.
     */
    function startIfFirstTime(pageKey) {
        if (modoAtual() !== 'aprender' || tourCompleted()) return false;
        start(pageKey);

        return state.active;
    }

    function finish() {
        state.active = false;
        state.pageKey = null;
        state.stepIndex = 0;
        marcarVisto();
    }

    // O último passo não fecha sozinho: o TourOverlay mostra o resumo antes
    // de chamar `finish()`.
    function next() {
        if (isLastStep.value) return;
        state.stepIndex++;
    }

    function prev() {
        if (isFirstStep.value) return;
        state.stepIndex--;
    }

    function requestStart(pageKey) {
        state.pendingPageKey = pageKey;
    }

    function consumePendingStart(currentPageKey) {
        if (state.pendingPageKey && state.pendingPageKey === currentPageKey) {
            state.pendingPageKey = null;
            start(currentPageKey);
        }
    }

    return {
        state, steps, currentStep, isFirstStep, isLastStep, stepNumber, totalSteps,
        start, startIfFirstTime, next, prev, skip: finish, finish, requestStart, consumePendingStart,
    };
}
