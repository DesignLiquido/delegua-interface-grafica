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

## Integracao com o backend TypeScript
Exemplo de variaveis de ambiente para usar este host:

```powershell
$env:DELEGUA_INTERFACE_GRAFICA_BACKEND='windows'
$env:DELEGUA_INTERFACE_GRAFICA_WINDOWS_COMANDO='C:\caminho\para\DeleguaInterfaceGraficaWindowsHost.exe'
```

Nota: este host esta em estado inicial e deve evoluir junto com o protocolo.
