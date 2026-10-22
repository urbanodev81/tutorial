# @urbanodev/tutorial

[![testes](https://github.com/urbanodev81/tutorial/actions/workflows/testes.yml/badge.svg)](https://github.com/urbanodev81/tutorial/actions/workflows/testes.yml)
[![licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)](LICENSE)

Tutorial por tela para **Vue 3**: um holofote sobre o elemento, um balão com o
texto e um resumo no fim. Uma tela, um tutorial.

**[Ver a demonstração →](https://urbanodev81.github.io/tutorial/)**

> *English:* a per-screen product tour for Vue 3 — spotlight, tooltip and a
> summary. Two modes (`aprender`, which opens once by itself, and `auxiliar`,
> help-button only), colors taken only from the host's CSS theme variables, a
> CI checker for steps whose target disappeared, and accessible by default.
> Docs are in Portuguese; the API is small and the demo shows all of it.

## Por que existe

Os sistemas da Urbano Dev ganharam tutorial um de cada vez, e cada um ganhou a
sua **cópia**. Em poucas semanas eram três, divergentes: uma sem Esc e sem
rolar até o alvo, outra com esses furos corrigidos, a terceira com anel e véu
por variável de tema. Cada defeito achado precisava ser achado de novo nas
outras.

Este pacote parte da cópia mais madura, corrige no caminho o que ainda faltava
(o holofote parava ~1 s no alvo anterior ao trocar de passo) e substitui as
três. Hoje roda em produção em mais de um sistema, e cada sistema novo instala
em vez de copiar.

## O que ele faz

- **Holofote e balão** posicionados no alvo, com rolagem até alvos abaixo da
  dobra e balão que se arrasta.
- **Dois modos**, para o mesmo tutorial servir a públicos diferentes:
  - `aprender` — abre sozinho na primeira visita e fala como orientação
    (cliente avaliando o sistema);
  - `auxiliar` — nunca abre sozinho, só pelo botão de ajuda (quem já usa todo
    dia não quer nada pulando na tela).

  Um passo pode existir só num modo, e o texto pode ter uma versão por modo.
- **Alvo visível, ou centro.** Vale o primeiro `data-tour` *visível* (o menu
  lateral do celular existe no DOM, fora da tela); alvo ausente põe o balão
  no centro. O tutorial nunca quebra a tela.
- **`tutorial-conferir`**, para o CI: acusa passo apontando para um
  `data-tour` que sumiu do código — a quebra silenciosa que nenhum teste comum
  pega.
- **Não escreve cor.** Lê as variáveis de tema do projeto (`--surface`,
  `--fg`, `--accent`…), então o tema escuro vem junto e cada produto mantém a
  sua marca.
- **Acessível por padrão:** `role="dialog"` com `aria-modal`, foco no balão,
  Esc fecha, contagem de passos anunciada ao leitor de tela, alvos de toque de
  44 px e holofote sem animação para quem pediu menos movimento.
- **Nenhuma dependência** além do Vue.

## Instalar

```jsonc
// package.json — versão exata, nunca branch
"@urbanodev/tutorial": "github:urbanodev81/tutorial#v0.2.1"
```

O pacote vai como fonte (`.vue`); o Vite não pode pré-empacotá-lo:

```js
// vite.config.js
optimizeDeps: { exclude: ['@urbanodev/tutorial'] },
```

## Usar

Configure uma vez, na entrada da aplicação. O exemplo é de um projeto com
Inertia; a [demonstração](demo/main.js) faz o mesmo sem roteador nenhum.

```js
import { router } from '@inertiajs/vue3';
import { configurarTutorial } from '@urbanodev/tutorial';
import { titulos, passos } from './passos';

configurarTutorial({
    passos,
    titulos,
    chaveVisto: 'meu-sistema:tutorial:visto',   // localStorage
    resolverTela: () => telaAtual(),             // chave da tela, ou null
    aoNavegar: (avisar) => router.on('finish', avisar),
    zIndex: 100,                                 // a régua é do projeto
    modo: 'aprender',                            // ou () => 'auxiliar', por usuário
    cores: 'inteira',                            // ou 'canais' (ver abaixo)
});
```

No layout, o overlay e o botão de ajuda:

```vue
<script setup>
import { onMounted } from 'vue';
import { TourOverlay, hasTour, useTour } from '@urbanodev/tutorial';

const { start, startIfFirstTime } = useTour();
// Onde ele deve abrir sozinho. No modo auxiliar, nunca abre.
onMounted(() => startIfFirstTime('painel'));
</script>

<template>
    <button v-if="hasTour(tela)" data-tour="ajuda" aria-label="Ver o tutorial desta tela" @click="start(tela)">?</button>
    <TourOverlay />
</template>
```

### Passos

```js
export const passos = {
    painel: [
        { selector: null, title: 'Bem-vindo', text: { aprender: 'Você está avaliando…', auxiliar: 'O seu painel.' } },
        { selector: '[data-tour="menu"]', title: 'O menu', text: 'As telas ficam aqui.' },
        { selector: null, title: 'Antes de assinar', text: '…', modo: 'aprender' },
    ],
};
```

- `selector` aponta `data-tour`, **nunca classe**: classe muda com o layout,
  `data-tour` só muda de propósito.
- `selector: null` põe o balão no centro.
- `modo` no passo: só aparece naquele modo. `text` como objeto: um por modo.

### Cores

O projeto declara estas variáveis antes de instalar: `--surface`,
`--surface-sunken`, `--fg`, `--fg-muted`, `--fg-subtle`, `--fg-on-accent`,
`--border`, `--border-input`, `--accent`, `--accent-hover`, `--accent-ring`,
`--overlay`, `--success`, `--success-subtle`. O [tema da
demonstração](demo/tema.css) é um exemplo completo, claro e escuro.

- Cor inteira (`--surface: #fff`) é o padrão. Projeto que declara em canais
  para o Tailwind (`--surface: 255 255 255`) passa `cores: 'canais'`.
- Produto com botão primário neutro aponta `--tutorial-primaria`,
  `--tutorial-primaria-hover` e `--tutorial-primaria-texto`.

### Superfície exclusiva (opcional)

Se o projeto garante "uma gaveta ou modal aberto por vez", passe
`superficie: { superficieAberta, reivindicar, liberar }`: o tutorial reivindica
a tela ao abrir e fecha quando outra superfície abre.

## Conferir os alvos no CI

```bash
npx tutorial-conferir src/passos.js src
```

Lê os passos, procura cada `data-tour` no código (inclusive `:data-tour`
dinâmico) e falha se algum sumiu.

## Desenvolver

```bash
npm install
npm test            # vitest + happy-dom
npm run demo        # a demonstração em http://localhost:5173
```

Mudanças estão no [CHANGELOG](CHANGELOG.md).

## Licença

[MIT](LICENSE) © Ricardo Urbano — [Urbano Dev](https://urbanodev.com.br)
