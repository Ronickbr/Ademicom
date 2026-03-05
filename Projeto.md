## 1. Visão Geral do Projeto
Este sistema automatiza a rastreabilidade, o controle técnico e o fluxo comercial de produtos de linha branca salvados. O software utiliza Inteligência Artificial (OCR) para extrair dados técnicos complexos de etiquetas originais, gerencia a reetiquetagem interna com numeração sequencial controlada e oferece um dashboard analítico para o setor comercial.

---

## 2. Perfis de Usuário e Permissões (RBAC)
O Administrador realiza a gestão centralizada de acessos no Módulo Admin.

* **Administrador**: Gestão de usuários (criar/editar); configuração inicial e ajuste manual da sequência do ID Ambicom; acesso total a relatórios.
* **Técnico**: Leitura de etiqueta original via OCR; upload de fotos de avarias; preenchimento de checklist técnico.
* **Supervisor**: Validação de laudos; aprovação para entrada em estoque; comando de impressão da etiqueta interna Ambicom.
* **Gestor**: Cadastro de clientes; visualização de estoque real; criação de pedidos e baixa automática de vendas.

---

## 3. Requisitos de Dados (Extração Total da Etiqueta)
O sistema deve processar a imagem e preencher automaticamente os campos baseados no padrão Electrolux:

### 3.1 Identificação e Rastreabilidade
* **Marca**: Electrolux.
* **Modelo**: Ex: IM8S ou IM8.
* **Código Comercial**: Ex: 02623FBA.
* **Cor**: Ex: 30 (Inox) ou 06 (Branco).
* **PNC/ML**: Ex: 900277738 / 00.
* **Número de Série Original**: Identificador de fábrica (ex: 30926473).
* **Data de Fabricação**: Registro de data e hora da produção.

### 3.2 Especificações Elétricas e Performance
* **Tensão (Voltagem)**: 127 V ou 220 V.
* **Corrente**: Ex: 2,3 A ou 1,8 A.
* **Gás Refrigerante**: Tipo (ex: R600a) e Carga (ex: 45 g).
* **Volumes (L)**: Freezer, Refrigerador e Total.
* **Pressões**: Alta e Baixa (ex: 788/52 kPa).
* **Potência de Degelo**: Ex: 316 W.

---

## 4. Fluxo de Procedimentos Otimizado

### 4.1 Entrada e Triagem (Técnico)
1.  **Captura**: Fotografia da etiqueta original; IA extrai os dados técnicos.
2.  **Checklist de Salvado**: Registro de avarias estéticas, estado de componentes e funcionalidade.
3.  **Fotos**: Upload obrigatório de 4 fotos (Etiqueta, Frontal Aberta, Frontal Fechada e Detalhe da Avaria).
4.  **Status**: `EM AVALIAÇÃO`.

### 4.2 Homologação e ID Ambicom (Supervisor)
1.  **Revisão**: Supervisor valida o checklist e as fotos.
2.  **Sequenciamento de ID**: Ao aprovar, o sistema gera o **Número de Série Ambicom** (ex: 00284-2025) baseado na numeração manual inicial definida pelo Admin.
3.  **Etiquetagem**: Impressão da etiqueta interna conforme modelo oficial (SAC: 041-3382-5410).
4.  **Status**: `EM ESTOQUE`.

### 4.3 Comercial e Gestão de Pedidos (Gestor)
1.  **Venda**: Gestor seleciona o produto pelo ID Ambicom; apenas itens `EM ESTOQUE` são visíveis.
2.  **Baixa**: Ao finalizar a venda, o status muda para `VENDIDO` e o item sai do inventário disponível.

---

## 5. Dashboard Analítico
Painel visual com filtros por **Semana, Mês e Ano**:
* **KPIs de Status**: Total de produtos em Avaliação, Estoque e Vendidos.
* **Gráfico de Tendência**: Comparativo de Entradas vs. Saídas.
* **Filtro de Grade**: Quantidade de itens por classificação estética (A, B, C).
* **Mix de Voltagem**: Proporção de itens 127V e 220V em estoque.

---

## 6. Regras de Negócio e Segurança
* **Configuração Admin**: O administrador insere manualmente o número inicial da sequência uma única vez.
* **Unicidade**: Bloqueio de duplicidade de Números de Série originais de fábrica.
* **Fidelidade**: A etiqueta interna deve replicar exatamente o layout remanufaturado da Ambicom.

---

7. Leitura de Etiquetas

Campo na Etiqueta                               | Informação Detalhada
Fabricante                                      | Electrolux do Brasil S/A
Modelo                                          | IM8S
Código Comercial                                | 02623FBA
Cor                                             | 30
Tipo                                            | COMB. FROST FREE ELUX
PNC/ML                                          | 900277738 / 00
Número de Série                                 | 30926473
Data de Fabricação                              | 03/03/2023 - 09:50:18
Classe / Mercado                                | T / I
Gás Refrigerante                                | R600a
Carga de Gás                                    | 45 g
Compressor                                      | EMBRACO
Volume Freezer                                  | 200 L
Volume Refrigerador                             | 390 L
Volume Total                                    | 590 L
Pressão Alta / Baixa                            | (788 / 52) kPa / (100 / 7,09) psig
Capacidade de Congelamento                      | 9 kg / 24h
Corrente Elétrica                               | 2,3 A
Potência de Degelo                              | 316 W
Frequência                                      | 60 Hz
Tensão (Voltagem)                               | 127 V