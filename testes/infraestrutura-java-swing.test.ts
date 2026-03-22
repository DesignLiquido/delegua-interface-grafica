import * as path from 'path';
import { InfraestruturaJavaSwing } from '../fontes/infraestruturas/java-swing/infraestrutura-java-swing';

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

describe('InfraestruturaJavaSwing com host fake', () => {
    const scriptHostFake = path.resolve(__dirname, 'fixtures', 'host-externo-fake.js');

    it('atualiza cache de texto e dispara callback de evento alterado', async () => {
        const infraestrutura = new InfraestruturaJavaSwing({
            comando: process.execPath,
            argumentos: [scriptHostFake],
            tempoLimiteProntoMs: 2_000,
        });

        const janela = infraestrutura.criarJanela(640, 480, 'Teste');
        const caixa = infraestrutura.criarCaixaTexto(janela, '');

        const callback = jest.fn().mockResolvedValue(undefined);
        infraestrutura.conectarEvento(caixa, 'alterado', callback);

        infraestrutura.definirTexto(caixa, 'novo valor');

        await esperarAte(() => callback.mock.calls.length > 0);

        expect(callback).toHaveBeenCalledWith('novo valor');
        expect(infraestrutura.obterTexto(caixa)).toBe('novo valor');

        infraestrutura.encerrar();
    });
});
