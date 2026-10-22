<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { config, texto } from './config.js';

/**
 * O resumo ao concluir um tour — o que a pessoa acabou de ver, em lista, e o
 * caminho para ver de novo. "Ver todos os tutoriais" só aparece quando o
 * projeto tem a tela que lista todos (`aoVerTodos` na configuração).
 */
const props = defineProps({
    show: Boolean,
    screenTitle: { type: String, default: '' },
    steps: { type: Array, default: () => [] },
    podeVerTodos: Boolean,
});
const emit = defineEmits(['restart', 'close', 'go-tours']);

const caixa = ref(null);

watch(() => props.show, (aberto) => {
    if (aberto) nextTick(() => caixa.value?.focus());
});

function aoTeclar(event) {
    if (props.show && event.key === 'Escape') emit('close');
}

onMounted(() => window.addEventListener('keydown', aoTeclar));
onBeforeUnmount(() => window.removeEventListener('keydown', aoTeclar));
</script>

<template>
    <Teleport to="body">
        <div v-if="show" class="tt-camada tt-resumo" :style="{ zIndex: config.zIndex }">
            <div class="tt-fundo tt-fundo--veu tt-fundo--desfoque" aria-hidden="true" @click="emit('close')"></div>

            <div ref="caixa" role="dialog" aria-modal="true" aria-labelledby="tour-resumo-titulo" tabindex="-1" class="tt-caixa">
                <div class="tt-selo" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                    </svg>
                </div>

                <h3 id="tour-resumo-titulo" class="tt-titulo tt-titulo--grande">
                    {{ texto('resumoTitulo') }}<template v-if="screenTitle"> — {{ screenTitle }}</template>
                </h3>
                <p class="tt-texto tt-espaco">{{ texto('resumoVisto') }}</p>

                <ul class="tt-lista">
                    <li v-for="(titulo, i) in steps" :key="i">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                        {{ titulo }}
                    </li>
                </ul>

                <p class="tt-texto tt-espaco">{{ texto('resumoOutras') }}</p>

                <div class="tt-pilha">
                    <button type="button" class="tt-botao tt-botao--primario" @click="emit('close')">{{ texto('fechar') }}</button>
                    <button type="button" class="tt-botao tt-botao--borda" @click="emit('restart')">{{ texto('verDeNovo') }}</button>
                    <button v-if="podeVerTodos" type="button" class="tt-botao tt-botao--leve" @click="emit('go-tours')">{{ texto('verTodos') }}</button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style>
.tt-resumo { display: flex; align-items: center; justify-content: center; padding: 16px; }
.tt-fundo--desfoque { backdrop-filter: blur(4px); }
.tt-caixa {
    position: relative;
    box-sizing: border-box;
    width: 100%; max-width: 28rem; max-height: 85vh; overflow-y: auto;
    padding: 24px; border-radius: 8px;
    border: 1px solid var(--border, #e5e7eb);
    background: var(--surface-raised, var(--surface, #fff));
    color: var(--fg, #111827);
    box-shadow: 0 25px 50px -12px rgb(0 0 0 / .25);
    text-align: left;
}
.tt-caixa:focus { outline: none; }
.tt-selo {
    display: grid; place-items: center; width: 48px; height: 48px; margin-bottom: 16px;
    border-radius: 9999px;
    background: var(--success-subtle, #dcfce7); color: var(--success, #166534);
}
.tt-titulo.tt-titulo--grande { font-size: 20px; margin-bottom: 4px; }
/* Dois seletores: o `.tt-texto { margin: 0 }` do balão pode vir depois no CSS. */
.tt-texto.tt-espaco { margin-bottom: 16px; }
.tt-lista { list-style: none; margin: 0 0 24px; padding: 0; display: grid; gap: 6px; }
.tt-lista li { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; color: var(--fg, #111827); }
.tt-lista svg { flex-shrink: 0; margin-top: 2px; color: var(--success, #166534); }
.tt-pilha { display: flex; flex-direction: column; gap: 8px; }
.tt-pilha .tt-botao { width: 100%; }
</style>
