# InfraestruturaElectron

Implementação de `InfraestruturaGraficaInterface` para o processo de renderização do
[Electron](https://www.electronjs.org/). Cria e gerencia elementos DOM reais no
`document.body` da janela Electron em que o código Delégua está sendo executado.

## Como funciona

### Sobreposição de janela

Ao chamar `criarJanela`, a infraestrutura monta a seguinte hierarquia de elementos no
`document.body`:

```
div.sobreposicao          (position: fixed; cobre toda a viewport com fundo semitransparente)
  └─ div.moldura          (largura × altura fornecidos; borda e sombra de janela)
       ├─ div.barraTitulo (barra escura com título e botão "×")
       └─ div.areaConteudo (flex-column; recebe os filhos do código Delégua)
```

O **handle** retornado pelo método (o `ComponenteInterfaceGraficaInterface`) aponta
internamente para `areaConteudo`, de modo que todos os filhos criados depois são
inseridos diretamente nessa área.

### Mapa de componentes

Cada elemento DOM recebe um ID interno (e.g. `delegua-gui-1`, `delegua-gui-2`, …) gerado
por um contador de instância. O mapa `elementosPorId: Map<string, HTMLElement>` faz a
tradução entre o ID opaco exposto ao código Delégua e o `HTMLElement` real.

### Elementos DOM por widget

| Método                | Tag HTML | Notas                                               |
|-----------------------|----------|-----------------------------------------------------|
| `criarJanela`         | `div`    | aponta para `areaConteudo`; sobreposição não exposta |
| `criarBotao`          | `button` | `textContent` = rótulo                              |
| `criarRotulo`         | `label`  | `textContent` = texto                               |
| `criarCaixaTexto`     | `input`  | `type="text"`; `value` = texto inicial              |
| `criarCaixaVertical`  | `div`    | `flex-direction: column`                            |
| `criarCaixaHorizontal`| `div`    | `flex-direction: row`                               |

### Leitura e escrita de texto

- Para `HTMLInputElement` / `HTMLTextAreaElement`: usa `element.value`.
- Para todos os outros elementos: usa `element.textContent`.

### Mapeamento de eventos

O método `conectarEvento` traduz os nomes de eventos do Delégua para eventos DOM:

| Evento Delégua | Evento DOM |
|----------------|------------|
| `clique`       | `click`    |
| `alterado`     | `input`    |
| `tecla`        | `keydown`  |
| `foco`         | `focus`    |
| `desfoco`      | `blur`     |

Para o evento `alterado` em campos de texto, o valor atual de `element.value` é passado
automaticamente como primeiro argumento ao callback. Para os demais eventos, o callback
é invocado sem argumentos.

### Ciclo de vida

| Método        | Comportamento                                                                     |
|---------------|-----------------------------------------------------------------------------------|
| `iniciarLaco` | Retorna uma `Promise` que fica pendente até `encerrar()` ser chamado.             |
| `encerrar`    | Remove a sobreposição do DOM, limpa `elementosPorId` e resolve a Promise do laço. |

O botão "×" da barra de título também chama `encerrar()` internamente.

## Requisitos de ambiente

- Deve ser executada no **processo de renderização** do Electron, onde `document` está
  disponível.
- Não funciona no processo principal (`main process`) nem em ambientes Node.js puros.

## Exemplo de uso (código Delégua)

```
importe InterfaceGrafica

var janela = InterfaceGrafica.janela(800, 600, 'Meu Programa')
var botao  = InterfaceGrafica.botao(janela, 'Clique aqui')

funcao aoClicar() {
    escreva('Clicado!')
}

InterfaceGrafica.aoClicar(botao, aoClicar)
InterfaceGrafica.iniciar()
```
