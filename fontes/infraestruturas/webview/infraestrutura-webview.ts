import { InfraestruturaGraficaInterface } from '../../interfaces/infraestrutura-grafica-interface';
import { ComponenteInterfaceGraficaInterface } from '../../interfaces/componente-interface-grafica-interface';

/**
 * Infraestrutura de interface gráfica para WebView do VS Code.
 *
 * Recebe um `WebviewPanel` (do VS Code) como dependência; não importa o
 * módulo `vscode` diretamente para que a biblioteca possa ser distribuída
 * sem depender do ambiente VS Code.
 *
 * Todas as operações de criação e manipulação de elementos são enviadas ao
 * WebView via `postMessage`. Eventos do WebView (cliques, alterações) chegam
 * via `onDidReceiveMessage` e disparam os callbacks registrados em Delégua.
 *
 * `obterTexto` é síncrono: os valores das caixas de texto são mantidos em
 * cache local, atualizado sempre que o WebView envia uma mensagem
 * `valor-atualizado`.
 */
export class InfraestruturaWebView implements InfraestruturaGraficaInterface {
    private contadorIds = 0;
    private readonly textosComponentes = new Map<string, string>();
    private resolverLaco: (() => void) | null = null;
    private readonly tratadoresEventos = new Map<
        string,
        Map<string, (...argumentos: any[]) => Promise<void>>
    >();
    private readonly nonce: string;

    constructor(private readonly painel: any) {
        this.nonce = Math.random().toString(36).substring(2, 15) +
                     Math.random().toString(36).substring(2, 15);

        painel.webview.onDidReceiveMessage((msg: any) => {
            if (msg.tipo === 'evento') {
                const tratadores = this.tratadoresEventos.get(msg.componenteId);
                if (tratadores) {
                    const cb = tratadores.get(msg.evento);
                    if (cb) {
                        const args = msg.valor !== undefined ? [msg.valor] : [];
                        cb(...args).catch(console.error);
                    }
                }
            } else if (msg.tipo === 'valor-atualizado') {
                this.textosComponentes.set(msg.id, msg.valor);
            } else if (msg.tipo === 'fechado') {
                this._encerrarInterno();
            }
        });

        painel.onDidDispose(() => {
            this._encerrarInterno();
        });

        painel.webview.html = this._gerarHtml();
    }

    // -------------------------------------------------------------------------
    // Helpers internos
    // -------------------------------------------------------------------------

    private proximoId(): string {
        return `delegua-gui-${++this.contadorIds}`;
    }

    private _enviar(msg: object): void {
        this.painel.webview.postMessage(msg);
    }

    private _encerrarInterno(): void {
        if (this.resolverLaco) {
            this.resolverLaco();
            this.resolverLaco = null;
        }
    }

