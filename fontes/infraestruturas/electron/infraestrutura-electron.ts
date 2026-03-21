import { InfraestruturaGraficaInterface } from '../../interfaces/infraestrutura-grafica-interface';
import { ComponenteInterfaceGraficaInterface } from '../../interfaces/componente-interface-grafica-interface';

/**
 * Mapeamento de nomes de eventos Delégua para eventos DOM correspondentes.
 */
const MAPA_EVENTOS: Record<string, string> = {
    clique: 'click',
    alterado: 'input',
    tecla: 'keydown',
    foco: 'focus',
    desfoco: 'blur',
};

/**
 * Infraestrutura de interface gráfica para o ambiente Electron.
 * Cria elementos DOM no `document.body` da janela do Electron.
 *
 * O programa Delégua enxerga cada componente como um identificador opaco
 * (`ComponenteInterfaceGraficaInterface`). Internamente, este infraestrutura mantém um mapa entre esses
 * identificadores e os `HTMLElement`s correspondentes.
 *
 * Cada instância de `InfraestruturaElectron` gerencia uma janela independente:
 * um `div` flutuante criado sobre o conteúdo existente da página.
 */
export class InfraestruturaElectron implements InfraestruturaGraficaInterface {
    private readonly elementosPorId: Map<string, HTMLElement> = new Map();
    private contadorIds = 0;
    private sobreposicao: HTMLElement | null = null;
    private resolverLaco: (() => void) | null = null;

    // -------------------------------------------------------------------------
    // Helpers internos
    // -------------------------------------------------------------------------

    private proximoId(): string {
        return `delegua-gui-${++this.contadorIds}`;
    }

