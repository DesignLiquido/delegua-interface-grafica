# delegua-interface-grafica

Biblioteca de interface gráfica para a linguagem [Delégua](https://github.com/DesignLiquido/delegua).

Permite criar janelas, botões, rótulos, caixas de texto e contêineres de layout diretamente em código Delégua, com suporte a eventos como cliques e alterações de texto. Também oferece layout livre com coordenadas absolutas e dimensionamento explícito de componentes.

## Instalação

```bash
npm install @designliquido/delegua-interface-grafica
```

## Uso em código Delégua

```delegua
var ig = importar("interfaceGrafica")

var janela = ig.janela(800, 600, "Meu Programa")
var rotulo = ig.rotulo(janela, "Digite seu nome:")
var caixa  = ig.caixaTexto(janela, "")
var botao  = ig.botao(janela, "Confirmar")

funcao aoClicar() {
    var nome = ig.obterTexto(caixa)
    ig.definirTexto(rotulo, "Olá, " + nome + "!")
}

ig.aoClicar(botao, aoClicar)
ig.iniciar()
```

## Layouts disponíveis

- `caixaVertical(pai)` e `caixaHorizontal(pai)` mantêm o modelo de fluxo/empilhamento.
- `caixaLivre(pai)` cria uma área de layout absoluto para posicionar componentes com `x` e `y`.
- `definirPosicao(componente, x, y)` e `definirTamanho(componente, largura, altura)` usam pixels.

Exemplo com geometria:

```delegua
var ig = importar("interfaceGrafica")

var janela = ig.janela(800, 600, "Layout Livre")
var areaLivre = ig.caixaLivre(janela)

var caixa = ig.caixaTexto(areaLivre, "")
var botao = ig.botao(areaLivre, "Confirmar")

ig.definirPosicao(caixa, 24, 32)
ig.definirTamanho(caixa, 220, 32)
ig.definirPosicao(botao, 24, 80)
ig.definirTamanho(botao, 120, 36)

ig.iniciar()
```

## Métodos disponíveis

| Método | Descrição |
|--------|-----------|
| `janela(largura, altura, titulo)` | Cria a janela principal do programa. |
| `botao(pai, rotulo)` | Cria um botão dentro do componente pai. |
| `rotulo(pai, texto)` | Cria um rótulo de texto dentro do componente pai. |
| `caixaTexto(pai, textoInicial?)` | Cria uma caixa de texto editável. |
| `caixaVertical(pai)` | Cria um contêiner com layout vertical (de cima para baixo). |
| `caixaHorizontal(pai)` | Cria um contêiner com layout horizontal (da esquerda para direita). |
| `caixaLivre(pai)` | Cria um contêiner com layout livre para posicionamento por coordenadas. |
| `definirTexto(componente, texto)` | Altera o texto de um rótulo ou caixa de texto. |
| `obterTexto(componente)` | Lê o texto atual de um rótulo ou caixa de texto. |
| `definirPosicao(componente, x, y)` | Define a posição do componente em pixels. |
| `definirTamanho(componente, largura, altura)` | Define largura e altura do componente em pixels. |
| `aoClicar(componente, funcao)` | Registra uma função a ser chamada ao clicar no componente. |
| `aoAlterar(componente, funcao)` | Registra uma função a ser chamada quando o texto do componente mudar. A função recebe o novo texto como argumento. |
| `iniciar()` | Inicia o laço de eventos. Bloqueia até a janela ser fechada. |
| `encerrar()` | Encerra a interface gráfica e fecha todas as janelas. |

## Regras de geometria

- Posicionamento absoluto é garantido para componentes cujo pai imediato seja uma `caixaLivre`.
- `x`, `y`, `largura` e `altura` são interpretados em pixels.
- Em backends nativos, tentativas de posicionar um componente em um contêiner de fluxo podem resultar em erro explícito do host.

## Arquitetura

A biblioteca é dividida em duas camadas:

- **`InterfaceGrafica`** — classe exposta ao código Delégua. Recebe o interpretador automaticamente como primeiro argumento de cada método (comportamento padrão de `FuncaoPadrao`) e repassa callbacks simples para a infraestrutura.
- **`InfraestruturaGraficaInterface`** — contrato que toda infraestrutura deve implementar. A infraestrutura não conhece o interpretador nem tipos internos de Delégua; apenas recebe e invoca callbacks nativos.

### Infraestruturas disponíveis

| Classe | Ambiente | Descrição |
|--------|----------|-----------|
| `InfraestruturaElectron` | Processo renderer do Electron | Cria elementos DOM diretamente no `document.body` da janela Electron. Selecionada automaticamente quando `document` está disponível. |
| `InfraestruturaGtk` *(experimental)* | Node.js + host GTK externo | Encaminha comandos de UI para um processo externo GTK via JSON em stdin/stdout. Recomendado para ambientes Linux-first. Suporta `caixaLivre` e `definir-geometria` no protocolo. |
| `InfraestruturaJavaSwing` *(experimental)* | Node.js + host Java externo | Encaminha comandos de UI para um processo externo Java Swing via JSON em stdin/stdout. Requer um host Swing compatível com o protocolo da biblioteca. Suporta `caixaLivre` e `definir-geometria`. |
| `InfraestruturaWindows` *(experimental)* | Node.js + host Windows externo | Encaminha comandos de UI para um processo externo Windows (WPF/WinUI/WinForms) via JSON em stdin/stdout. Recomendado para ambientes Windows-first. Suporta `caixaLivre` e `definir-geometria`. |
| `InfraestruturaVazia` | Qualquer (fallback) | Sem operações visuais; mantém estado de texto em memória. Usada em testes unitários e quando nenhuma outra infraestrutura se aplica. |
| `InfraestruturaWebView` | Extensão VS Code | Renderiza a janela em um `WebviewPanel` do VS Code, comunicando-se via `postMessage`. Requer chamada prévia a `definirFabricaPainelWebView()` em `@designliquido/delegua-node`. Suporta `caixaLivre` e geometria explícita. |
| `InfraestruturaMacOS` *(experimental)* | Node.js + host macOS externo | Encaminha comandos de UI para um processo externo AppKit/Cocoa via JSON em stdin/stdout. Suporta `caixaLivre` e `definir-geometria`. |
| `InfraestruturaElectronSpawn` *(em `delegua-node`)* | Linha de comando (Node.js) | Spawna um processo Electron filho e comunica-se via stdin/stdout com o mesmo protocolo JSON de `InfraestruturaWebView`. Selecionada automaticamente quando o pacote `electron` está instalado. |

### Como a infraestrutura é escolhida em `delegua-node`

Ao importar `interfaceGrafica` em um programa Delégua, `delegua-node` escolhe a infraestrutura na seguinte ordem de prioridade:

1. **`InfraestruturaWebView`** — se a extensão VS Code tiver registrado uma fábrica de painel via `definirFabricaPainelWebView()` (veja abaixo).
2. **`InfraestruturaElectron`** — se `document` estiver disponível (processo renderer do Electron).
3. **`InfraestruturaElectronSpawn`** *(em `delegua-node`)* — se o pacote `electron` estiver instalado (local ou globalmente). Spawna um processo Electron filho e comunica-se via stdin/stdout.
4. **`InfraestruturaVazia`** — fallback final; emite um aviso no console e não exibe nenhuma janela.

### Executando programas com interface gráfica

#### Linha de comando (Node.js puro)

Rodar um programa Delégua diretamente pelo terminal (`delegua meu-programa.delegua`) cai no **fallback `InfraestruturaVazia`**: o programa executa sem erros, mas nenhuma janela é exibida. Isso é esperado — Node.js não tem DOM.

#### Dentro do VS Code (extensão Delégua)

A extensão Delégua para VS Code pode exibir a janela em um painel nativo chamando `definirFabricaPainelWebView()` antes de executar o programa:

```typescript
import { definirFabricaPainelWebView } from '@designliquido/delegua-node';

// no método activate() da extensão:
definirFabricaPainelWebView(() =>
    vscode.window.createWebviewPanel(
        'delegua-interface-grafica',
        'Interface Gráfica – Delégua',
        vscode.ViewColumn.One,
        { enableScripts: true }
    )
);
```

Com isso, `ig.iniciar()` abre um painel dentro do próprio VS Code e todos os eventos (cliques, alterações de texto) funcionam normalmente.

#### Processo renderer do Electron

Se o programa Delégua for executado diretamente dentro de um processo renderer Electron (onde `document` está disponível), `InfraestruturaElectron` é selecionada automaticamente e a janela é renderizada como um overlay DOM sobre a página existente.

Para usar uma infraestrutura diferente (ou criar a sua própria), implemente `InfraestruturaGraficaInterface` e passe a instância ao construtor de `InterfaceGrafica`:

```typescript
import { InterfaceGrafica, InfraestruturaGraficaInterface } from '@designliquido/delegua-interface-grafica';

class MinhaInfraestrutura implements InfraestruturaGraficaInterface {
    // implementar os métodos da interface
}

const ig = new InterfaceGrafica(new MinhaInfraestrutura());
```

### Selecionando backend Java Swing por variáveis de ambiente

O módulo `DeleguaModuloInterfaceGrafica` pode inicializar o backend Swing automaticamente quando a variável abaixo estiver definida:

```bash
DELEGUA_INTERFACE_GRAFICA_BACKEND=java-swing
```

Variáveis opcionais para o host Swing:

- `DELEGUA_INTERFACE_GRAFICA_SWING_COMANDO` (padrão: `java`)
- `DELEGUA_INTERFACE_GRAFICA_SWING_ARGUMENTOS` (padrão: `-jar delegua-interface-grafica-swing-host.jar`)
- `DELEGUA_INTERFACE_GRAFICA_SWING_JAR` (atalho para montar automaticamente `-jar <caminho>` quando `DELEGUA_INTERFACE_GRAFICA_SWING_ARGUMENTOS` não estiver definido)
- `DELEGUA_INTERFACE_GRAFICA_SWING_CWD` (diretório de trabalho para o processo)

Se o backend Swing falhar ao iniciar, a biblioteca faz fallback automático para `InfraestruturaVazia` com aviso em `console.warn`.

### Selecionando backend GTK por variáveis de ambiente

O módulo `DeleguaModuloInterfaceGrafica` pode inicializar o backend GTK automaticamente quando:

```bash
DELEGUA_INTERFACE_GRAFICA_BACKEND=gtk
```

Variáveis opcionais para o host GTK:

- `DELEGUA_INTERFACE_GRAFICA_GTK_COMANDO` (padrão: `delegua-interface-grafica-gtk-host`)
- `DELEGUA_INTERFACE_GRAFICA_GTK_ARGUMENTOS` (argumentos separados por espaço)
- `DELEGUA_INTERFACE_GRAFICA_GTK_CWD` (diretório de trabalho para o processo)

Se o backend GTK falhar ao iniciar, a biblioteca faz fallback automático para `InfraestruturaVazia` com aviso em `console.warn`.

### Selecionando backend Windows por variáveis de ambiente

O módulo `DeleguaModuloInterfaceGrafica` pode inicializar o backend Windows automaticamente quando:

```bash
DELEGUA_INTERFACE_GRAFICA_BACKEND=windows
```

Variáveis opcionais para o host Windows:

- `DELEGUA_INTERFACE_GRAFICA_WINDOWS_COMANDO` (padrão: `delegua-interface-grafica-windows-host.exe`)
- `DELEGUA_INTERFACE_GRAFICA_WINDOWS_ARGUMENTOS` (argumentos separados por espaço)
- `DELEGUA_INTERFACE_GRAFICA_WINDOWS_CWD` (diretório de trabalho para o processo)

Se o backend Windows falhar ao iniciar, a biblioteca faz fallback automático para `InfraestruturaVazia` com aviso em `console.warn`.

### Protocolo do host externo

A especificação do protocolo de mensagens entre TypeScript e hosts externos está em:

- `docs/protocolo-processo-externo-v1.md`

Um esqueleto inicial do host Java Swing foi adicionado em:

- `host-java-swing/`

Um esqueleto inicial do host GTK foi adicionado em:

- `host-gtk/`

Um esqueleto inicial do host Windows foi adicionado em:

- `host-windows/`

Um esqueleto inicial do host macOS foi adicionado em:

- `host-macos/`

### Teste E2E opcional com host Java real

Por padrão, os testes E2E de Swing ficam desativados para não depender de Java/JAR em todos os ambientes.

Para executar:

1. Gere o JAR do host Java Swing.
2. Defina as variáveis de ambiente:
    - `DELEGUA_SWING_E2E=1`
    - `DELEGUA_SWING_E2E_JAR=<caminho-absoluto-do-jar>`
    - opcional: `DELEGUA_SWING_E2E_COMANDO=java`
3. Rode `yarn testes-unitarios`.

O teste E2E está em `testes/infraestrutura-java-swing-e2e.test.ts`.

Esse teste agora também cobre `caixaLivre`, `definirPosicao()` e `definirTamanho()`.

Alternativa automatizada (compila host + roda E2E):

```bash
yarn testes-e2e-java-swing
```

Requisitos para esse comando:

- Gradle instalado no ambiente, ou
- `gradlew`/`gradlew.bat` presente em `host-java-swing/`.

Opcionalmente, personalize o comando Gradle com `DELEGUA_SWING_E2E_GRADLE_CMD`.

### Teste E2E opcional com host GTK real

Por padrão, os testes E2E de GTK ficam desativados para não depender de Rust + GTK nativo em todos os ambientes.

Para executar manualmente:

1. Compile o host GTK.
2. Defina as variáveis de ambiente:
    - `DELEGUA_GTK_E2E=1`
    - `DELEGUA_GTK_E2E_CMD=<caminho-absoluto-do-executavel>`
3. Rode `yarn testes-unitarios`.

O teste E2E está em `testes/infraestrutura-gtk-e2e.test.ts`.

Esse teste agora também cobre `caixaLivre`, `definirPosicao()` e `definirTamanho()`.

Alternativa automatizada (compila host + roda E2E):

```bash
yarn testes-e2e-gtk
```

Opcionalmente, personalize o comando cargo com `DELEGUA_GTK_E2E_CARGO_CMD`.

### Teste E2E opcional com host Windows real

Por padrão, os testes E2E de Windows ficam desativados para não depender de .NET/host nativo em todos os ambientes.

Para executar manualmente:

1. Publique o host Windows.
2. Defina as variáveis de ambiente:
    - `DELEGUA_WINDOWS_E2E=1`
    - `DELEGUA_WINDOWS_E2E_EXE=<caminho-absoluto-do-executavel>`
3. Rode `yarn testes-unitarios`.

O teste E2E está em `testes/infraestrutura-windows-e2e.test.ts`.

Esse teste agora também cobre `caixaLivre`, `definirPosicao()` e `definirTamanho()`.

Alternativa automatizada (publica host + roda E2E):

```bash
yarn testes-e2e-windows
```

Opcionalmente, personalize o comando .NET com `DELEGUA_WINDOWS_E2E_DOTNET_CMD`.

## Desenvolvimento

```bash
# Instalar dependências
yarn

# Executar os testes
yarn testes-unitarios

# Compilar
yarn empacotar
```

## Licença

MIT
