import { ComponenteInterfaceGraficaInterface } from '../../interfaces/componente-interface-grafica-interface';
import { InfraestruturaGraficaInterface } from '../../interfaces/infraestrutura-grafica-interface';
import {
    InfraestruturaProcessoExterno,
    MensagemProcessoExterno,
    ProcessoExternoOpcoes,
} from '../processo-externo/infraestrutura-processo-externo';

export interface InfraestruturaWindowsOpcoes {
    /**
     * Comando de inicializacao do host Windows.
     * Exemplo: `delegua-interface-grafica-windows-host.exe`
     */
    comando?: string;

    /** Argumentos para o comando do host Windows. */
    argumentos?: string[];

    /** Diretorio de trabalho usado para iniciar o host. */
    diretorioTrabalho?: string;

    /** Variaveis de ambiente extras para o processo host. */
    variaveisAmbiente?: NodeJS.ProcessEnv;

    /** Timeout de handshake (mensagem `pronto`) em milissegundos. */
    tempoLimiteProntoMs?: number;
}

/**
 * Infraestrutura de interface grafica baseada em host Windows em processo externo.
 *
 * O host deve falar JSON line-delimited por stdin/stdout.
 */
export class InfraestruturaWindows implements InfraestruturaGraficaInterface {
    private contadorIds = 0;
    private readonly textosComponentes = new Map<string, string>();
    private readonly tratadoresEventos = new Map<string, Map<string, (...argumentos: any[]) => Promise<void>>>();
    private resolverLaco: (() => void) | null = null;

    private readonly processo: InfraestruturaProcessoExterno;

    constructor(opcoes: InfraestruturaWindowsOpcoes = {}) {
        const opcoesProcesso: ProcessoExternoOpcoes = {
            comando: opcoes.comando ?? 'delegua-interface-grafica-windows-host.exe',
            argumentos: opcoes.argumentos,
            diretorioTrabalho: opcoes.diretorioTrabalho,
            variaveisAmbiente: opcoes.variaveisAmbiente,
            tempoLimiteProntoMs: opcoes.tempoLimiteProntoMs,
        };

        this.processo = new InfraestruturaProcessoExterno(opcoesProcesso);

        this.processo.conectar('evento', (mensagem) => {
            const tratadoresComponente = this.tratadoresEventos.get(mensagem.componenteId);
            const tratador = tratadoresComponente?.get(mensagem.evento);
            if (!tratador) {
                return;
            }

            const argumentos = mensagem.valor !== undefined ? [mensagem.valor] : [];
            tratador(...argumentos).catch(console.error);
        });

        this.processo.conectar('valor-atualizado', (mensagem) => {
            if (mensagem.id) {
                this.textosComponentes.set(mensagem.id, mensagem.valor ?? '');
            }
        });

        this.processo.conectar('fechado', () => {
            this.encerrarInternamente();
        });

        this.processo.conectar('erro', (mensagem) => {
            const detalhe = mensagem?.mensagem ? ` ${mensagem.mensagem}` : '';
            console.error(`[InfraestruturaWindows]${detalhe}`);
        });
    }

    private proximoId(): string {
        return `delegua-gui-${++this.contadorIds}`;
    }

    private enviar(mensagem: MensagemProcessoExterno): void {
        this.processo.enviar(mensagem);
    }

    private encerrarInternamente(): void {
        if (this.resolverLaco) {
            this.resolverLaco();
            this.resolverLaco = null;
        }
    }

    criarJanela(largura: number, altura: number, titulo: string): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this.enviar({ tipo: 'criar-janela', id: idComponente, largura, altura, titulo });
        return { idComponente };
    }

    criarBotao(pai: ComponenteInterfaceGraficaInterface, rotulo: string): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this.enviar({ tipo: 'criar-botao', id: idComponente, paiId: pai.idComponente, rotulo });
        return { idComponente };
    }

    criarRotulo(pai: ComponenteInterfaceGraficaInterface, texto: string): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this.textosComponentes.set(idComponente, texto);
        this.enviar({ tipo: 'criar-rotulo', id: idComponente, paiId: pai.idComponente, texto });
        return { idComponente };
    }

    criarCaixaTexto(pai: ComponenteInterfaceGraficaInterface, textoInicial: string): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this.textosComponentes.set(idComponente, textoInicial);
        this.enviar({
            tipo: 'criar-caixa-texto',
            id: idComponente,
            paiId: pai.idComponente,
            textoInicial,
        });
        return { idComponente };
    }

    criarCaixaVertical(pai: ComponenteInterfaceGraficaInterface): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this.enviar({ tipo: 'criar-caixa-vertical', id: idComponente, paiId: pai.idComponente });
        return { idComponente };
    }

    criarCaixaHorizontal(pai: ComponenteInterfaceGraficaInterface): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this.enviar({ tipo: 'criar-caixa-horizontal', id: idComponente, paiId: pai.idComponente });
        return { idComponente };
    }

    criarCaixaLivre(pai: ComponenteInterfaceGraficaInterface): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this.enviar({ tipo: 'criar-caixa-livre', id: idComponente, paiId: pai.idComponente });
        return { idComponente };
    }

    definirTexto(componente: ComponenteInterfaceGraficaInterface, texto: string): void {
        this.textosComponentes.set(componente.idComponente, texto);
        this.enviar({ tipo: 'definir-texto', id: componente.idComponente, texto });
    }

    obterTexto(componente: ComponenteInterfaceGraficaInterface): string {
        return this.textosComponentes.get(componente.idComponente) ?? '';
    }

    definirPosicao(componente: ComponenteInterfaceGraficaInterface, x: number, y: number): void {
        this.enviar({ tipo: 'definir-posicao', id: componente.idComponente, x, y });
    }

    definirTamanho(componente: ComponenteInterfaceGraficaInterface, largura: number, altura: number): void {
        this.enviar({ tipo: 'definir-tamanho', id: componente.idComponente, largura, altura });
    }

    conectarEvento(
        componente: ComponenteInterfaceGraficaInterface,
        evento: string,
        callback: (...argumentos: any[]) => Promise<void>
    ): void {
        if (!this.tratadoresEventos.has(componente.idComponente)) {
            this.tratadoresEventos.set(componente.idComponente, new Map());
        }

        this.tratadoresEventos.get(componente.idComponente)!.set(evento, callback);
    }

    async iniciarLaco(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.resolverLaco = resolve;
        });
    }

    encerrar(): void {
        this.processo.encerrar();
        this.encerrarInternamente();
    }
}
