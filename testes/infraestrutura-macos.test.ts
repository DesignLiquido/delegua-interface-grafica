import * as path from 'path';
import { InfraestruturaMacOS } from '../fontes/infraestruturas/macos/infraestrutura-macos';

function esperarAte(
    condicao: () => boolean,
    timeoutMs = 2_000,
    intervaloMs = 20
): Promise<void> {
    return new Promise((resolve, reject) => {
        const inicio = Date.now();

        const verificador = () => {
            if (condicao()) {
                resolve();
                return;
            }

            if (Date.now() - inicio >= timeoutMs) {
                reject(new Error('Timeout aguardando condicao de teste.'));
                return;
            }

            setTimeout(verificador, intervaloMs);
        };

        verificador();
    });
}

describe('InfraestruturaMacOS com host fake', () => {
    const scriptHostFake = path.resolve(__dirname, 'fixtures', 'host-externo-fake.js');

    it('atualiza cache de texto e dispara callback de evento alterado', async () => {
        const infraestrutura = new InfraestruturaMacOS({
            comando: process.execPath,
            argumentos: [scriptHostFake],
            tempoLimiteProntoMs: 2_000,
        });

        const janela = infraestrutura.criarJanela(640, 480, 'Teste macOS');
        const caixa = infraestrutura.criarCaixaTexto(janela, '');

        const callback = jest.fn().mockResolvedValue(undefined);
        infraestrutura.conectarEvento(caixa, 'alterado', callback);

        infraestrutura.definirTexto(caixa, 'novo valor macos');

        await esperarAte(() => callback.mock.calls.length > 0);

        expect(callback).toHaveBeenCalledWith('novo valor macos');
        expect(infraestrutura.obterTexto(caixa)).toBe('novo valor macos');

        infraestrutura.encerrar();
    });

    it('emite criar-caixa-livre e definir-geometria no protocolo do host', () => {
        const infraestrutura = new InfraestruturaMacOS({
            comando: process.execPath,
            argumentos: [scriptHostFake],
            tempoLimiteProntoMs: 2_000,
        });

        const espiarEnviar = jest.spyOn((infraestrutura as any).processo, 'enviar');

        const janela = infraestrutura.criarJanela(640, 480, 'Teste macOS');
        const areaLivre = infraestrutura.criarCaixaLivre(janela);
        const botao = infraestrutura.criarBotao(areaLivre, 'Posicionar');

        infraestrutura.definirPosicao(botao, 40, 60);
        infraestrutura.definirTamanho(botao, 120, 36);

        expect(espiarEnviar).toHaveBeenCalledWith({
            tipo: 'criar-caixa-livre',
            id: areaLivre.idComponente,
            paiId: janela.idComponente,
        });
        expect(espiarEnviar).toHaveBeenCalledWith({
            tipo: 'definir-geometria',
            id: botao.idComponente,
            x: 40,
            y: 60,
        });
        expect(espiarEnviar).toHaveBeenCalledWith({
            tipo: 'definir-geometria',
            id: botao.idComponente,
            largura: 120,
            altura: 36,
        });

        infraestrutura.encerrar();
    });
});
