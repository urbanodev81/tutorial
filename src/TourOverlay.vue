<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { config, texto } from './config.js';
import { useTour } from './useTour.js';
import TourSummaryModal from './TourSummaryModal.vue';

/**
 * O balão do tutorial e o holofote. Acha o alvo por `data-tour`, mede,
 * escurece o resto com um `box-shadow` gigante e põe o balão do lado que tiver
 * espaço.
 *
 * O que as três cópias foram aprendendo e vem junto: Esc, foco no balão e
 * `aria-modal`, como toda superfície flutuante da casa; alvo invisível conta como ausente (vale o primeiro
 * `data-tour` VISÍVEL — o menu lateral no celular existe no DOM, fora da tela);
 * rola até o alvo abaixo da dobra; sair pelo véu confirma dentro do próprio
 * balão, em vez de empilhar outra confirmação por cima; anel e véu numa sombra
 * só, por token.
 *
 * COR SÓ POR VARIÁVEL DE TEMA: o pacote não escreve tinta nenhuma.
 * O projeto declara `--surface`, `--fg`, `--accent`… e o tema escuro vem de
 * graça, porque as variáveis mudam com a classe `.dark`.
 *
 * A rolagem do fundo NÃO é travada, de propósito: o tour precisa rolar até o
 * alvo, e quem lê o balão às vezes quer ver o resto da tela.
 */
const {
    state, steps, currentStep, isFirstStep, isLastStep, stepNumber, totalSteps,
    start, next, prev, finish, consumePendingStart,
} = useTour();

const menosMovimento = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const balao = ref(null);
const confirmandoSaida = ref(false);
const rect = reactive({ top: 0, left: 0, width: 0, height: 0, found: false });
let retryTimer = null;
let retriesLeft = 0;

function visivel(el) {
    const box = el.getBoundingClientRect();

    return box.width > 0 && box.height > 0 && box.right > 0 && box.left < window.innerWidth
        && getComputedStyle(el).visibility !== 'hidden';
}

function measure(rolar = false) {
    const selector = currentStep.value?.selector;

    if (! selector) {
        rect.found = false;

        return;
    }

    const el = Array.from(document.querySelectorAll(selector)).find(visivel);

    if (! el) {
        // A página pode ainda estar montando logo depois da navegação: tenta
        // por ~1s antes de cair no balão centralizado, sem holofote. Nunca
        // trava, nunca some.
        if (retriesLeft > 0) {
            retriesLeft--;
            retryTimer = setTimeout(() => measure(rolar), 50);
        } else {
            rect.found = false;
        }

        return;
    }

    let box = el.getBoundingClientRect();

    if (rolar && (box.top < 0 || box.bottom > window.innerHeight)) {
        // `block: 'center'` deixa espaço acima ou abaixo para o balão. O
        // `scroll` que isso dispara mede de novo.
        el.scrollIntoView({ block: box.height > window.innerHeight * 0.6 ? 'start' : 'center', behavior: menosMovimento ? 'auto' : 'smooth' });
        box = el.getBoundingClientRect();
    }

    rect.top = box.top;
    rect.left = box.left;
    rect.width = box.width;
    rect.height = box.height;
    rect.found = true;
}

function remeasure(rolar = false) {
    clearTimeout(retryTimer);
    retriesLeft = 20;
    measure(rolar === true);
}

const padding = 8;

const spotlightStyle = computed(() => ({
    top: `${rect.top - padding}px`,
    left: `${rect.left - padding}px`,
    width: `${rect.width + padding * 2}px`,
    height: `${rect.height + padding * 2}px`,
}));

// A posição "natural" do balão. Nunca ancora com `translateY(-100%)`: isso
// pendura o balão pela borda de baixo sem saber a altura do texto, e com alvo
// grande ele crescia para fora da tela (o defeito do Terminal no Sócrates).
const basePosition = computed(() => {
    if (! rect.found) {
        return { top: '50%', left: '50%', centered: true };
    }

    const margin = 12;
    const largura = Math.min(320, window.innerWidth - 32);
    const left = `${Math.min(Math.max(rect.left, 16), window.innerWidth - largura - 16)}px`;
    const spaceAbove = rect.top - padding - margin;
    const spaceBelow = window.innerHeight - (rect.top + rect.height + padding) - margin;
    const minComfortable = 160;

    if (spaceBelow >= minComfortable) {
        return { top: `${rect.top + rect.height + padding + 12}px`, left, maxHeight: `${spaceBelow}px` };
    }

    if (spaceAbove >= minComfortable) {
        return { bottom: `${window.innerHeight - (rect.top - padding - 12)}px`, left, maxHeight: `${spaceAbove}px` };
    }

    // Sem espaço confortável dos dois lados (alvo do tamanho da tela): o
    // balão aterra no rodapé, em vez de posição negativa.
    return { bottom: `${margin}px`, left, maxHeight: '45vh' };
});

