# Casos de uso de vídeo

O âmbito da solução contém **14 casos de uso**, com os identificadores do relatório de entrega. Todos estão implementados; a validação detalhada e os desvios conhecidos encontram-se nos Capítulos 7 e 10.

| ID | Caso de uso | Especificação |
| --- | --- | --- |
| UC-VID-000 | Carregar e visualizar um vídeo no projeto | [UC-VID-000](use-cases/UC-VID-000.md) |
| UC-VID-001 | Recortar temporalmente um vídeo | [UC-VID-001](use-cases/UC-VID-001.md) |
| UC-VID-002 | Remover o áudio de um vídeo | [UC-VID-002](use-cases/UC-VID-002.md) |
| UC-VID-003 | Alterar a velocidade de reprodução de um vídeo | [UC-VID-003](use-cases/UC-VID-003.md) |
| UC-VID-004 | Aplicar marca de água a um vídeo | [UC-VID-004](use-cases/UC-VID-004.md) |
| UC-VID-005 | Descarregar um vídeo do projeto | [UC-VID-005](use-cases/UC-VID-005.md) |
| UC-VID-006 | Consultar as informações de um vídeo | [UC-VID-006](use-cases/UC-VID-006.md) |
| UC-VID-007 | Ajustar as propriedades visuais de um vídeo | [UC-VID-007](use-cases/UC-VID-007.md) |
| UC-VID-008 | Aplicar um filtro visual a um vídeo | [UC-VID-008](use-cases/UC-VID-008.md) |
| UC-VID-009 | Redimensionar um vídeo | [UC-VID-009](use-cases/UC-VID-009.md) |
| UC-VID-010 | Rodar e espelhar um vídeo | [UC-VID-010](use-cases/UC-VID-010.md) |
| UC-VID-011 | Converter o formato de um vídeo | [UC-VID-011](use-cases/UC-VID-011.md) |
| UC-VID-012 | Juntar vídeos | [UC-VID-012](use-cases/UC-VID-012.md) |
| UC-VID-013 | Encadear operações de edição num vídeo | [UC-VID-013](use-cases/UC-VID-013.md) |

A autorização distingue leitura e edição no projeto. A quota pertence ao executor: operações isoladas e junção custam um crédito; cadeias custam um crédito por passo. Upload, reprodução, consulta e descarregamento são isentos.
