import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { configurarTutorial, esquecerVisto, hasTour, stepsFor, tourCompleted, TourOverlay, useTour } from '../src/index.js';

const PASSOS = {
    inicio: [
        { selector: null, title: 'Boas-vindas', text: { aprender: 'Você está avaliando.', auxiliar: 'Este é o seu painel.' } },
        { selector: '[data-tour="menu"]', title: 'O menu', text: 'As telas ficam aqui.' },
        { selector: null, title: 'Fim da avaliação', text: 'Assine quando quiser.', modo: 'aprender' },
    ],
};

enableAutoUnmount(afterEach);

let modo;

beforeEach(() => {
    modo = ref('aprender');
    configurarTutorial({
        passos: PASSOS,
        titulos: { inicio: 'Início' },
        chaveVisto: 'teste-visto',
        resolverTela: () => 'inicio',
        modo: () => modo.value,
        superficie: null,
        aoVerTodos: null,
    });
    esquecerVisto();
    document.body.innerHTML = '<nav data-tour="menu" style="width:100px;height:40px">menu</nav>';
});

afterEach(() => {
    useTour().finish();
    esquecerVisto();
});

describe('modos', () => {
    it('no aprender, mostra os passos e o texto da avaliação', () => {
        const passos = stepsFor('inicio');
        expect(passos.map((p) => p.title)).toEqual(['Boas-vindas', 'O menu', 'Fim da avaliação']);
        expect(passos[0].text).toBe('Você está avaliando.');
    });

    it('no auxiliar, some o passo só da avaliação e o texto muda', () => {
        modo.value = 'auxiliar';
        const passos = stepsFor('inicio');
        expect(passos.map((p) => p.title)).toEqual(['Boas-vindas', 'O menu']);
        expect(passos[0].text).toBe('Este é o seu painel.');
    });

    it('abre sozinho só no aprender e só uma vez', () => {
        const tour = useTour();
        expect(tour.startIfFirstTime('inicio')).toBe(true);
        tour.finish();
        expect(tour.startIfFirstTime('inicio')).toBe(false);
    });

    it('no auxiliar nunca abre sozinho, mas abre pelo botão', () => {
        modo.value = 'auxiliar';
        const tour = useTour();
        expect(tour.startIfFirstTime('inicio')).toBe(false);
        expect(tour.state.active).toBe(false);
        tour.start('inicio');
        expect(tour.state.active).toBe(true);
    });
});

describe('visto', () => {
    it('pular marca visto igual a concluir', () => {
        const tour = useTour();
        tour.start('inicio');
        tour.skip();
        expect(tourCompleted()).toBe(true);
    });

    it('tela sem passos não tem tour', () => {
        expect(hasTour('outra')).toBe(false);
        useTour().start('outra');
        expect(useTour().state.active).toBe(false);
    });
});

describe('balão', () => {
    it('Esc fecha e marca visto', async () => {
        mount(TourOverlay, { attachTo: document.body });
        useTour().start('inicio');
        await nextTick();
        expect(document.querySelector('[role="dialog"]')).not.toBeNull();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await nextTick();
        expect(useTour().state.active).toBe(false);
        expect(tourCompleted()).toBe(true);
    });

    it('clicar no véu pergunta antes de sair', async () => {
        mount(TourOverlay, { attachTo: document.body });
        useTour().start('inicio');
        await nextTick();
        document.querySelector('[data-tutorial="veu"]').click();
        await nextTick();
        expect(document.querySelector('#tour-titulo').textContent).toBe('Sair do tutorial?');
        expect(useTour().state.active).toBe(true);
    });

    it('outra superfície abrindo fecha o tour; null não', async () => {
        const aberta = ref(null);
        configurarTutorial({
            superficie: { superficieAberta: aberta, reivindicar: (n) => { aberta.value = n; }, liberar: (n) => { if (aberta.value === n) aberta.value = null; } },
        });
        mount(TourOverlay, { attachTo: document.body });
        useTour().start('inicio');
        await nextTick();
        expect(aberta.value).toBe('tour');
        aberta.value = null;
        await nextTick();
        expect(useTour().state.active).toBe(true);
        aberta.value = 'conta';
        await nextTick();
        expect(useTour().state.active).toBe(false);
    });

    it('o último passo mostra o resumo com os títulos vistos', async () => {
        mount(TourOverlay, { attachTo: document.body });
        const tour = useTour();
        tour.start('inicio');
        tour.next();
        tour.next();
        await nextTick();
        const botoes = [...document.querySelectorAll('button')];
        botoes.find((b) => b.textContent.trim() === 'Concluir').click();
        await nextTick();
        const resumo = document.querySelector('#tour-resumo-titulo');
        expect(resumo.textContent).toContain('Início');
        expect(document.querySelectorAll('.tt-lista li')).toHaveLength(3);
        expect([...document.querySelectorAll('button')].some((b) => b.textContent.includes('Ver todos'))).toBe(false);
    });

    it('textos podem ser trocados pelo projeto', async () => {
        configurarTutorial({ textos: { pular: 'Agora não' } });
        mount(TourOverlay, { attachTo: document.body });
        useTour().start('inicio');
        await nextTick();
        expect([...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Agora não')).toBe(true);
        configurarTutorial({ textos: { pular: undefined } });
    });

    it('pedido de outra tela começa quando a tela certa monta', async () => {
        useTour().requestStart('inicio');
        mount(TourOverlay, { attachTo: document.body });
        await nextTick();
        expect(useTour().state.active).toBe(true);
    });

    it('passo de alvo ausente não deixa o holofote no alvo anterior', async () => {
        configurarTutorial({ passos: { inicio: [
            { selector: '[data-tour="menu"]', title: 'Menu', text: '' },
            { selector: '[data-tour="sumiu"]', title: 'Sumiu', text: '' },
        ] } });
        document.querySelector('nav').getBoundingClientRect = () => ({ top: 10, left: 10, width: 100, height: 40, right: 110, bottom: 50 });
        mount(TourOverlay, { attachTo: document.body });
        const tour = useTour();
        tour.start('inicio');
        await new Promise((r) => setTimeout(r, 0));
        expect(document.querySelector('[data-tutorial="holofote"]')).not.toBeNull();
        tour.next();
        await new Promise((r) => setTimeout(r, 0));
        expect(document.querySelector('[data-tutorial="holofote"]')).toBeNull();
        configurarTutorial({ passos: PASSOS });
    });
});
