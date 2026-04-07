# Host GTK (Experimental)

Host externo para a biblioteca delegua-interface-grafica usando Rust + GTK4.

## Objetivo
Executar a interface grafica em processo separado, comunicando por JSON line-delimited via stdin/stdout.

## Requisitos
- Rust toolchain (cargo)
- Linux
- Bibliotecas GTK4 de sistema (ex.: `libgtk-4-dev` em Debian/Ubuntu)

## Build de desenvolvimento
```bash
cargo build --release --manifest-path host-gtk/Cargo.toml
```

## Executavel gerado
`host-gtk/target/release/delegua-interface-grafica-gtk-host`

## Protocolo
A especificacao do protocolo esta em:

- ../docs/protocolo-processo-externo-v1.md

## Suporte atual

- componentes basicos: janela, botao, rotulo, caixa de texto;
- layouts de fluxo com `GtkBox`;
- layout livre com `gtk4::Fixed` via `criar-caixa-livre`;
- geometria por `definir-geometria`.

## Limitacoes

- posicionamento absoluto e garantido apenas para componentes cujo pai imediato seja a caixa livre;
- a compilacao do host depende de GTK4 de sistema e `pkg-config`.

## Integracao com o backend TypeScript
Exemplo de variaveis de ambiente para usar este host:

```bash
export DELEGUA_INTERFACE_GRAFICA_BACKEND=gtk
export DELEGUA_INTERFACE_GRAFICA_GTK_COMANDO=/caminho/para/delegua-interface-grafica-gtk-host
```

Nota: este host continua experimental e deve evoluir junto com o protocolo.