    private registrar(elemento: HTMLElement): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this.elementosPorId.set(idComponente, elemento);
        return { idComponente };
    }

    private obterElemento(componente: ComponenteInterfaceGraficaInterface): HTMLElement {
        const elemento = this.elementosPorId.get(componente.idComponente);
        if (!elemento) {
            throw new Error(
                `Componente '${componente.idComponente}' não encontrado. ` +
                `Verifique se ele foi criado pela mesma instância de InfraestruturaElectron.`
            );
        }
        return elemento;
    }

    // -------------------------------------------------------------------------
    // Criação de componentes
    // -------------------------------------------------------------------------

    criarJanela(largura: number, altura: number, titulo: string): ComponenteInterfaceGraficaInterface {
        this.sobreposicao = document.createElement('div');
        Object.assign(this.sobreposicao.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '9999',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        });

        const moldura = document.createElement('div');
        Object.assign(moldura.style, {
            background: '#f0f0f0',
            border: '1px solid #aaa',
            borderRadius: '5px',
            width: `${largura}px`,
            height: `${altura}px`,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
        });

        // Barra de título
        const barraTitulo = document.createElement('div');
        Object.assign(barraTitulo.style, {
            background: '#3c3c3c',
            color: 'white',
            padding: '6px 10px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
            flexShrink: '0',
        });

        const textoTitulo = document.createElement('span');
        textoTitulo.textContent = titulo;

        const botaoFechar = document.createElement('button');
        botaoFechar.textContent = '×';
        Object.assign(botaoFechar.style, {
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            lineHeight: '1',
            cursor: 'pointer',
            padding: '0 2px',
        });
        botaoFechar.addEventListener('click', () => this.encerrar());

        barraTitulo.appendChild(textoTitulo);
        barraTitulo.appendChild(botaoFechar);

        // Área de conteúdo — é aqui que os filhos da janela são inseridos
        const areaConteudo = document.createElement('div');
        Object.assign(areaConteudo.style, {
            flex: '1',
            overflow: 'auto',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxSizing: 'border-box',
        });

        moldura.appendChild(barraTitulo);
        moldura.appendChild(areaConteudo);
        this.sobreposicao.appendChild(moldura);
        document.body.appendChild(this.sobreposicao);

        // O idComponente da janela aponta para areaConteudo,
        // onde os filhos serão inseridos diretamente.
        return this.registrar(areaConteudo);
    }

    criarBotao(pai: ComponenteInterfaceGraficaInterface, rotulo: string): ComponenteInterfaceGraficaInterface {
        const elementoPai = this.obterElemento(pai);
        const botao = document.createElement('button');
        botao.textContent = rotulo;
        Object.assign(botao.style, {
            padding: '6px 16px',
            fontSize: '13px',
            cursor: 'pointer',
            border: '1px solid #999',
            borderRadius: '3px',
            background: '#e8e8e8',
            alignSelf: 'flex-start',
        });
        elementoPai.appendChild(botao);
        return this.registrar(botao);
    }

    criarRotulo(pai: ComponenteInterfaceGraficaInterface, texto: string): ComponenteInterfaceGraficaInterface {
        const elementoPai = this.obterElemento(pai);
        const rotulo = document.createElement('label');
        rotulo.textContent = texto;
        Object.assign(rotulo.style, {
            fontSize: '13px',
            color: '#222',
        });
        elementoPai.appendChild(rotulo);
        return this.registrar(rotulo);
    }

    criarCaixaTexto(pai: ComponenteInterfaceGraficaInterface, textoInicial: string): ComponenteInterfaceGraficaInterface {
        const elementoPai = this.obterElemento(pai);
        const entrada = document.createElement('input');
        entrada.type = 'text';
        entrada.value = textoInicial;
        Object.assign(entrada.style, {
            fontSize: '13px',
            padding: '5px 8px',
            border: '1px solid #999',
            borderRadius: '3px',
            boxSizing: 'border-box',
        });
        elementoPai.appendChild(entrada);
        return this.registrar(entrada);
    }

    criarCaixaVertical(pai: ComponenteInterfaceGraficaInterface): ComponenteInterfaceGraficaInterface {
        const elementoPai = this.obterElemento(pai);
        const caixa = document.createElement('div');
        Object.assign(caixa.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        });
        elementoPai.appendChild(caixa);
        return this.registrar(caixa);
    }

    criarCaixaHorizontal(pai: ComponenteInterfaceGraficaInterface): ComponenteInterfaceGraficaInterface {
        const elementoPai = this.obterElemento(pai);
        const caixa = document.createElement('div');
        Object.assign(caixa.style, {
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            alignItems: 'center',
        });
        elementoPai.appendChild(caixa);
        return this.registrar(caixa);
    }

    // -------------------------------------------------------------------------
    // Leitura e escrita de propriedades
    // -------------------------------------------------------------------------

    definirTexto(componente: ComponenteInterfaceGraficaInterface, texto: string): void {
        const elemento = this.obterElemento(componente);
        if (elemento instanceof HTMLInputElement || elemento instanceof HTMLTextAreaElement) {
            elemento.value = texto;
        } else {
            elemento.textContent = texto;
        }
    }

    obterTexto(componente: ComponenteInterfaceGraficaInterface): string {
        const elemento = this.obterElemento(componente);
        if (elemento instanceof HTMLInputElement || elemento instanceof HTMLTextAreaElement) {
            return elemento.value;
        }
        return elemento.textContent ?? '';
    }

    // -------------------------------------------------------------------------
    // Eventos
    // -------------------------------------------------------------------------

    conectarEvento(
        componente: ComponenteInterfaceGraficaInterface,
        evento: string,
        callback: (...argumentos: any[]) => Promise<void>
    ): void {
        const elemento = this.obterElemento(componente);
        const eventoDOM = MAPA_EVENTOS[evento] ?? evento;

        elemento.addEventListener(eventoDOM, (e: Event) => {
            // Para o evento 'alterado' em campos de texto, passa o valor atual.
            // Para demais eventos, não passa argumentos ao callback.
            if (
                evento === 'alterado' &&
                (elemento instanceof HTMLInputElement || elemento instanceof HTMLTextAreaElement)
            ) {
                callback(elemento.value).catch(console.error);
            } else {
                callback().catch(console.error);
            }
        });
    }

    // -------------------------------------------------------------------------
    // Ciclo de vida
    // -------------------------------------------------------------------------

    async iniciarLaco(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.resolverLaco = resolve;
        });
    }

    encerrar(): void {
        if (this.sobreposicao?.parentNode) {
            this.sobreposicao.parentNode.removeChild(this.sobreposicao);
            this.sobreposicao = null;
        }
        this.elementosPorId.clear();

        if (this.resolverLaco) {
            this.resolverLaco();
            this.resolverLaco = null;
        }
    }
}
