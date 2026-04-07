# Host Windows (Experimental)

Host externo para a biblioteca delegua-interface-grafica usando .NET e Windows Forms.

## Objetivo
Executar a interface grafica em processo separado, comunicando por JSON line-delimited via stdin/stdout.

## Requisitos
- .NET SDK 8+
- Windows

## Publicar em desenvolvimento
```powershell
dotnet publish .\host-windows\DeleguaInterfaceGraficaWindowsHost.csproj -c Release -r win-x64 --self-contained false -o .\host-windows\publish
```

## Protocolo
A especificacao do protocolo esta em:

- ../docs/protocolo-processo-externo-v1.md

## Suporte atual

- componentes basicos: janela, botao, rotulo, caixa de texto;
- layouts de fluxo com `FlowLayoutPanel`;
- layout livre com `Panel` via `criar-caixa-livre`;
- geometria com `definir-geometria`.

## Limitacoes

- posicionamento absoluto e garantido apenas para filhos de `caixaLivre`;
- componentes com `AutoSize` sao convertidos para tamanho explicito quando `definir-geometria` informa largura/altura.

## Integracao com o backend TypeScript
Exemplo de variaveis de ambiente para usar este host:

```powershell
$env:DELEGUA_INTERFACE_GRAFICA_BACKEND='windows'
$env:DELEGUA_INTERFACE_GRAFICA_WINDOWS_COMANDO='C:\caminho\para\DeleguaInterfaceGraficaWindowsHost.exe'
```

Nota: este host continua experimental e deve evoluir junto com o protocolo.