    private _gerarHtml(): string {
        const { nonce } = this;
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interface Gráfica – Delégua</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #1e1e1e;
            padding: 16px;
        }
        .delegua-janela {
            background: #f0f0f0;
            border-radius: 5px;
            overflow: hidden;
            color: #222;
            display: inline-flex;
            flex-direction: column;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }
        .delegua-barra-titulo {
            background: #3c3c3c;
            color: white;
            padding: 6px 10px;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            user-select: none;
            flex-shrink: 0;
        }
        .delegua-barra-titulo button {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            line-height: 1;
            cursor: pointer;
            padding: 0 2px;
        }
        .delegua-conteudo {
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            overflow: auto;
            flex: 1;
        }
        .delegua-caixa-vertical {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .delegua-caixa-horizontal {
            display: flex;
            flex-direction: row;
            gap: 8px;
            align-items: center;
        }
        .delegua-botao {
            padding: 6px 16px;
            font-size: 13px;
            cursor: pointer;
            border: 1px solid #999;
            border-radius: 3px;
            background: #e8e8e8;
            align-self: flex-start;
        }
        .delegua-rotulo {
            font-size: 13px;
            color: #222;
        }
        .delegua-caixa-texto {
            font-size: 13px;
            padding: 5px 8px;
            border: 1px solid #999;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div id="delegua-raiz"></div>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const elementos = {};

        window.addEventListener('message', (evento) => {
            const msg = evento.data;
            switch (msg.tipo) {
                case 'criar-janela': {
                    const janela = document.createElement('div');
                    janela.className = 'delegua-janela';
                    if (msg.largura) janela.style.width = msg.largura + 'px';
                    if (msg.altura)  janela.style.height = msg.altura + 'px';

                    const barra = document.createElement('div');
                    barra.className = 'delegua-barra-titulo';
                    const tituloSpan = document.createElement('span');
                    tituloSpan.textContent = msg.titulo;
                    const btnFechar = document.createElement('button');
                    btnFechar.textContent = '×';
                    btnFechar.onclick = () => vscode.postMessage({ tipo: 'fechado' });
                    barra.appendChild(tituloSpan);
                    barra.appendChild(btnFechar);

                    const conteudo = document.createElement('div');
                    conteudo.className = 'delegua-conteudo';

                    janela.appendChild(barra);
                    janela.appendChild(conteudo);
                    document.getElementById('delegua-raiz').appendChild(janela);
                    elementos[msg.id] = conteudo;
                    break;
                }
                case 'criar-botao': {
                    const btn = document.createElement('button');
                    btn.className = 'delegua-botao';
                    btn.textContent = msg.rotulo;
                    btn.onclick = () => vscode.postMessage({
                        tipo: 'evento',
                        componenteId: msg.id,
                        evento: 'clique'
                    });
                    elementos[msg.paiId].appendChild(btn);
                    elementos[msg.id] = btn;
                    break;
                }
                case 'criar-rotulo': {
                    const lbl = document.createElement('label');
                    lbl.className = 'delegua-rotulo';
                    lbl.textContent = msg.texto;
                    elementos[msg.paiId].appendChild(lbl);
                    elementos[msg.id] = lbl;
                    break;
                }
                case 'criar-caixa-texto': {
                    const inp = document.createElement('input');
                    inp.className = 'delegua-caixa-texto';
                    inp.type = 'text';
                    inp.value = msg.textoInicial || '';
                    inp.addEventListener('input', () => {
                        vscode.postMessage({ tipo: 'valor-atualizado', id: msg.id, valor: inp.value });
                        vscode.postMessage({
                            tipo: 'evento',
                            componenteId: msg.id,
                            evento: 'alterado',
                            valor: inp.value
                        });
                    });
                    elementos[msg.paiId].appendChild(inp);
                    elementos[msg.id] = inp;
                    break;
                }
                case 'criar-caixa-vertical': {
                    const div = document.createElement('div');
                    div.className = 'delegua-caixa-vertical';
                    elementos[msg.paiId].appendChild(div);
                    elementos[msg.id] = div;
                    break;
                }
                case 'criar-caixa-horizontal': {
                    const div = document.createElement('div');
                    div.className = 'delegua-caixa-horizontal';
                    elementos[msg.paiId].appendChild(div);
                    elementos[msg.id] = div;
                    break;
                }
                case 'definir-texto': {
                    const el = elementos[msg.id];
                    if (el) {
                        if (el.tagName === 'INPUT') el.value = msg.texto;
                        else el.textContent = msg.texto;
                    }
                    break;
                }
                case 'encerrar': {
                    document.getElementById('delegua-raiz').innerHTML = '';
                    break;
                }
            }
        });
    </script>
</body>
</html>`;
    }

    // -------------------------------------------------------------------------
    // Criação de componentes
    // -------------------------------------------------------------------------

    criarJanela(largura: number, altura: number, titulo: string): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this._enviar({ tipo: 'criar-janela', id: idComponente, largura, altura, titulo });
        return { idComponente };
    }

    criarBotao(pai: ComponenteInterfaceGraficaInterface, rotulo: string): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this._enviar({ tipo: 'criar-botao', id: idComponente, paiId: pai.idComponente, rotulo });
        return { idComponente };
    }

    criarRotulo(pai: ComponenteInterfaceGraficaInterface, texto: string): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this.textosComponentes.set(idComponente, texto);
        this._enviar({ tipo: 'criar-rotulo', id: idComponente, paiId: pai.idComponente, texto });
        return { idComponente };
    }

    criarCaixaTexto(
        pai: ComponenteInterfaceGraficaInterface,
        textoInicial: string
    ): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this.textosComponentes.set(idComponente, textoInicial);
        this._enviar({
            tipo: 'criar-caixa-texto',
            id: idComponente,
            paiId: pai.idComponente,
            textoInicial
        });
        return { idComponente };
    }

    criarCaixaVertical(pai: ComponenteInterfaceGraficaInterface): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this._enviar({ tipo: 'criar-caixa-vertical', id: idComponente, paiId: pai.idComponente });
        return { idComponente };
    }

    criarCaixaHorizontal(pai: ComponenteInterfaceGraficaInterface): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this._enviar({ tipo: 'criar-caixa-horizontal', id: idComponente, paiId: pai.idComponente });
        return { idComponente };
    }

    // -------------------------------------------------------------------------
    // Leitura e escrita de propriedades
    // -------------------------------------------------------------------------

    definirTexto(componente: ComponenteInterfaceGraficaInterface, texto: string): void {
        this.textosComponentes.set(componente.idComponente, texto);
        this._enviar({ tipo: 'definir-texto', id: componente.idComponente, texto });
    }

    obterTexto(componente: ComponenteInterfaceGraficaInterface): string {
        return this.textosComponentes.get(componente.idComponente) ?? '';
    }

    // -------------------------------------------------------------------------
    // Eventos
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Ciclo de vida
    // -------------------------------------------------------------------------

    async iniciarLaco(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.resolverLaco = resolve;
        });
    }

    encerrar(): void {
        this._enviar({ tipo: 'encerrar' });
        this._encerrarInterno();
        try {
            this.painel.dispose();
        } catch (_) {
            // painel já descartado
        }
    }
}
