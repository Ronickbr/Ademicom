# Plano de Implementação: Correção do Fluxo Scan App

Este plano descreve as alterações necessárias para alinhar o aplicativo Scan com o workflow definido no Projeto.md, simplificar a captura de imagens e corrigir bugs de UI.

## 🛠️ Escopo de Alterações

### 1. Captura de Imagem e OCR (Técnico)
- **Local:** `src/app/scan/page.tsx`
- **Mudança:** Alterar de 4 fotos para 1 foto única da etiqueta.
- **Lógica:**
    - Capturar 1 imagem.
    - Chamar a Edge Function de OCR automaticamente.
    - Exibir campos preenchidos para revisão/edição do técnico.
    - Salvar produto com status `CADASTRO`.

### 2. Workflow e Transição de Status
- **Fase 1 (Técnico):** Cadastro (`CADASTRO`) + Checklist. Ao finalizar checklist, status -> `EM AVALIAÇÃO`.
- **Fase 2 (Supervisor):** Verificação e Liberação. Ao liberar, status -> `EM ESTOQUE`. Adicionar botão de "Imprimir Etiqueta".
- **Fase 3 (Gestor):** Visão de estoque e não liberados. CRUD de Clientes e Pedidos.
- **Arquivos:** `src/app/technician/page.tsx`, `src/app/approvals/page.tsx` (Supervisor), `src/app/manager/page.tsx`, `src/app/inventory/page.tsx`.

### 3. Listagem de Estoque (Gestor)
- **Local:** `src/app/inventory/page.tsx` (ou componente compartilhado de lista).
- **Mudança:** Exibir apenas **Modelo**, **Marca** e **Data de Entrada** na lista principal de estoque.
- **UI:** Usar uma tabela ou lista compacta para facilitar a visualização de grandes volumes.

### 4. Correção de Sobreposição de Modais
- **Local:** `src/app/inventory/page.tsx` ou onde o modal de edição é invocado.
- **Bug:** "Editar Ativo" abre modal atrás do principal.
- **Solução:** Ajustar `z-index` ou fechar o modal anterior antes de abrir o novo, ou usar um sistema de Modais empilhados corretamente.

---

## 📈 Sequência de Tarefas

### Fase 1: Scanner e OCR
- [ ] Modificar UI do Scanner para 1 foto.
- [ ] Ajustar `useScan` (se necessário) para suportar fluxo de foto única + OCR imediato.
- [ ] Implementar formulário de revisão pós-OCR no `scan/page.tsx`.

### Fase 2: Workflow e Status
- [ ] Garantir que novos produtos entrem como `CADASTRO`.
- [ ] No `technician/checklist/[id]/page.tsx`, ajustar transição para `EM AVALIAÇÃO`.
- [ ] No `approvals/page.tsx` (Supervisor), implementar botão de impressão e transição para `EM ESTOQUE`.

### Fase 3: UI de Inventário e Bug de Modais
- [ ] Simplificar colunas na lista de inventário para o Gestor.
- [ ] Investigar e corrigir a ordem de empilhamento (z-index) dos modais.

### Fase 4: Verificação Final
- [ ] Testar fluxo completo: Técnico -> Supervisor -> Gestor.
- [ ] Validar responsividade mobile.
