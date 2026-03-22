import { InfraestruturaElectron } from './infraestruturas/electron/infraestrutura-electron';
import { InfraestruturaVazia } from './infraestruturas/vazia/infraestrutura-vazia';
import { InterfaceGrafica } from './interface-grafica';

const _infraestrutura = typeof document !== 'undefined'
    ? new InfraestruturaElectron()
    : new InfraestruturaVazia();
const _ig = new InterfaceGrafica(_infraestrutura);

export const DeleguaModuloInterfaceGrafica = {
    janela: {
        tipoRetorno: 'objeto',
        funcao: _ig.janela.bind(_ig),
        argumentos: [
            { nome: 'largura', tipo: 'número' },
            { nome: 'altura', tipo: 'número' },
            { nome: 'titulo', tipo: 'texto' },
        ],
        documentacao:
            `# \`InterfaceGrafica.janela(largura, altura, titulo)\`\n\n` +
            'Cria a janela principal do programa.\n\n' +
            '## Exemplo de Código\n\n' +
            '```delegua\n' +
            'var ig = importar("InterfaceGrafica")\n' +
            'var janela = ig.janela(800, 600, "Meu Programa")\n' +
            '```\n',
        exemploCodigo: 'ig.janela(800, 600, "Meu Programa")',
    },
    botao: {
        tipoRetorno: 'objeto',
        funcao: _ig.botao.bind(_ig),
        argumentos: [
            { nome: 'pai', tipo: 'objeto' },
            { nome: 'rotulo', tipo: 'texto' },
        ],
        documentacao:
            `# \`InterfaceGrafica.botao(pai, rotulo)\`\n\n` +
            'Cria um botão dentro do componente pai.\n\n' +
            '## Exemplo de Código\n\n' +
            '```delegua\n' +
            'var ig = importar("InterfaceGrafica")\n' +
            'var janela = ig.janela(800, 600, "Exemplo")\n' +
            'var botao = ig.botao(janela, "Clique aqui")\n' +
            '```\n',
        exemploCodigo: 'ig.botao(janela, "Clique aqui")',
    },
    rotulo: {
        tipoRetorno: 'objeto',
        funcao: _ig.rotulo.bind(_ig),
        argumentos: [
            { nome: 'pai', tipo: 'objeto' },
            { nome: 'texto', tipo: 'texto' },
        ],
        documentacao:
            `# \`InterfaceGrafica.rotulo(pai, texto)\`\n\n` +
            'Cria um rótulo de texto dentro do componente pai.\n\n' +
            '## Exemplo de Código\n\n' +
            '```delegua\n' +
            'var ig = importar("InterfaceGrafica")\n' +
            'var janela = ig.janela(800, 600, "Exemplo")\n' +
            'var rotulo = ig.rotulo(janela, "Olá, mundo!")\n' +
            '```\n',
        exemploCodigo: 'ig.rotulo(janela, "Olá, mundo!")',
    },
    caixaTexto: {
        tipoRetorno: 'objeto',
        funcao: _ig.caixaTexto.bind(_ig),
        argumentos: [
            { nome: 'pai', tipo: 'objeto' },
            { nome: 'textoInicial', tipo: 'texto', opcional: true, valorPadrao: '' },
        ],
        documentacao:
            `# \`InterfaceGrafica.caixaTexto(pai, textoInicial?)\`\n\n` +
            'Cria uma caixa de texto editável dentro do componente pai.\n\n' +
            '## Exemplo de Código\n\n' +
            '```delegua\n' +
            'var ig = importar("InterfaceGrafica")\n' +
            'var janela = ig.janela(800, 600, "Exemplo")\n' +
            'var caixa = ig.caixaTexto(janela, "valor inicial")\n' +
            '```\n',
        exemploCodigo: 'ig.caixaTexto(janela, "valor inicial")',
    },
    caixaVertical: {
        tipoRetorno: 'objeto',
        funcao: _ig.caixaVertical.bind(_ig),
        argumentos: [
            { nome: 'pai', tipo: 'objeto' },
        ],
        documentacao:
            `# \`InterfaceGrafica.caixaVertical(pai)\`\n\n` +
            'Cria um contêiner com layout vertical (empilhamento de cima para baixo).\n\n' +
            '## Exemplo de Código\n\n' +
            '```delegua\n' +
            'var ig = importar("InterfaceGrafica")\n' +
            'var janela = ig.janela(800, 600, "Exemplo")\n' +
            'var coluna = ig.caixaVertical(janela)\n' +
            'var botao1 = ig.botao(coluna, "Primeiro")\n' +
            'var botao2 = ig.botao(coluna, "Segundo")\n' +
            '```\n',
        exemploCodigo: 'ig.caixaVertical(janela)',
    },
    caixaHorizontal: {
        tipoRetorno: 'objeto',
        funcao: _ig.caixaHorizontal.bind(_ig),
        argumentos: [
            { nome: 'pai', tipo: 'objeto' },
        ],
        documentacao:
            `# \`InterfaceGrafica.caixaHorizontal(pai)\`\n\n` +
            'Cria um contêiner com layout horizontal (empilhamento da esquerda para direita).\n\n' +
            '## Exemplo de Código\n\n' +
            '```delegua\n' +
            'var ig = importar("InterfaceGrafica")\n' +
            'var janela = ig.janela(800, 600, "Exemplo")\n' +
            'var linha = ig.caixaHorizontal(janela)\n' +
            'var rotulo = ig.rotulo(linha, "Nome:")\n' +
            'var caixa = ig.caixaTexto(linha, "")\n' +
            '```\n',
        exemploCodigo: 'ig.caixaHorizontal(janela)',
    },
    definirTexto: {
        tipoRetorno: 'nulo',
        funcao: _ig.definirTexto.bind(_ig),
        argumentos: [
            { nome: 'componente', tipo: 'objeto' },
            { nome: 'texto', tipo: 'texto' },
        ],
        documentacao:
            `# \`InterfaceGrafica.definirTexto(componente, texto)\`\n\n` +
            'Altera o texto de um componente (rótulo ou caixa de texto).\n\n' +
            '## Exemplo de Código\n\n' +
            '```delegua\n' +
            'var ig = importar("InterfaceGrafica")\n' +
            'var janela = ig.janela(800, 600, "Exemplo")\n' +
            'var rotulo = ig.rotulo(janela, "antes")\n' +
            'ig.definirTexto(rotulo, "depois")\n' +
            '```\n',
        exemploCodigo: 'ig.definirTexto(rotulo, "depois")',
    },
    obterTexto: {
        tipoRetorno: 'texto',
        funcao: _ig.obterTexto.bind(_ig),
        argumentos: [
            { nome: 'componente', tipo: 'objeto' },
        ],
        documentacao:
            `# \`InterfaceGrafica.obterTexto(componente)\`\n\n` +
            'Lê o texto atual de um componente (rótulo ou caixa de texto).\n\n' +
            '## Exemplo de Código\n\n' +
            '```delegua\n' +
            'var ig = importar("InterfaceGrafica")\n' +
            'var janela = ig.janela(800, 600, "Exemplo")\n' +
            'var caixa = ig.caixaTexto(janela, "inicial")\n' +
            'escreva(ig.obterTexto(caixa))\n' +
            '```\n',
        exemploCodigo: 'ig.obterTexto(caixa)',
    },
    aoClicar: {
        tipoRetorno: 'nulo',
        funcao: _ig.aoClicar.bind(_ig),
        argumentos: [
            { nome: 'componente', tipo: 'objeto' },
            { nome: 'funcao', tipo: 'função' },
        ],
        documentacao:
            `# \`InterfaceGrafica.aoClicar(componente, funcao)\`\n\n` +
            'Registra uma função Delégua para ser chamada ao clicar no componente.\n\n' +
            '## Exemplo de Código\n\n' +
            '```delegua\n' +
            'var ig = importar("InterfaceGrafica")\n' +
            'var janela = ig.janela(800, 600, "Exemplo")\n' +
            'var botao = ig.botao(janela, "Clique")\n' +
            'funcao aoClicar() {\n' +
            '    escreva("Clicado!")\n' +
            '}\n' +
            'ig.aoClicar(botao, aoClicar)\n' +
            '```\n',
        exemploCodigo: 'ig.aoClicar(botao, aoClicar)',
    },
    aoAlterar: {
        tipoRetorno: 'nulo',
        funcao: _ig.aoAlterar.bind(_ig),
        argumentos: [
            { nome: 'componente', tipo: 'objeto' },
            { nome: 'funcao', tipo: 'função' },
        ],
        documentacao:
            `# \`InterfaceGrafica.aoAlterar(componente, funcao)\`\n\n` +
            'Registra uma função Delégua para ser chamada quando o texto do componente mudar.\n' +
            'A função recebe o novo texto como argumento.\n\n' +
            '## Exemplo de Código\n\n' +
            '```delegua\n' +
            'var ig = importar("InterfaceGrafica")\n' +
            'var janela = ig.janela(800, 600, "Exemplo")\n' +
            'var caixa = ig.caixaTexto(janela, "")\n' +
            'funcao aoAlterar(novoTexto) {\n' +
            '    escreva(novoTexto)\n' +
            '}\n' +
            'ig.aoAlterar(caixa, aoAlterar)\n' +
            '```\n',
        exemploCodigo: 'ig.aoAlterar(caixa, aoAlterar)',
    },
    iniciar: {
        tipoRetorno: 'nulo',
        funcao: _ig.iniciar.bind(_ig),
        argumentos: [],
        documentacao:
            `# \`InterfaceGrafica.iniciar()\`\n\n` +
            'Inicia o laço de eventos da interface gráfica. Bloqueia a execução do programa ' +
            'até que a janela seja fechada.\n' +
            'Deve ser chamado após criar e configurar todos os componentes.\n\n' +
            '## Exemplo de Código\n\n' +
            '```delegua\n' +
            'var ig = importar("InterfaceGrafica")\n' +
            'var janela = ig.janela(800, 600, "Meu Programa")\n' +
            '// ... criar componentes e registrar eventos ...\n' +
            'ig.iniciar()\n' +
            '```\n',
        exemploCodigo: 'ig.iniciar()',
    },
    encerrar: {
        tipoRetorno: 'nulo',
        funcao: _ig.encerrar.bind(_ig),
        argumentos: [],
        documentacao:
            `# \`InterfaceGrafica.encerrar()\`\n\n` +
            'Encerra a interface gráfica e fecha todas as janelas.\n\n' +
            '## Exemplo de Código\n\n' +
            '```delegua\n' +
            'var ig = importar("InterfaceGrafica")\n' +
            'var janela = ig.janela(800, 600, "Exemplo")\n' +
            'var botao = ig.botao(janela, "Fechar")\n' +
            'funcao fechar() {\n' +
            '    ig.encerrar()\n' +
            '}\n' +
            'ig.aoClicar(botao, fechar)\n' +
            'ig.iniciar()\n' +
            '```\n',
        exemploCodigo: 'ig.encerrar()',
    },
};
