import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';

const rodar = (...args) => spawnSync(process.execPath, ['bin/conferir-alvos.mjs', ...args], { encoding: 'utf8' });

describe('tutorial-conferir', () => {
    it('aceita alvo fixo e alvo em atributo dinâmico', () => {
        const r = rodar('tests/fixtures/passos.js', 'tests/fixtures/app');
        expect(r.status).toBe(0);
    });

    it('acusa alvo que sumiu', () => {
        writeFileSync('tests/fixtures/passos-quebrado.js', "export const t = { a: [{ selector: '[data-tour=\"sumiu\"]' }] };");
        try {
            const r = rodar('tests/fixtures/passos-quebrado.js', 'tests/fixtures/app');
            expect(r.status).toBe(1);
            expect(r.stderr).toContain('data-tour="sumiu"');
        } finally {
            rmSync('tests/fixtures/passos-quebrado.js');
        }
    });
});
