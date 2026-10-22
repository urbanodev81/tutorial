<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { TourOverlay, esquecerVisto, hasTour, tourCompleted, useTour } from '@urbanodev/tutorial';
import { modo, navegar, tela } from './estado.js';

const { start, startIfFirstTime } = useTour();

const escuro = ref(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
watch(escuro, (v) => document.documentElement.classList.toggle('dark', v), { immediate: true });

const menuAberto = ref(false);
const visto = ref(tourCompleted());

const telas = [
    { chave: 'painel', rotulo: 'Painel' },
    { chave: 'chamados', rotulo: 'Chamados' },
];

const chamados = [
    { numero: 1042, titulo: 'Impressora da recepção não imprime', empresa: 'Clínica Horizonte', prazo: 'estourado', quando: 'há 2 h' },
    { numero: 1045, titulo: 'Notebook do financeiro não liga', empresa: 'Contábil Ribeiro', prazo: 'atencao', quando: 'em 1 h' },
    { numero: 1047, titulo: 'Sem acesso ao e-mail', empresa: 'Clínica Horizonte', prazo: 'seguro', quando: 'em 6 h' },
    { numero: 1048, titulo: 'Troca de toner', empresa: 'Escola Caminho', prazo: 'seguro', quando: 'amanhã' },
];

const rotuloDoPrazo = { estourado: 'Estourado', atencao: 'Perto de vencer', seguro: 'No prazo' };

const busca = ref('');
const filtrados = computed(() =>
    chamados.filter((c) => `${c.numero} ${c.titulo}`.toLowerCase().includes(busca.value.toLowerCase())),
);

function ir(chave) {
    menuAberto.value = false;
    navegar(chave);
}

function abrirSozinhoNoPainel() {
    if (tela.value === 'painel') nextTick(() => startIfFirstTime('painel'));
}

// O que um sistema real faz ao carregar: no modo aprender, a primeira visita
// ao painel abre o tutorial. No auxiliar, `startIfFirstTime` nunca abre.
onMounted(abrirSozinhoNoPainel);

function simularPrimeiroAcesso() {
    esquecerVisto();
    visto.value = false;
    navegar('painel');
    abrirSozinhoNoPainel();
}

// Pular ou concluir marca "visto"; a etiqueta da barra acompanha.
const { currentStep } = useTour();
watch(currentStep, () => (visto.value = tourCompleted()));
</script>

<template>
    <div class="demo">
        <aside class="lateral" :class="{ aberta: menuAberto }" data-tour="menu" aria-label="Navegação">
            <p class="marca">Central de chamados</p>
            <nav>
                <button
                    v-for="t in telas"
                    :key="t.chave"
                    type="button"
                    class="item"
                    :aria-current="tela === t.chave ? 'page' : undefined"
                    @click="ir(t.chave)"
                >
                    {{ t.rotulo }}
                </button>
            </nav>
        </aside>

        <div class="corpo">
            <header class="topo">
                <button
                    type="button"
                    class="icone so-celular"
                    data-tour="menu"
                    :aria-expanded="menuAberto"
                    aria-label="Abrir menu"
                    @click="menuAberto = !menuAberto"
                >
                    ☰
                </button>
                <h1>{{ telas.find((t) => t.chave === tela).rotulo }}</h1>
                <button
                    v-if="hasTour(tela)"
                    type="button"
                    class="icone"
                    data-tour="ajuda"
                    aria-label="Ver o tutorial desta tela"
                    title="Tutorial desta tela"
                    @click="start(tela)"
                >
                    ?
                </button>
                <button
                    type="button"
                    class="icone"
                    :aria-label="escuro ? 'Usar tema claro' : 'Usar tema escuro'"
                    @click="escuro = !escuro"
                >
                    {{ escuro ? '☀' : '☾' }}
                </button>
            </header>

            <section class="controles" aria-labelledby="controles-titulo">
                <h2 id="controles-titulo">Demonstração do <code>@urbanodev/tutorial</code></h2>
                <p>
                    Um sistema fictício de chamados. Troque o modo e veja o mesmo tutorial mudar de texto e de
                    passos; no <strong>aprender</strong> ele abre sozinho no primeiro acesso, no
                    <strong>auxiliar</strong> só pelo botão <strong>?</strong> do topo.
                </p>
                <div class="linha">
                    <fieldset>
                        <legend>Modo</legend>
                        <label><input v-model="modo" type="radio" value="aprender" /> Aprender</label>
                        <label><input v-model="modo" type="radio" value="auxiliar" /> Auxiliar</label>
                    </fieldset>
                    <button type="button" class="botao" @click="simularPrimeiroAcesso">Simular primeiro acesso</button>
                    <span class="etiqueta" role="status">{{ visto ? 'Tutorial já visto' : 'Ainda não visto' }}</span>
                </div>
                <p class="nota">
                    <a href="https://github.com/urbanodev81/tutorial">Código no GitHub</a> · Vue 3 · sem dependência
                    além do Vue
                </p>
            </section>

            <main v-if="tela === 'painel'" class="conteudo">
                <section class="indicadores" data-tour="indicadores" aria-label="Chamados abertos por prazo">
                    <div class="cartao">
                        <p class="numero seguro">12</p>
                        <p>No prazo</p>
                    </div>
                    <div class="cartao">
                        <p class="numero atencao">3</p>
                        <p>Perto de vencer</p>
                    </div>
                    <div class="cartao">
                        <p class="numero estourado">1</p>
                        <p>Estourado</p>
                    </div>
                </section>

                <div class="espaco" aria-hidden="true"></div>

                <section data-tour="fila" aria-labelledby="fila-titulo">
                    <h2 id="fila-titulo">Prazo mais apertado</h2>
                    <ul class="lista">
                        <li v-for="c in chamados.slice(0, 3)" :key="c.numero">
                            <span class="ponto" :class="c.prazo" aria-hidden="true"></span>
                            <span class="texto">
                                <strong>#{{ c.numero }} {{ c.titulo }}</strong>
                                <span>{{ c.empresa }} · vence {{ c.quando }}</span>
                            </span>
                            <span class="sr-only">— {{ rotuloDoPrazo[c.prazo] }}</span>
                        </li>
                    </ul>
                </section>
            </main>

            <main v-else class="conteudo">
                <label for="busca" class="sr-only">Buscar chamados</label>
                <input
                    id="busca"
                    v-model="busca"
                    data-tour="busca"
                    type="search"
                    class="campo"
                    placeholder="Buscar por número ou título"
                />
                <ul class="lista" data-tour="lista">
                    <li v-for="c in filtrados" :key="c.numero">
                        <span class="ponto" :class="c.prazo" aria-hidden="true"></span>
                        <span class="texto">
                            <strong>#{{ c.numero }} {{ c.titulo }}</strong>
                            <span>{{ c.empresa }} · {{ rotuloDoPrazo[c.prazo] }}</span>
                        </span>
                    </li>
                    <li v-if="filtrados.length === 0" class="vazio">Nenhum chamado encontrado.</li>
                </ul>
            </main>
        </div>

        <TourOverlay />
    </div>
</template>

<style>
.demo {
    min-height: 100vh;
}

.lateral {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 40;
    width: 220px;
    padding: 20px 12px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    transition: transform 0.2s;
}

.marca {
    margin: 0 8px 20px;
    font-weight: 700;
}

.item {
    display: block;
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--fg-muted);
    font: inherit;
    text-align: left;
    cursor: pointer;
}

