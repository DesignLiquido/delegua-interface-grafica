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

| Classe | Pacote | Descrição |
|--------|--------|-----------|
| `InfraestruturaElectron` | este pacote | Cria elementos DOM no processo de renderização do Electron. É a infraestrutura padrão usada por `delegua-node`. |
| `InfraestruturaVazia` | este pacote | Infraestrutura sem operações visuais, usada em testes unitários e ambientes sem DOM. |

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
