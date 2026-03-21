# InfraestruturaVazia

Implementação de `InfraestruturaGraficaInterface` sem operações visuais. Nenhum elemento
DOM é criado e nenhuma janela é exibida. Destinada exclusivamente a **testes unitários** e
a ambientes sem interface gráfica (CI, Node.js puro).

## Comportamento

### Criação de componentes

Todos os métodos `criar*` retornam objetos `ComponenteInterfaceGraficaInterface` com IDs
únicos gerados por um contador de instância (e.g. `componente-1`, `componente-2`, …).
Parâmetros como `pai`, `largura`, `altura` e `titulo` são ignorados.

### Estado de texto

`criarRotulo` e `criarCaixaTexto` armazenam o texto inicial em um
`Map<string, string>` indexado pelo `idComponente`. `definirTexto` atualiza essa entrada;
`obterTexto` a lê (retorna `''` caso o componente não tenha texto registrado).

Componentes que não carregam texto (janela, botão, caixas de layout) não têm entrada no
mapa — `obterTexto` devolve `''` para eles.

### Eventos

`conectarEvento` aceita o registro sem lançar exceção, mas descarta o callback. Nenhum
evento é disparado internamente.

### Ciclo de vida

| Método        | Comportamento                          |
|---------------|----------------------------------------|
| `iniciarLaco` | Resolve imediatamente (`async` vazio). |
| `encerrar`    | Não faz nada.                          |

## Uso em testes

```typescript
import { InfraestruturaVazia } from './infraestrutura-vazia';
import { InterfaceGrafica } from '../../interface-grafica';

const infraestrutura = new InfraestruturaVazia();
const ig = new InterfaceGrafica(infraestrutura);

const janela = ig.janela(interpretador, 800, 600, 'Teste');
const rotulo = ig.rotulo(interpretador, janela, 'Olá');

ig.definirTexto(interpretador, rotulo, 'Mundo');
expect(ig.obterTexto(interpretador, rotulo)).toBe('Mundo');
```

Crie uma nova instância de `InfraestruturaVazia` em cada `beforeEach` para evitar
vazamento de estado entre testes.
