# delegua-interface-grafica

Biblioteca de interface gráfica para a linguagem [Delégua](https://github.com/DesignLiquido/delegua).

Permite criar janelas, botões, rótulos, caixas de texto e contêineres de layout diretamente em código Delégua, com suporte a eventos como cliques e alterações de texto.

## Instalação

```bash
npm install @designliquido/delegua-interface-grafica
```

## Uso em código Delégua

```
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

## Métodos disponíveis

| Método | Descrição |
|--------|-----------|
| `janela(largura, altura, titulo)` | Cria a janela principal do programa. |
| `botao(pai, rotulo)` | Cria um botão dentro do componente pai. |
| `rotulo(pai, texto)` | Cria um rótulo de texto dentro do componente pai. |
| `caixaTexto(pai, textoInicial?)` | Cria uma caixa de texto editável. |
| `caixaVertical(pai)` | Cria um contêiner com layout vertical (de cima para baixo). |
| `caixaHorizontal(pai)` | Cria um contêiner com layout horizontal (da esquerda para direita). |
| `definirTexto(componente, texto)` | Altera o texto de um rótulo ou caixa de texto. |
| `obterTexto(componente)` | Lê o texto atual de um rótulo ou caixa de texto. |
| `aoClicar(componente, funcao)` | Registra uma função a ser chamada ao clicar no componente. |
| `aoAlterar(componente, funcao)` | Registra uma função a ser chamada quando o texto do componente mudar. A função recebe o novo texto como argumento. |
| `iniciar()` | Inicia o laço de eventos. Bloqueia até a janela ser fechada. |
| `encerrar()` | Encerra a interface gráfica e fecha todas as janelas. |

## Arquitetura

A biblioteca é dividida em duas camadas:

- **`InterfaceGrafica`** — classe exposta ao código Delégua. Recebe o interpretador automaticamente como primeiro argumento de cada método (comportamento padrão de `FuncaoPadrao`) e repassa callbacks simples para a infraestrutura.
- **`InfraestruturaGraficaInterface`** — contrato que toda infraestrutura deve implementar. A infraestrutura não conhece o interpretador nem tipos internos de Delégua; apenas recebe e invoca callbacks nativos.

### Infraestruturas disponíveis

| Classe | Ambiente | Descrição |
|--------|----------|-----------|
| `InfraestruturaElectron` | Processo renderer do Electron | Cria elementos DOM diretamente no `document.body` da janela Electron. Selecionada automaticamente quando `document` está disponível. |
| `InfraestruturaVazia` | Qualquer (fallback) | Sem operações visuais; mantém estado de texto em memória. Usada em testes unitários e quando nenhuma outra infraestrutura se aplica. |
| `InfraestruturaWebView` | Extensão VS Code | Renderiza a janela em um `WebviewPanel` do VS Code, comunicando-se via `postMessage`. Requer chamada prévia a `definirFabricaPainelWebView()` em `@designliquido/delegua-node`. |
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
