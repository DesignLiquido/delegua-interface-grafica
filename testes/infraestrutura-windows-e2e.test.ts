import { InfraestruturaWindows } from '../fontes/infraestruturas/windows/infraestrutura-windows';

function esperarAte(
    condicao: () => boolean,
    timeoutMs = 5_000,
    intervaloMs = 25
): Promise<void> {
    return new Promise((resolve, reject) => {
        const inicio = Date.now();

        const verificar = () => {
            if (condicao()) {
                resolve();
                return;
            }

            if (Date.now() - inicio > timeoutMs) {
                reject(new Error('Timeout aguardando condicao do teste E2E Windows.'));
                return;
            }

            setTimeout(verificar, intervaloMs);
        };

        verificar();
    });
}

const executarE2E = process.env.DELEGUA_WINDOWS_E2E === '1';
const caminhoExecutavel = process.env.DELEGUA_WINDOWS_E2E_EXE;

const descreverE2E = executarE2E && caminhoExecutavel ? describe : describe.skip;

descreverE2E('InfraestruturaWindows E2E com host real', () => {
    it('consegue inicializar, enviar comandos e receber evento alterado', async () => {
        const infraestrutura = new InfraestruturaWindows({
            comando: caminhoExecutavel!,
            tempoLimiteProntoMs: 10_000,
        });

        try {
            const janela = infraestrutura.criarJanela(480, 300, 'E2E Windows');
            const caixa = infraestrutura.criarCaixaTexto(janela, '');

            const callbackAlterado = jest.fn().mockResolvedValue(undefined);
            infraestrutura.conectarEvento(caixa, 'alterado', callbackAlterado);

            infraestrutura.definirTexto(caixa, 'texto-e2e-windows');

            await esperarAte(() => callbackAlterado.mock.calls.length > 0, 10_000);

            expect(infraestrutura.obterTexto(caixa)).toBe('texto-e2e-windows');
        } finally {
            infraestrutura.encerrar();
        }
    }, 20_000);
});
