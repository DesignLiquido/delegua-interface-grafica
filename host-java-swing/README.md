# Host Java Swing (Experimental)

Host externo para a biblioteca delegua-interface-grafica usando Java Swing.

## Objetivo
Executar a interface grafica em processo separado, comunicando por JSON line-delimited via stdin/stdout.

## Requisitos
- Java 17+
- Gradle (ou usar wrapper, se adicionado futuramente)

## Executar em desenvolvimento
```bash
gradle run
```

## Gerar distribuicao
```bash
gradle installDist
```

## Protocolo
A especificacao do protocolo esta em:

- ../docs/protocolo-processo-externo-v1.md

## Integracao com o backend TypeScript
Exemplo de variaveis de ambiente para usar este host:

```bash
DELEGUA_INTERFACE_GRAFICA_BACKEND=java-swing
DELEGUA_INTERFACE_GRAFICA_SWING_COMANDO=java
DELEGUA_INTERFACE_GRAFICA_SWING_ARGUMENTOS=-jar caminho/para/delegua-interface-grafica-swing-host.jar
```

Nota: este host esta em estado inicial e deve evoluir junto com o protocolo.
