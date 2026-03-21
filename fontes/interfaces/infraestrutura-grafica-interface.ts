import { ComponenteInterfaceGraficaInterface } from './componente-interface-grafica-interface';

/**
 * Contrato que todo infraestrutura de interface gráfica deve implementar.
 * O infraestrutura é responsável por criar e manipular os elementos visuais
 * no ambiente de execução (Electron, navegador, etc.).
 *
 * As chamadas de eventos recebem um callback já resolvido: o backend
 * não precisa conhecer o interpretador nem os tipos de Delégua.
 */
export interface InfraestruturaGraficaInterface {
    // Criação de componentes
    criarJanela(largura: number, altura: number, titulo: string): ComponenteInterfaceGraficaInterface;
    criarBotao(pai: ComponenteInterfaceGraficaInterface, rotulo: string): ComponenteInterfaceGraficaInterface;
    criarRotulo(pai: ComponenteInterfaceGraficaInterface, texto: string): ComponenteInterfaceGraficaInterface;
    criarCaixaTexto(pai: ComponenteInterfaceGraficaInterface, textoInicial: string): ComponenteInterfaceGraficaInterface;
    criarCaixaVertical(pai: ComponenteInterfaceGraficaInterface): ComponenteInterfaceGraficaInterface;
    criarCaixaHorizontal(pai: ComponenteInterfaceGraficaInterface): ComponenteInterfaceGraficaInterface;

    // Leitura e escrita de propriedades
    definirTexto(componente: ComponenteInterfaceGraficaInterface, texto: string): void;
    obterTexto(componente: ComponenteInterfaceGraficaInterface): string;

    /**
     * Registra um callback nativo a ser invocado quando o evento ocorrer.
     * O callback já encapsula a chamada ao interpretador de Delégua,
     * portanto o infraestrutura só precisa chamá-lo no momento certo.
     * @param componente O componente-alvo do evento.
     * @param evento Nome do evento: 'clique', 'alterado', 'tecla', etc.
     * @param callback Função assíncrona a ser chamada quando o evento ocorrer.
     */
    conectarEvento(
        componente: ComponenteInterfaceGraficaInterface,
        evento: string,
        callback: (...argumentos: any[]) => Promise<void>
    ): void;

    /**
     * Inicia o laço de eventos. Resolve quando a janela principal for fechada
     * ou quando `encerrar()` for chamado.
     */
    iniciarLaco(): Promise<void>;

    /** Encerra o laço de eventos e fecha todas as janelas. */
    encerrar(): void;
}
