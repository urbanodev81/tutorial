# Changelog

## [Não lançado]

### Adicionado
- O tutorial por tela como pacote (22/10/2026), a partir da cópia do USI:
  `useTour`, `TourOverlay` e `TourSummaryModal`, com Esc, foco no balão, alvo
  visível, rolagem até o alvo, saída pelo véu confirmada dentro do balão e
  fechamento quando outra superfície abre.
- Cor só por variável de tema (`--surface`, `--accent`, `--overlay`…), com
  `--tutorial-primaria` para quem usa primária neutra.
- Modos `aprender` e `auxiliar`: passo só de um modo e texto por modo; no
  `auxiliar` o tutorial nunca abre sozinho.
- Chave de "visto", z-index, textos da interface e "Ver todos os tutoriais"
  por configuração.
- `tutorial-conferir`: acusa passo apontando para `data-tour` que não existe.
