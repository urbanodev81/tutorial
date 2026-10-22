import { createApp } from 'vue';
import { configurarTutorial } from '@urbanodev/tutorial';
import App from './App.vue';
import { aoNavegar, modo, tela } from './estado.js';
import { passos, titulos } from './passos.js';
import './tema.css';

/*
 * A demonstração faz o papel de um sistema que usa o pacote: declara as
 * variáveis de tema (tema.css), escreve os passos (passos.js) e diz ao
 * pacote qual é a tela atual e quando a navegação termina.
 */
configurarTutorial({
    passos,
    titulos,
    chaveVisto: 'demo-tutorial-visto',
    resolverTela: () => tela.value,
    aoNavegar,
    zIndex: 100,
    modo: () => modo.value,
});

createApp(App).mount('#app');
