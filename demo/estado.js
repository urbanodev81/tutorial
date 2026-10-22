import { ref } from 'vue';

/*
 * Aqui não há roteador: a "tela" é uma aba, e trocar de aba avisa quem estiver
 * ouvindo — o mesmo papel do `router.on('finish')` do Inertia num sistema real.
 */
export const tela = ref('painel');
export const modo = ref('aprender');

const ouvintes = new Set();

export function navegar(nova) {
    tela.value = nova;
    queueMicrotask(() => ouvintes.forEach((avisar) => avisar()));
}

export function aoNavegar(avisar) {
    ouvintes.add(avisar);

    return () => ouvintes.delete(avisar);
}