// Arraste manual pela alça — soma por cima da posição natural e zera a cada
// passo novo, porque o alvo mudou e o deslocamento antigo não vale mais.
const dragOffset = reactive({ x: 0, y: 0 });
let dragging = false;
let dragStart = { x: 0, y: 0, offsetX: 0, offsetY: 0 };
// O `pointerup` de um arraste costuma terminar em cima do véu, e o navegador
// sintetiza um clique ali — que pediria para sair sem ninguém ter pedido.
let justDragged = false;

function onDragStart(event) {
    dragging = true;
    dragStart = { x: event.clientX, y: event.clientY, offsetX: dragOffset.x, offsetY: dragOffset.y };
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragEnd);
}

function onDragMove(event) {
    if (! dragging) return;
    dragOffset.x = dragStart.offsetX + (event.clientX - dragStart.x);
    dragOffset.y = dragStart.offsetY + (event.clientY - dragStart.y);
}

function onDragEnd() {
    if (! dragging) return;
    dragging = false;
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragEnd);
    justDragged = true;
    setTimeout(() => { justDragged = false; }, 50);
}

const tooltipStyle = computed(() => {
    const { centered, ...position } = basePosition.value;
    const centerTransform = centered ? 'translate(-50%, -50%) ' : '';

    return { ...position, transform: `${centerTransform}translate(${dragOffset.x}px, ${dragOffset.y}px)` };
});

watch(() => [state.active, state.stepIndex], ([ativo]) => {
    dragOffset.x = 0;
    dragOffset.y = 0;
    confirmandoSaida.value = false;

    if (! ativo) {
        config.superficie?.liberar('tour');

        return;
    }

    config.superficie?.reivindicar('tour');
    // O holofote do passo anterior não pode ficar parado no alvo errado
    // enquanto este procura o dele (até ~1s, se o alvo demora ou não existe).
    // A medição roda antes da pintura: com alvo presente, não pisca.
    rect.found = false;
    nextTick(() => {
        remeasure(true);
        // Leitor de tela e teclado acompanham o passo: o foco vai para o
        // balão, que anuncia o título pelo `aria-labelledby`.
        balao.value?.focus({ preventScroll: true });
    });
}, { immediate: true });

// Outra superfície abriu (menu da conta, gaveta do celular): o tour fecha,
// em vez de ficar por cima dela com o holofote no lugar errado.
//
// ⚠️ `null` NÃO é outra superfície. O Inertia dispara `navigate` também na
// primeira carga, e o registro zera nele — o tour que abre sozinho no Início
// fechava no mesmo instante, e ainda ficava marcado como visto (USI, 22/10).
watch(() => config.superficie?.superficieAberta, (dono) => {
    if (state.active && dono && dono !== 'tour') {
        finish();
    }
});

function aoTeclar(event) {
    if (event.key !== 'Escape' || ! state.active) return;
    event.preventDefault();
    finish();
}

let desinscrever = null;

onMounted(() => {
    const tela = config.resolverTela();

    // O tour é de UMA tela. O layout remonta a cada navegação: se a tela
    // mudou com o tour aberto, os alvos da anterior não existem mais aqui.
    if (state.active && tela !== state.pageKey) {
        finish();
    }

    consumePendingStart(tela);

    window.addEventListener('resize', remeasure);
    window.addEventListener('scroll', remeasure, true);
    window.addEventListener('keydown', aoTeclar);
    // Filtro e paginação que não remontam o layout trocam o conteúdo por
    // baixo do holofote; navegação que troca de tela sem remontar fecha.
    desinscrever = config.aoNavegar?.(() => {
        if (! state.active) return;
        if (config.resolverTela() !== state.pageKey) {
            finish();

            return;
        }
        nextTick(remeasure);
    }) ?? null;
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', remeasure);
    window.removeEventListener('scroll', remeasure, true);
    window.removeEventListener('keydown', aoTeclar);
    onDragEnd();
    clearTimeout(retryTimer);
    if (typeof desinscrever === 'function') desinscrever();
});

// Clicar no véu é fácil de fazer sem querer: pergunta antes, dentro do
// balão. "Pular tutorial", que é ação explícita e rotulada, sai direto.
function pedirSaida() {
    if (justDragged) return;
    confirmandoSaida.value = true;
}

// O resumo guarda tudo ANTES de `finish()`, que zera a tela do tour.
const showSummary = ref(false);
const summary = reactive({ pageKey: null, screenTitle: '', stepTitles: [] });

