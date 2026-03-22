import { ComponenteInterfaceGraficaInterface } from '../../interfaces/componente-interface-grafica-interface';
import { InfraestruturaGraficaInterface } from '../../interfaces/infraestrutura-grafica-interface';
import {
    InfraestruturaProcessoExterno,
    MensagemProcessoExterno,
    ProcessoExternoOpcoes,
} from '../processo-externo/infraestrutura-processo-externo';

export interface InfraestruturaGtkOpcoes {
    /**
     * Comando de inicialização do host GTK.
     * Exemplo: `delegua-interface-grafica-gtk-host`
     */
    comando?: string;

    /** Argumentos para o comando de host GTK. */
    argumentos?: string[];

    /** Diretório de trabalho usado para iniciar o host. */
    diretorioTrabalho?: string;

    /** Variáveis de ambiente extras para o processo host. */
    variaveisAmbiente?: NodeJS.ProcessEnv;

    /** Timeout de handshake (mensagem `pronto`) em milissegundos. */
    tempoLimiteProntoMs?: number;
}

/**
 * Infraestrutura de interface gráfica baseada em host GTK em processo externo.
 *
 * O host deve falar JSON line-delimited por stdin/stdout.
 */
export class InfraestruturaGtk implements InfraestruturaGraficaInterface {
    private contadorIds = 0;
    private readonly textosComponentes = new Map<string, string>();
    private readonly tratadoresEventos = new Map<string, Map<string, (...argumentos: any[]) => Promise<void>>>();
    private resolverLaco: (() => void) | null = null;

    private readonly processo: InfraestruturaProcessoExterno;

    constructor(opcoes: InfraestruturaGtkOpcoes = {}) {
        const opcoesProcesso: ProcessoExternoOpcoes = {
            comando: opcoes.comando ?? 'delegua-interface-grafica-gtk-host',
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
            console.error(`[InfraestruturaGtk]${detalhe}`);
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

    definirTexto(componente: ComponenteInterfaceGraficaInterface, texto: string): void {
        this.textosComponentes.set(componente.idComponente, texto);
        this.enviar({ tipo: 'definir-texto', id: componente.idComponente, texto });
    }

    obterTexto(componente: ComponenteInterfaceGraficaInterface): string {
        return this.textosComponentes.get(componente.idComponente) ?? '';
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
