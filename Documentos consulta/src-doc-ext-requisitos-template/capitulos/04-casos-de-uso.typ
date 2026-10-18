#import "../template.typ": *

= Casos de Uso

#orientacao[
  Um caso de uso (UC-VID-nnn) por funcionalidade de vídeo, todos com a mesma estrutura.
  Cada caso de uso está num ficheiro próprio em `casos-uso/` — copiem `UC-VID-001.typ` e acrescentem o
  `#include` abaixo (facilita o trabalho em paralelo).
  O caso de uso deve ter complexidade adequada. Operações triviais (e.g., gerar uma miniatura a partir de um
  único fotograma) não são suficientes.
]

#include "../casos-uso/UC-VID-001.typ"
// #include "../casos-uso/UC-VID-002.typ"
// #include "../casos-uso/UC-VID-003.typ"
