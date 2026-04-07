# Host macOS (Experimental)

Host externo para a biblioteca delegua-interface-grafica usando Swift e AppKit (Cocoa).

## Objetivo
Executar a interface grafica em processo separado, comunicando por JSON line-delimited via stdin/stdout.

## Requisitos
- macOS 12+
- Swift 5.9+ / Xcode 14+

## Compilar

```bash
swift build --package-path host-macos -c release
```

O binario sera gerado em:

```
host-macos/.build/release/DeleguaInterfaceGraficaMacOSHost
```

## Protocolo
A especificacao do protocolo esta em:

- ../docs/protocolo-processo-externo-v1.md

## Suporte atual

- componentes basicos: janela, botao, rotulo, caixa de texto;
- layouts empilhados com `NSStackView`;
- layout livre com `NSView` via `criar-caixa-livre`;
- geometria por `definir-geometria`.

## Limitacoes

- posicionamento absoluto e garantido apenas para filhos de `caixaLivre`;
- validacao nativa do host precisa ser verificada em ambiente macOS com toolchain Swift/AppKit disponivel.

## Integracao com o backend TypeScript
Exemplo de variaveis de ambiente para usar este host:

```bash
export DELEGUA_INTERFACE_GRAFICA_BACKEND='macos'
export DELEGUA_INTERFACE_GRAFICA_MACOS_COMANDO='/caminho/para/DeleguaInterfaceGraficaMacOSHost'
```

Nota: este host continua experimental e deve evoluir junto com o protocolo.