function complete() {
    summary.pageKey = state.pageKey;
    summary.screenTitle = config.titulos[state.pageKey] ?? '';
    summary.stepTitles = steps.value.map((step) => step.title);
    finish();
    showSummary.value = true;
}

function restartFromSummary() {
    showSummary.value = false;
    start(summary.pageKey);
}

function verTodos() {
    showSummary.value = false;
    config.aoVerTodos?.();
}
</script>

<template>
    <Teleport to="body">
        <div v-if="state.active && currentStep" class="tt-camada" :class="{ 'tt-canais': config.cores === 'canais' }" :style="{ zIndex: config.zIndex }">
            <div
                class="tt-fundo"
                :class="{ 'tt-fundo--veu': !rect.found }"
                aria-hidden="true"
                data-tutorial="veu"
                @click="pedirSaida"
            ></div>

            <div v-if="rect.found" class="tt-holofote" :style="spotlightStyle" aria-hidden="true" data-tutorial="holofote"></div>

            <div
                ref="balao"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tour-titulo"
                aria-describedby="tour-texto"
                tabindex="-1"
                class="tt-balao"
                :style="tooltipStyle"
            >
                <div class="tt-alca" style="touch-action: none" :title="texto('arrasteTitulo')" aria-hidden="true" @pointerdown="onDragStart">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                        <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
                        <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
                        <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
                    </svg>
                    <span>{{ texto('arraste') }}</span>
                </div>

                <template v-if="!confirmandoSaida">
                    <p class="tt-rotulo" aria-live="polite">{{ texto('passo')(stepNumber, totalSteps) }}</p>
                    <h3 id="tour-titulo" class="tt-titulo">{{ currentStep.title }}</h3>
                    <p id="tour-texto" class="tt-texto">{{ currentStep.text }}</p>

                    <!-- Rodapé preso no balão: com alvo alto no celular o balão
                         rola por dentro, e o "Próximo" não pode rolar junto. -->
                    <div class="tt-rodape">
                        <button type="button" class="tt-botao tt-botao--leve" @click="finish">{{ texto('pular') }}</button>
                        <div class="tt-grupo">
                            <button v-if="!isFirstStep" type="button" class="tt-botao tt-botao--borda" @click="prev">{{ texto('anterior') }}</button>
                            <button type="button" class="tt-botao tt-botao--primario" @click="isLastStep ? complete() : next()">
                                {{ isLastStep ? texto('concluir') : texto('proximo') }}
                            </button>
                        </div>
                    </div>
                </template>

                <template v-else>
                    <h3 id="tour-titulo" class="tt-titulo">{{ texto('sairTitulo') }}</h3>
                    <p id="tour-texto" class="tt-texto">{{ texto('sairTexto') }}</p>
                    <div class="tt-rodape tt-rodape--fim">
                        <button type="button" class="tt-botao tt-botao--borda" @click="confirmandoSaida = false">{{ texto('continuar') }}</button>
                        <button type="button" class="tt-botao tt-botao--primario" @click="finish">{{ texto('sair') }}</button>
                    </div>
                </template>
            </div>
        </div>
    </Teleport>

    <TourSummaryModal
        :show="showSummary"
        :screen-title="summary.screenTitle"
        :steps="summary.stepTitles"
        :pode-ver-todos="Boolean(config.aoVerTodos)"
        @restart="restartFromSummary"
        @go-tours="verTodos"
        @close="showSummary = false"
    />
</template>

<style>
/* Sem `scoped`: o Teleport leva o balão para o <body>, e o prefixo `tt-` já
   isola.

   As cores chegam do tema do projeto em um de dois formatos (`cores` na
   configuração): cor inteira (`--surface: #fff`) ou canais do Tailwind
   (`--surface: 255 255 255`). As regras abaixo só leem `--tt-*`; é aqui, e só
   aqui, que o formato se resolve. O valor depois da vírgula é a rede de
   segurança de quem ainda não declarou o token, não a cor de ninguém. */
