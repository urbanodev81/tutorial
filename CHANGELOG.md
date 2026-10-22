# Changelog

## [Não lançado]

### Adicionado
- `cores: 'canais'` (0.2.0): para projeto que declara as variáveis de tema
  em canais do Tailwind (`--surface: 255 255 255`). O formato se resolve num
  lugar só, em variáveis `--tt-*` na camada do tutorial.
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
  Lê também `:data-tour` dinâmico (texto entre aspas simples) e, em template
  (`` `menu-${chave}` ``), confere pelo prefixo e diz quais.

### Corrigido
- O holofote do passo anterior ficava até ~1s no alvo errado enquanto o
  passo novo procurava o dele (defeito herdado das três cópias).
- Espaço sob "O que você viu" no resumo, anulado pela ordem do CSS.
