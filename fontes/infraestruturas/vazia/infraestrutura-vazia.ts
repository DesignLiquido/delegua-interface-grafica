import { InfraestruturaGraficaInterface } from '../../interfaces/infraestrutura-grafica-interface';
import { ComponenteInterfaceGraficaInterface } from '../../interfaces/componente-interface-grafica-interface';

/**
 * Infraestrutura sem operações: não cria janelas nem elementos visuais.
 * Útil para testes unitários e ambientes sem interface gráfica.
 */
export class InfraestruturaVazia implements InfraestruturaGraficaInterface {
    private contadorIds = 0;
    private textos: Map<string, string> = new Map();

    private novoComponente(): ComponenteInterfaceGraficaInterface {
        return { idComponente: `componente-${++this.contadorIds}` };
    }

    criarJanela(_largura: number, _altura: number, _titulo: string): ComponenteInterfaceGraficaInterface {
        return this.novoComponente();
    }

    criarBotao(_pai: ComponenteInterfaceGraficaInterface, _rotulo: string): ComponenteInterfaceGraficaInterface {
        return this.novoComponente();
    }

    criarRotulo(_pai: ComponenteInterfaceGraficaInterface, texto: string): ComponenteInterfaceGraficaInterface {
        const componente = this.novoComponente();
        this.textos.set(componente.idComponente, texto);
        return componente;
    }

    criarCaixaTexto(_pai: ComponenteInterfaceGraficaInterface, textoInicial: string): ComponenteInterfaceGraficaInterface {
        const componente = this.novoComponente();
        this.textos.set(componente.idComponente, textoInicial);
        return componente;
    }

    criarCaixaVertical(_pai: ComponenteInterfaceGraficaInterface): ComponenteInterfaceGraficaInterface {
        return this.novoComponente();
    }

    criarCaixaHorizontal(_pai: ComponenteInterfaceGraficaInterface): ComponenteInterfaceGraficaInterface {
        return this.novoComponente();
    }

    definirTexto(componente: ComponenteInterfaceGraficaInterface, texto: string): void {
        this.textos.set(componente.idComponente, texto);
    }

    obterTexto(componente: ComponenteInterfaceGraficaInterface): string {
        return this.textos.get(componente.idComponente) ?? '';
    }

    conectarEvento(
        _componente: ComponenteInterfaceGraficaInterface,
        _evento: string,
        _callback: (...argumentos: any[]) => Promise<void>
    ): void {}

    async iniciarLaco(): Promise<void> {}

    encerrar(): void {}
}
