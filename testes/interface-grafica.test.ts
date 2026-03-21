import { InfraestruturaVazia } from '../fontes/infraestruturas/vazia/infraestrutura-vazia';
import { InterfaceGrafica } from '../fontes/interface-grafica';
import { ComponenteInterfaceGraficaInterface } from '../fontes/interfaces/componente-interface-grafica-interface';

const interpretadorFalso: any = {
    executarChamavel: jest.fn().mockResolvedValue(undefined),
};

describe('InterfaceGrafica com InfraestruturaVazia', () => {
    let ig: InterfaceGrafica;
    let infraestrutura: InfraestruturaVazia;

    beforeEach(() => {
        infraestrutura = new InfraestruturaVazia();
        ig = new InterfaceGrafica(infraestrutura);
        interpretadorFalso.executarChamavel.mockClear();
    });

    describe('criação de componentes', () => {
        it('janela retorna um componente com idComponente', () => {
            const janela = ig.janela(interpretadorFalso, 800, 600, 'Teste');
            expect(janela).toBeDefined();
            expect(janela.idComponente).toBeTruthy();
        });

        it('botao retorna um componente com idComponente', () => {
            const janela = ig.janela(interpretadorFalso, 800, 600, 'Teste');
            const botao = ig.botao(interpretadorFalso, janela, 'Clique aqui');
            expect(botao).toBeDefined();
            expect(botao.idComponente).toBeTruthy();
        });

        it('rotulo retorna um componente com idComponente', () => {
            const janela = ig.janela(interpretadorFalso, 800, 600, 'Teste');
            const rotulo = ig.rotulo(interpretadorFalso, janela, 'Olá');
            expect(rotulo).toBeDefined();
            expect(rotulo.idComponente).toBeTruthy();
        });

        it('caixaTexto retorna um componente com idComponente', () => {
            const janela = ig.janela(interpretadorFalso, 800, 600, 'Teste');
            const caixa = ig.caixaTexto(interpretadorFalso, janela, 'inicial');
            expect(caixa).toBeDefined();
            expect(caixa.idComponente).toBeTruthy();
        });

        it('caixaTexto usa texto vazio por padrão', () => {
            const janela = ig.janela(interpretadorFalso, 800, 600, 'Teste');
            const caixa = ig.caixaTexto(interpretadorFalso, janela);
            expect(ig.obterTexto(interpretadorFalso, caixa)).toBe('');
        });

        it('caixaVertical retorna um componente com idComponente', () => {
            const janela = ig.janela(interpretadorFalso, 800, 600, 'Teste');
            const caixa = ig.caixaVertical(interpretadorFalso, janela);
            expect(caixa).toBeDefined();
            expect(caixa.idComponente).toBeTruthy();
        });

        it('caixaHorizontal retorna um componente com idComponente', () => {
            const janela = ig.janela(interpretadorFalso, 800, 600, 'Teste');
            const caixa = ig.caixaHorizontal(interpretadorFalso, janela);
            expect(caixa).toBeDefined();
            expect(caixa.idComponente).toBeTruthy();
        });

        it('cada componente recebe um idComponente único', () => {
            const janela = ig.janela(interpretadorFalso, 800, 600, 'Teste');
            const botao1 = ig.botao(interpretadorFalso, janela, 'Botão 1');
            const botao2 = ig.botao(interpretadorFalso, janela, 'Botão 2');
            expect(botao1.idComponente).not.toBe(botao2.idComponente);
        });
    });

    describe('texto de componentes', () => {
        let janela: ComponenteInterfaceGraficaInterface;

        beforeEach(() => {
            janela = ig.janela(interpretadorFalso, 800, 600, 'Teste');
        });

        it('rotulo preserva o texto inicial', () => {
            const rotulo = ig.rotulo(interpretadorFalso, janela, 'Olá, mundo!');
            expect(ig.obterTexto(interpretadorFalso, rotulo)).toBe('Olá, mundo!');
        });

        it('caixaTexto preserva o texto inicial', () => {
            const caixa = ig.caixaTexto(interpretadorFalso, janela, 'valor inicial');
            expect(ig.obterTexto(interpretadorFalso, caixa)).toBe('valor inicial');
        });

        it('definirTexto atualiza o texto do componente', () => {
            const rotulo = ig.rotulo(interpretadorFalso, janela, 'antes');
            ig.definirTexto(interpretadorFalso, rotulo, 'depois');
            expect(ig.obterTexto(interpretadorFalso, rotulo)).toBe('depois');
        });

        it('definirTexto não afeta outros componentes', () => {
            const rotulo1 = ig.rotulo(interpretadorFalso, janela, 'rótulo 1');
            const rotulo2 = ig.rotulo(interpretadorFalso, janela, 'rótulo 2');
            ig.definirTexto(interpretadorFalso, rotulo1, 'alterado');
            expect(ig.obterTexto(interpretadorFalso, rotulo2)).toBe('rótulo 2');
        });
    });

    describe('eventos', () => {
        let janela: ComponenteInterfaceGraficaInterface;
        let botao: ComponenteInterfaceGraficaInterface;

        beforeEach(() => {
            janela = ig.janela(interpretadorFalso, 800, 600, 'Teste');
            botao = ig.botao(interpretadorFalso, janela, 'OK');
        });

        it('aoClicar registra sem lançar exceção', () => {
            const funcaoDelegua = {};
            expect(() => ig.aoClicar(interpretadorFalso, botao, funcaoDelegua)).not.toThrow();
        });

        it('aoAlterar registra sem lançar exceção', () => {
            const caixa = ig.caixaTexto(interpretadorFalso, janela, '');
            const funcaoDelegua = {};
            expect(() => ig.aoAlterar(interpretadorFalso, caixa, funcaoDelegua)).not.toThrow();
        });
    });

    describe('ciclo de vida', () => {
        it('iniciar resolve sem erros', async () => {
            await expect(ig.iniciar(interpretadorFalso)).resolves.toBeUndefined();
        });

        it('encerrar não lança exceção', () => {
            expect(() => ig.encerrar(interpretadorFalso)).not.toThrow();
        });
    });
});

describe('InfraestruturaVazia isolado', () => {
    let infraestrutura: InfraestruturaVazia;

    beforeEach(() => {
        infraestrutura = new InfraestruturaVazia();
    });

    it('criarJanela retorna componente válido', () => {
        const c = infraestrutura.criarJanela(800, 600, 'Teste');
        expect(c.idComponente).toBeTruthy();
    });

    it('obterTexto retorna string vazia para componente sem texto', () => {
        const janela = infraestrutura.criarJanela(800, 600, 'Teste');
        const botao = infraestrutura.criarBotao(janela, 'OK');
        expect(infraestrutura.obterTexto(botao)).toBe('');
    });

    it('iniciarLaco resolve imediatamente', async () => {
        await expect(infraestrutura.iniciarLaco()).resolves.toBeUndefined();
    });
});
