import { InfraestruturaGtk } from '../fontes/infraestruturas/gtk/infraestrutura-gtk';

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
                reject(new Error('Timeout aguardando condicao do teste E2E GTK.'));
                return;
            }

            setTimeout(verificar, intervaloMs);
        };

        verificar();
    });
}

const executarE2E = process.env.DELEGUA_GTK_E2E === '1';
const comandoHost = process.env.DELEGUA_GTK_E2E_CMD;

const descreverE2E = executarE2E && comandoHost ? describe : describe.skip;

descreverE2E('InfraestruturaGtk E2E com host real', () => {
    it('consegue inicializar, aplicar geometria e receber evento alterado', async () => {
        const infraestrutura = new InfraestruturaGtk({
            comando: comandoHost!,
            tempoLimiteProntoMs: 10_000,
        });

        try {
            const janela = infraestrutura.criarJanela(480, 300, 'E2E GTK');
            const areaLivre = infraestrutura.criarCaixaLivre(janela);
            const caixa = infraestrutura.criarCaixaTexto(areaLivre, '');
            const botao = infraestrutura.criarBotao(areaLivre, 'Enviar');

            infraestrutura.definirPosicao(caixa, 24, 32);
            infraestrutura.definirTamanho(caixa, 220, 32);
            infraestrutura.definirPosicao(botao, 24, 80);
            infraestrutura.definirTamanho(botao, 120, 36);

            const callbackAlterado = jest.fn().mockResolvedValue(undefined);
            infraestrutura.conectarEvento(caixa, 'alterado', callbackAlterado);

            infraestrutura.definirTexto(caixa, 'texto-e2e-gtk');

            await esperarAte(() => callbackAlterado.mock.calls.length > 0, 10_000);

            expect(infraestrutura.obterTexto(caixa)).toBe('texto-e2e-gtk');
        } finally {
            infraestrutura.encerrar();
        }
    }, 20_000);
});
