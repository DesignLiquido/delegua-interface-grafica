import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

export interface ProcessoExternoOpcoes {
    comando: string;
    argumentos?: string[];
    diretorioTrabalho?: string;
    variaveisAmbiente?: NodeJS.ProcessEnv;
    tempoLimiteProntoMs?: number;
}

export interface MensagemProcessoExterno {
    tipo: string;
    [chave: string]: any;
}

type TratadorMensagem = (mensagem: MensagemProcessoExterno) => void;

/**
 * Camada de transporte para hosts de interface gráfica executados em processo externo.
 *
 * Protocolo: JSON line-delimited em stdin/stdout.
 */
export class InfraestruturaProcessoExterno {
    private readonly processo: ChildProcessWithoutNullStreams;
    private readonly tratadores: Map<string, Set<TratadorMensagem>> = new Map();
    private readonly filaMensagensAguardandoPronto: MensagemProcessoExterno[] = [];
    private bufferStdout = '';
    private pronto = false;
    private encerrado = false;
    private temporizadorPronto: NodeJS.Timeout | null = null;

    constructor(private readonly opcoes: ProcessoExternoOpcoes) {
        this.processo = spawn(opcoes.comando, opcoes.argumentos ?? [], {
            cwd: opcoes.diretorioTrabalho,
            env: opcoes.variaveisAmbiente,
            stdio: 'pipe',
        });

        this.configurarEventosProcesso();
        this.configurarTimeoutPronto();
    }

    conectar(tipoMensagem: string, tratador: TratadorMensagem): () => void {
        if (!this.tratadores.has(tipoMensagem)) {
            this.tratadores.set(tipoMensagem, new Set());
        }

        this.tratadores.get(tipoMensagem)!.add(tratador);

        return () => {
            this.tratadores.get(tipoMensagem)?.delete(tratador);
        };
    }

    enviar(mensagem: MensagemProcessoExterno): void {
        if (this.encerrado) {
            return;
        }

        if (!this.pronto && mensagem.tipo !== 'encerrar') {
            this.filaMensagensAguardandoPronto.push(mensagem);
            return;
        }

        this.escreverMensagem(mensagem);
    }

    encerrar(): void {
        if (this.encerrado) {
            return;
        }

        this.enviar({ tipo: 'encerrar' });
        this.finalizarEstadoLocal();

        if (!this.processo.killed) {
            this.processo.kill();
        }
    }

    private configurarEventosProcesso(): void {
        this.processo.stdin.on('error', (erro: any) => {
            if (erro?.code === 'EPIPE') {
                this.emitir('erro', {
                    tipo: 'erro',
                    origem: 'stdin',
                    mensagem: 'Pipe de entrada fechado pelo host externo (EPIPE).',
                });
                return;
            }

            this.emitir('erro', {
                tipo: 'erro',
                origem: 'stdin',
                mensagem: erro?.message ?? 'Erro desconhecido no stdin do processo externo.',
            });
        });

        this.processo.stdout.setEncoding('utf8');
        this.processo.stdout.on('data', (dados: string) => {
            this.bufferStdout += dados;
            this.processarBufferStdout();
        });

        this.processo.stderr.setEncoding('utf8');
        this.processo.stderr.on('data', (dados: string) => {
            const texto = dados.trim();
            if (!texto) {
                return;
            }

            this.emitir('erro', {
                tipo: 'erro',
                origem: 'stderr',
                mensagem: texto,
            });
        });

        this.processo.on('error', (erro: Error) => {
            this.emitir('erro', {
                tipo: 'erro',
                origem: 'processo',
                mensagem: erro.message,
            });

            this.emitir('fechado', {
                tipo: 'fechado',
                codigo: null,
                sinal: null,
            });

            this.finalizarEstadoLocal();
        });

        this.processo.on('close', (codigo: number | null, sinal: NodeJS.Signals | null) => {
            this.emitir('fechado', {
                tipo: 'fechado',
                codigo,
                sinal,
            });

            this.finalizarEstadoLocal();
        });
    }

    private configurarTimeoutPronto(): void {
        const tempoLimiteProntoMs = this.opcoes.tempoLimiteProntoMs ?? 5_000;

        this.temporizadorPronto = setTimeout(() => {
            if (this.pronto || this.encerrado) {
                return;
            }

            this.emitir('erro', {
                tipo: 'erro',
                origem: 'handshake',
                mensagem: `Timeout aguardando mensagem 'pronto' do host externo em ${tempoLimiteProntoMs} ms.`,
            });
        }, tempoLimiteProntoMs);
    }

    private processarBufferStdout(): void {
        const linhas = this.bufferStdout.split(/\r?\n/);
        this.bufferStdout = linhas.pop() ?? '';

        for (const linha of linhas) {
            const linhaNormalizada = linha.trim();
            if (!linhaNormalizada) {
                continue;
            }

            let mensagem: MensagemProcessoExterno;
            try {
                mensagem = JSON.parse(linhaNormalizada);
            } catch (_) {
                this.emitir('erro', {
                    tipo: 'erro',
                    origem: 'protocolo',
                    mensagem: `JSON inválido recebido do host externo: ${linhaNormalizada}`,
                });
                continue;
            }

            if (mensagem.tipo === 'pronto') {
                this.marcarPronto();
            }

            this.emitir(mensagem.tipo, mensagem);
        }
    }

    private marcarPronto(): void {
        if (this.pronto) {
            return;
        }

        this.pronto = true;

        if (this.temporizadorPronto) {
            clearTimeout(this.temporizadorPronto);
            this.temporizadorPronto = null;
        }

        while (this.filaMensagensAguardandoPronto.length > 0) {
            const mensagem = this.filaMensagensAguardandoPronto.shift()!;
            this.escreverMensagem(mensagem);
        }
    }

    private escreverMensagem(mensagem: MensagemProcessoExterno): void {
        try {
            this.processo.stdin.write(`${JSON.stringify(mensagem)}\n`);
        } catch (erro: any) {
            this.emitir('erro', {
                tipo: 'erro',
                origem: 'stdin',
                mensagem: erro?.message ?? 'Falha ao escrever mensagem no host externo.',
            });
        }
    }

    private emitir(tipoMensagem: string, mensagem: MensagemProcessoExterno): void {
        const inscritos = this.tratadores.get(tipoMensagem);
        if (!inscritos || inscritos.size === 0) {
            return;
        }

        for (const tratador of inscritos) {
            try {
                tratador(mensagem);
            } catch (erro: any) {
                const mensagemErro = erro?.message ?? 'Erro desconhecido em tratador de mensagem.';
                if (tipoMensagem !== 'erro') {
                    this.emitir('erro', {
                        tipo: 'erro',
                        origem: 'tratador',
                        mensagem: mensagemErro,
                    });
                }
            }
        }
    }

    private finalizarEstadoLocal(): void {
        if (this.encerrado) {
            return;
        }

        this.encerrado = true;
        this.pronto = false;
        this.filaMensagensAguardandoPronto.length = 0;

        if (this.temporizadorPronto) {
            clearTimeout(this.temporizadorPronto);
            this.temporizadorPronto = null;
        }
    }
}