.item[aria-current='page'] {
    background: var(--surface-sunken);
    color: var(--fg);
    font-weight: 600;
}

.corpo {
    margin-left: 220px;
}

.topo {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 64px;
    padding: 0 24px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
}

.topo h1 {
    flex: 1;
    margin: 0;
    font-size: 18px;
}

.icone {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--border-input);
    border-radius: 8px;
    background: var(--surface);
    color: var(--fg);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
}

.so-celular {
    display: none;
}

.controles {
    margin: 24px;
    padding: 20px;
    border: 1px dashed var(--border-input);
    border-radius: 12px;
    background: var(--surface);
}

.controles h2 {
    margin: 0 0 8px;
    font-size: 16px;
}

.controles p {
    margin: 0 0 12px;
    color: var(--fg-muted);
}

.linha {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
}

fieldset {
    display: flex;
    gap: 16px;
    margin: 0;
    padding: 4px 12px 8px;
    border: 1px solid var(--border);
    border-radius: 8px;
}

legend {
    padding: 0 4px;
    color: var(--fg-subtle);
    font-size: 13px;
}

fieldset label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    cursor: pointer;
}

.botao {
    min-height: 44px;
    padding: 0 16px;
    border: 0;
    border-radius: 8px;
    background: var(--accent);
    color: var(--fg-on-accent);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
}

.botao:hover {
    background: var(--accent-hover);
}

.etiqueta {
    color: var(--fg-subtle);
    font-size: 13px;
}

.nota {
    margin: 12px 0 0 !important;
    font-size: 13px;
}

.nota a {
    color: var(--accent);
}

.conteudo {
    padding: 0 24px 48px;
}

.indicadores {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.cartao {
    padding: 16px 20px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface);
}

.cartao p {
    margin: 0;
    color: var(--fg-muted);
}

.cartao .numero {
    font-size: 32px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.numero.seguro { color: var(--success); }
.numero.atencao { color: var(--warning); }
.numero.estourado { color: var(--danger); }

/* Empurra a fila para baixo da dobra: o tutorial rola até o alvo. */
.espaco {
    height: 70vh;
}

.conteudo h2 {
    font-size: 15px;
}

.lista {
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface);
}

.lista li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
}

.lista li + li {
    border-top: 1px solid var(--border);
}

.ponto {
    flex: none;
    width: 10px;
    height: 10px;
    margin-top: 6px;
    border-radius: 50%;
}

.ponto.seguro { background: var(--success); }
.ponto.atencao { background: var(--warning); }
.ponto.estourado { background: var(--danger); }

.texto {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.texto span {
    color: var(--fg-muted);
    font-size: 13px;
}

.vazio {
    color: var(--fg-muted);
}

.campo {
    width: 100%;
    max-width: 360px;
    min-height: 44px;
    margin-bottom: 16px;
    padding: 0 12px;
    border: 1px solid var(--border-input);
    border-radius: 8px;
    background: var(--surface);
    color: var(--fg);
    font: inherit;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}

@media (max-width: 767px) {
    /* Fechada, a faixa sai da tela E da ordem do Tab: sem o `visibility`,
       o teclado e o leitor de tela continuariam alcançando links invisíveis. */
    .lateral {
        transform: translateX(-100%);
        visibility: hidden;
        transition: transform 0.2s, visibility 0.2s;
    }

    .lateral.aberta {
        transform: none;
        visibility: visible;
    }

    .corpo {
        margin-left: 0;
    }

    .so-celular {
        display: inline-grid;
    }

    .topo {
        padding: 0 16px;
    }

    .controles {
        margin: 16px;
    }

    .conteudo {
        padding: 0 16px 48px;
    }

    .indicadores {
        grid-template-columns: 1fr;
    }
}
</style>
