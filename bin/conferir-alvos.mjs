#!/usr/bin/env node
/**
 * Acusa passo de tutorial que aponta para um `data-tour` que não existe mais.
 *
 * Alvo que sumiu não quebra nada — o balão cai no centro —, e é exatamente por
 * isso que ninguém percebe. Este conferidor roda no CI de cada projeto:
 *
 *   npx tutorial-conferir resources/js/tourSteps.js resources/js
 *
 * Lê os seletores `[data-tour="x"]` do arquivo de passos (texto, sem executar)
 * e procura `data-tour="x"` nos .vue/.js/.blade.php da pasta — também dentro
 * de `:data-tour="…"`, como texto entre aspas simples. Sai com 1 se faltar algum.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const [arquivoPassos, ...pastas] = process.argv.slice(2);

if (! arquivoPassos || pastas.length === 0) {
    console.error('uso: tutorial-conferir <tourSteps.js> <pasta> [pasta...]');
    process.exit(2);
}

const alvos = new Set(
    [...readFileSync(arquivoPassos, 'utf8').matchAll(/data-tour=\\?["']([^"'\\]+)\\?["']/g)].map((m) => m[1]),
);

function* arquivos(pasta) {
    for (const nome of readdirSync(pasta)) {
        if (nome === 'node_modules' || nome.startsWith('.')) continue;
        const caminho = join(pasta, nome);
        if (statSync(caminho).isDirectory()) yield* arquivos(caminho);
        else if (/\.(vue|js|ts|jsx|tsx|php)$/.test(nome) && caminho !== arquivoPassos) yield caminho;
    }
}

const achados = new Set();
const prefixos = new Set();
for (const pasta of pastas) {
    for (const caminho of arquivos(pasta)) {
        const fonte = readFileSync(caminho, 'utf8');
        for (const m of fonte.matchAll(/(?<![:\w-])data-tour=["']([^"']+)["']/g)) achados.add(m[1]);
        // Atributo dinâmico (`:data-tour="i === 0 ? 'lista' : null"`): vale
        // qualquer texto entre aspas simples dentro da expressão.
        for (const m of fonte.matchAll(/(?::|v-bind:)data-tour="([^"]+)"/g)) {
            for (const literal of m[1].matchAll(/'([^']+)'/g)) achados.add(literal[1]);
            // Template (`menu-${item.chave}`): só dá para conferir o prefixo.
            for (const tpl of m[1].matchAll(/`([^`$]*)\$\{/g)) if (tpl[1]) prefixos.add(tpl[1]);
        }
    }
}

const porPrefixo = [...alvos].filter((alvo) => ! achados.has(alvo) && [...prefixos].some((p) => alvo.startsWith(p)));
const faltando = [...alvos].filter((alvo) => ! achados.has(alvo) && ! porPrefixo.includes(alvo));

if (faltando.length) {
    console.error(`Passo de tutorial sem alvo na tela: ${faltando.map((a) => `data-tour="${a}"`).join(', ')}`);
    process.exit(1);
}

console.log(`tutorial: ${alvos.size} alvo(s), todos existem.`);
if (porPrefixo.length) {
    // Prefixo existe, o resto vem de dado (o menu, por exemplo): o projeto
    // confere a outra metade no próprio teste, se precisar.
    console.log(`  conferidos só pelo prefixo: ${porPrefixo.join(', ')}`);
}
