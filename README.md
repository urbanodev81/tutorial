# @urbanodev/tutorial

O tutorial por tela dos sistemas da Urbano Dev: holofote sobre o elemento,
balão com o texto, resumo no fim. Uma tela, um tutorial. É a implementação Vue
do módulo **`kit-desenvolvimento/modulos/tutorial`** — a especificação e os
invariantes estão lá; aqui está o código. Divergiu da especificação? A
especificação muda primeiro.

Nasceu no Sócrates, teve os furos corrigidos no Duo (16/10/2026) e ganhou anel e
véu por token no USI (22/10/2026). Este pacote parte da versão do USI e acaba
com as três cópias.

## O que entrega (e o que não)

- `useTour`, `TourOverlay`, `TourSummaryModal` — os nomes das três cópias.
- Dois **modos**: `aprender` (abre sozinho uma vez, fala como orientação) e
  `auxiliar` (só pelo botão de ajuda; passo e texto podem mudar).
- `tutorial-conferir`: acusa passo que aponta para um `data-tour` que sumiu.
- **Não entrega** os passos, o botão de ajuda nem o mapa rota→tela. Cada
  projeto tem os seus.
- **Não escreve cor.** Tudo sai das variáveis de tema do projeto
  (`--surface`, `--fg`, `--fg-muted`, `--fg-subtle`, `--border`,
  `--border-input`, `--surface-sunken`, `--accent`, `--accent-hover`,
  `--accent-ring`, `--fg-on-accent`, `--overlay`, `--success`,
  `--success-subtle` — a lista do `CORE.md` §1). Projeto sem essas variáveis
  declara antes de instalar.
  A primária segue a marca (CORE §6): quem usa neutro-escuro aponta
  `--tutorial-primaria`, `--tutorial-primaria-hover` e
  `--tutorial-primaria-texto`.

## Instalar

```jsonc
// package.json do sistema — versão exata, nunca branch
"@urbanodev/tutorial": "github:urbanodev81/tutorial#v0.1.0"
```

O pacote vai como fonte (`.vue`), então o Vite não pode pré-empacotá-lo:

```js
// vite.config.js
optimizeDeps: { exclude: ['@urbanodev/tutorial'] },
```

```js
// app.js — uma vez
import { router } from '@inertiajs/vue3';
import { configurarTutorial } from '@urbanodev/tutorial';
import { screenTitles, tourSteps } from '@/tourSteps';
import { resolvePageKey } from '@/Composables/usePageKey';
import { useSuperficieExclusiva } from '@/Composables/useSuperficieExclusiva';

configurarTutorial({
    passos: tourSteps,
    titulos: screenTitles,
    chaveVisto: 'meu-sistema-tour-visto',
    resolverTela: resolvePageKey,
    aoNavegar: (avisar) => router.on('finish', avisar),
    superficie: useSuperficieExclusiva(),
    zIndex: 100,                       // a régua é do projeto (CORE §10)
    modo: 'aprender',                  // ou () => 'auxiliar' por usuário
    aoVerTodos: () => router.visit(route('tours.index')),   // opcional
});
```

```vue
<!-- layout autenticado -->
<TourOverlay />
<button v-if="hasTour(tela)" data-tour="ajuda" @click="start(tela)" aria-label="Ver o tutorial desta tela">?</button>
```

E, onde o tutorial abre sozinho: `startIfFirstTime('dashboard')` — no modo
`auxiliar` ele não abre nunca.

## Passos

```js
export const tourSteps = {
    dashboard: [
        { selector: null, title: 'Bem-vindo', text: { aprender: 'Durante a avaliação…', auxiliar: 'Seu painel…' } },
        { selector: '[data-tour="menu"]', title: 'O menu', text: 'As telas ficam aqui.' },
        { selector: null, title: 'Antes de assinar', text: '…', modo: 'aprender' },
    ],
};
```

- `selector` aponta `data-tour`, **nunca classe**. `null` = balão no centro.
- Vale o primeiro alvo **visível**; alvo ausente cai no centro (nunca quebra).
- `modo` no passo: só aparece naquele modo. `text` como objeto: um por modo.

## Conferir os alvos (no CI de cada projeto)

```bash
npx tutorial-conferir resources/js/tourSteps.js resources/js
```

## Testes

```bash
npm install && npm test
```
