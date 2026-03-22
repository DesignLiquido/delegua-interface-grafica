# Protocolo de Processo Externo v1

## Objetivo
Definir o contrato de comunicacao entre a biblioteca delegua-interface-grafica (lado TypeScript) e hosts de interface grafica executados em processo externo.

## Transporte
- Meio: stdin/stdout do processo filho.
- Formato: JSON line-delimited (uma mensagem JSON por linha).
- Codificacao: UTF-8.

## Regras Gerais
- Toda mensagem deve conter o campo obrigatorio `tipo`.
- Campos adicionais sao permitidos, desde que nao conflitem com os campos definidos por mensagem.
- O host deve enviar `pronto` assim que estiver apto a receber comandos.
- Mensagens enviadas pelo TypeScript antes de `pronto` podem ser enfileiradas.

## Handshake
### Host -> TS
```json
{ "tipo": "pronto", "versao": "1.0.0" }
```

Campos:
- `tipo`: obrigatorio, valor `pronto`.
- `versao`: opcional, versao do host.

## Comandos TS -> Host
### criar-janela
```json
{ "tipo": "criar-janela", "id": "delegua-gui-1", "largura": 800, "altura": 600, "titulo": "Meu Programa" }
```

### criar-botao
```json
{ "tipo": "criar-botao", "id": "delegua-gui-2", "paiId": "delegua-gui-1", "rotulo": "OK" }
```

### criar-rotulo
```json
{ "tipo": "criar-rotulo", "id": "delegua-gui-3", "paiId": "delegua-gui-1", "texto": "Nome:" }
```

### criar-caixa-texto
```json
{ "tipo": "criar-caixa-texto", "id": "delegua-gui-4", "paiId": "delegua-gui-1", "textoInicial": "" }
```

### criar-caixa-vertical
```json
{ "tipo": "criar-caixa-vertical", "id": "delegua-gui-5", "paiId": "delegua-gui-1" }
```

### criar-caixa-horizontal
```json
{ "tipo": "criar-caixa-horizontal", "id": "delegua-gui-6", "paiId": "delegua-gui-1" }
```

### definir-texto
```json
{ "tipo": "definir-texto", "id": "delegua-gui-4", "texto": "novo valor" }
```

### encerrar
```json
{ "tipo": "encerrar" }
```

## Eventos Host -> TS
### evento
```json
{ "tipo": "evento", "componenteId": "delegua-gui-4", "evento": "alterado", "valor": "abc" }
```

Campos:
- `componenteId`: id do componente de origem.
- `evento`: nome do evento (exemplo: `clique`, `alterado`).
- `valor`: opcional, usado para eventos com payload.

### valor-atualizado
```json
{ "tipo": "valor-atualizado", "id": "delegua-gui-4", "valor": "abc" }
```

Uso principal: manter cache local sincronizado para operacoes sincronas de leitura.

### fechado
```json
{ "tipo": "fechado", "codigo": 0, "sinal": null }
```

Campos:
- `codigo`: opcional, codigo de saida do processo.
- `sinal`: opcional, sinal de encerramento quando aplicavel.

### erro
```json
{ "tipo": "erro", "origem": "host", "mensagem": "descricao do erro" }
```

Campos:
- `origem`: opcional, contexto do erro (exemplo: `host`, `protocolo`, `stderr`).
- `mensagem`: obrigatorio para diagnostico humano.

## Compatibilidade de Versao
- Este documento define a versao `v1` do protocolo.
- Alteracoes incompativeis devem gerar uma nova versao maior do protocolo.
- Alteracoes compativeis (adicao de campos opcionais) sao permitidas dentro da mesma versao maior.

## Recomendacoes de Robustez para Hosts
- Nunca emitir logs de diagnostico em stdout fora do formato JSON.
- Emitir logs de depuracao em stderr.
- Em caso de erro recuperavel, emitir `erro` e continuar quando possivel.
- Em caso de erro fatal, emitir `erro` seguido de encerramento limpo.
