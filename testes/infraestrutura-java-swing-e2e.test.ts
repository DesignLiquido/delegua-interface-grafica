import { InfraestruturaJavaSwing } from '../fontes/infraestruturas/java-swing/infraestrutura-java-swing';

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
                reject(new Error('Timeout aguardando condicao do teste E2E Swing.'));
                return;
            }

            setTimeout(verificar, intervaloMs);
        };

        verificar();
    });
}

const executarE2E = process.env.DELEGUA_SWING_E2E === '1';
const caminhoJar = process.env.DELEGUA_SWING_E2E_JAR;

const descreverE2E = executarE2E && caminhoJar ? describe : describe.skip;

descreverE2E('InfraestruturaJavaSwing E2E com host real', () => {
    it('consegue inicializar, enviar comandos e receber evento alterado', async () => {
        const infraestrutura = new InfraestruturaJavaSwing({
            comando: process.env.DELEGUA_SWING_E2E_COMANDO ?? 'java',
            argumentos: ['-jar', caminhoJar!],
            tempoLimiteProntoMs: 10_000,
        });

        const janela = infraestrutura.criarJanela(480, 300, 'E2E Swing');
        const caixa = infraestrutura.criarCaixaTexto(janela, '');

        const callbackAlterado = jest.fn().mockResolvedValue(undefined);
        infraestrutura.conectarEvento(caixa, 'alterado', callbackAlterado);

        infraestrutura.definirTexto(caixa, 'texto-e2e');

        await esperarAte(() => callbackAlterado.mock.calls.length > 0, 10_000);

        expect(infraestrutura.obterTexto(caixa)).toBe('texto-e2e');

        infraestrutura.encerrar();
    });
});
