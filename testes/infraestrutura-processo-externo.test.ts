import * as path from 'path';
import {
    InfraestruturaProcessoExterno,
    MensagemProcessoExterno,
} from '../fontes/infraestruturas/processo-externo/infraestrutura-processo-externo';

function aguardarMensagem(
    infraestrutura: InfraestruturaProcessoExterno,
    tipo: string,
    timeoutMs = 2_000
): Promise<MensagemProcessoExterno> {
    return new Promise((resolve, reject) => {
        const cancelar = infraestrutura.conectar(tipo, (mensagem) => {
            clearTimeout(timeout);
            cancelar();
            resolve(mensagem);
        });

        const timeout = setTimeout(() => {
            cancelar();
            reject(new Error(`Timeout aguardando mensagem ${tipo}`));
        }, timeoutMs);
    });
}

describe('InfraestruturaProcessoExterno', () => {
    const scriptHostFake = path.resolve(__dirname, 'fixtures', 'host-externo-fake.js');

    it('enfileira mensagens antes do pronto e envia apos handshake', async () => {
        const infraestrutura = new InfraestruturaProcessoExterno({
            comando: process.execPath,
            argumentos: [scriptHostFake],
            tempoLimiteProntoMs: 2_000,
        });

        const aguardandoRecebido = aguardarMensagem(infraestrutura, 'recebido');
        infraestrutura.enviar({ tipo: 'ping', valor: 123 });

        const recebido = await aguardandoRecebido;
        expect(recebido.payload.tipo).toBe('ping');
        expect(recebido.payload.valor).toBe(123);

        infraestrutura.encerrar();
    });

    it('emite erro de protocolo quando recebe JSON invalido do host', async () => {
        const infraestrutura = new InfraestruturaProcessoExterno({
            comando: process.execPath,
            argumentos: [scriptHostFake],
            tempoLimiteProntoMs: 2_000,
        });

        const aguardandoErro = new Promise<MensagemProcessoExterno>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout aguardando erro de protocolo'));
            }, 2_000);

            const cancelar = infraestrutura.conectar('erro', (mensagem) => {
                if (mensagem.origem !== 'protocolo') {
                    return;
                }

                clearTimeout(timeout);
                cancelar();
                resolve(mensagem);
            });
        });

        infraestrutura.enviar({ tipo: 'forcar-json-invalido' });

        const erro = await aguardandoErro;
        expect(erro.origem).toBe('protocolo');

        infraestrutura.encerrar();
    });
});