.tt-camada {
    position: fixed; inset: 0; font: inherit;
    --tt-surface: var(--surface-raised, var(--surface, #fff));
    --tt-overlay: var(--overlay, rgb(0 0 0 / .55));
    --tt-surface-sunken: var(--surface-sunken, #f3f4f6);
    --tt-fg-muted: var(--fg-muted, #374151);
    --tt-fg-subtle: var(--fg-subtle, #4b5563);
    --tt-fg-on-accent: var(--fg-on-accent, #fff);
    --tt-fg: var(--fg, #111827);
    --tt-border-input: var(--border-input, #6b7280);
    --tt-border: var(--border, #e5e7eb);
    --tt-accent-hover: var(--accent-hover, #1e40af);
    --tt-accent-ring: var(--accent-ring, currentColor);
    --tt-accent: var(--accent, #1d4ed8);
    --tt-success-subtle: var(--success-subtle, #dcfce7);
    --tt-success: var(--success, #166534);
}
.tt-camada.tt-canais {
    --tt-surface: rgb(var(--surface-raised, var(--surface, 255 255 255)));
    --tt-overlay: rgb(var(--overlay, 0 0 0) / .6);
    --tt-surface-sunken: rgb(var(--surface-sunken, 243 244 246));
    --tt-fg-muted: rgb(var(--fg-muted, 55 65 81));
    --tt-fg-subtle: rgb(var(--fg-subtle, 75 85 99));
    --tt-fg-on-accent: rgb(var(--fg-on-accent, 255 255 255));
    --tt-fg: rgb(var(--fg, 17 24 39));
    --tt-border-input: rgb(var(--border-input, 107 114 128));
    --tt-border: rgb(var(--border, 229 231 235));
    --tt-accent-hover: rgb(var(--accent-hover, 30 64 175));
    --tt-accent-ring: rgb(var(--accent-ring, 29 78 216));
    --tt-accent: rgb(var(--accent, 29 78 216));
    --tt-success-subtle: rgb(var(--success-subtle, 220 252 231));
    --tt-success: rgb(var(--success, 22 101 52));
}
.tt-fundo { position: absolute; inset: 0; }
.tt-fundo--veu { background: var(--tt-overlay); }
.tt-holofote {
    position: absolute;
    pointer-events: none;
    border-radius: 8px;
    /* O anel e o véu numa sombra só: anel feito com `ring` também é
       box-shadow, e a sombra inline o apagava. */
    box-shadow: 0 0 0 2px var(--tt-accent-ring), 0 0 0 9999px var(--tt-overlay);
}
@media (prefers-reduced-motion: no-preference) {
    .tt-holofote { transition: all .2s ease; }
}
.tt-balao {
    position: absolute;
    box-sizing: border-box;
    width: 20rem;
    max-width: calc(100vw - 2rem);
    overflow-y: auto;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid var(--tt-border);
    background: var(--tt-surface);
    color: var(--tt-fg);
    box-shadow: 0 25px 50px -12px rgb(0 0 0 / .25);
    text-align: left;
}
.tt-balao:focus { outline: none; }
.tt-alca {
    display: flex; width: fit-content; align-items: center; gap: 4px;
    margin: -4px -4px 8px; padding: 4px 6px; border-radius: 6px;
    cursor: grab; user-select: none;
    color: var(--tt-fg-subtle);
    font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
}
.tt-alca:hover { color: var(--tt-fg); }
.tt-alca:active { cursor: grabbing; }
.tt-rotulo {
    margin: 0 0 6px;
    color: var(--tt-accent);
    font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
}
.tt-titulo { margin: 0 0 6px; font-size: 18px; font-weight: 700; line-height: 1.25; color: var(--tt-fg); }
.tt-texto { margin: 0; font-size: 14px; line-height: 1.6; color: var(--tt-fg-muted); }
.tt-rodape {
    position: sticky; bottom: -20px;
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px;
    margin: 16px -20px -20px; padding: 8px 20px 20px;
    background: var(--tt-surface);
}
.tt-rodape--fim { justify-content: flex-end; }
/* Com fonte larga (a do sistema, sem a do projeto), "Pular" + "Anterior" +
   "Próximo" passam dos 20rem: o rodapé quebra a linha e o grupo fica à
   direita, em vez de vazar e fazer o balão rolar de lado. */
.tt-grupo { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.tt-botao {
    min-height: 44px; padding: 0 12px; border-radius: 6px;
    font: inherit; font-size: 14px; font-weight: 600; white-space: nowrap;
    cursor: pointer; border: 1px solid transparent; background: none;
}
.tt-botao:focus-visible { outline: 2px solid var(--tt-accent-ring); outline-offset: 2px; }
.tt-botao--leve { padding: 0 4px; color: var(--tt-fg-subtle); }
.tt-botao--leve:hover { color: var(--tt-fg); }
.tt-botao--borda { border-color: var(--tt-border-input); color: var(--tt-fg); }
.tt-botao--borda:hover { background: var(--tt-surface-sunken); }
/* A primária é da marca OU neutro-escuro, conforme a identidade de cada
   produto: o Sócrates aponta `--tutorial-primaria` para o neutro. */
.tt-botao--primario {
    padding: 0 16px;
    background: var(--tutorial-primaria, var(--tt-accent));
    color: var(--tutorial-primaria-texto, var(--tt-fg-on-accent));
}
.tt-botao--primario:hover { background: var(--tutorial-primaria-hover, var(--tt-accent-hover)); }
</style>
