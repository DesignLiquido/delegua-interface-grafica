import { InterpretadorInterface } from '@designliquido/delegua';
import { InfraestruturaGraficaInterface } from './interfaces/infraestrutura-grafica-interface';
import { ComponenteInterfaceGraficaInterface } from './interfaces/componente-interface-grafica-interface';

/**
 * Biblioteca de interface gráfica para Delégua.
 *
 * Cada método público recebe o interpretador como primeiro argumento
 * porque são registrados como `FuncaoPadrao`, que repassa o visitante
 * automaticamente. Os argumentos seguintes são os fornecidos pelo código Delégua.
 */
export class InterfaceGrafica {
    constructor(private readonly backend: InfraestruturaGraficaInterface) {}

    /**
     * Cria a janela principal do programa.
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     * @param largura Largura em pixels.
     * @param altura Altura em pixels.
     * @param titulo Título exibido na barra da janela.
     */
    janela(
        _interpretador: InterpretadorInterface,
        largura: number,
        altura: number,
        titulo: string
    ): ComponenteInterfaceGraficaInterface {
        return this.backend.criarJanela(largura, altura, titulo);
    }

    /**
     * Cria um botão dentro do componente pai.
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     * @param pai Componente que conterá o botão.
     * @param rotulo Texto exibido no botão.
     */
    botao(
        _interpretador: InterpretadorInterface,
        pai: ComponenteInterfaceGraficaInterface,
        rotulo: string
    ): ComponenteInterfaceGraficaInterface {
        return this.backend.criarBotao(pai, rotulo);
    }

    /**
     * Cria um rótulo de texto dentro do componente pai.
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     * @param pai Componente que conterá o rótulo.
     * @param texto Texto exibido.
     */
    rotulo(
        _interpretador: InterpretadorInterface,
        pai: ComponenteInterfaceGraficaInterface,
        texto: string
    ): ComponenteInterfaceGraficaInterface {
        return this.backend.criarRotulo(pai, texto);
    }

    /**
     * Cria uma caixa de texto editável dentro do componente pai.
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     * @param pai Componente que conterá a caixa de texto.
     * @param textoInicial Valor inicial da caixa.
     */
    caixaTexto(
        _interpretador: InterpretadorInterface,
        pai: ComponenteInterfaceGraficaInterface,
        textoInicial: string = ''
    ): ComponenteInterfaceGraficaInterface {
        return this.backend.criarCaixaTexto(pai, textoInicial ?? '');
    }

    /**
     * Cria um contêiner com layout vertical (empilhamento de cima para baixo).
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     * @param pai Componente pai do contêiner.
     */
    caixaVertical(
        _interpretador: InterpretadorInterface,
        pai: ComponenteInterfaceGraficaInterface
    ): ComponenteInterfaceGraficaInterface {
        return this.backend.criarCaixaVertical(pai);
    }

    /**
     * Cria um contêiner com layout horizontal (empilhamento da esquerda para direita).
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     * @param pai Componente pai do contêiner.
     */
    caixaHorizontal(
        _interpretador: InterpretadorInterface,
        pai: ComponenteInterfaceGraficaInterface
    ): ComponenteInterfaceGraficaInterface {
        return this.backend.criarCaixaHorizontal(pai);
    }

    /**
     * Cria um contêiner com layout livre para posicionamento por coordenadas.
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     * @param pai Componente pai do contêiner.
     */
    caixaLivre(
        _interpretador: InterpretadorInterface,
        pai: ComponenteInterfaceGraficaInterface
    ): ComponenteInterfaceGraficaInterface {
        return this.backend.criarCaixaLivre(pai);
    }

    /**
     * Altera o texto de um componente (rótulo ou caixa de texto).
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     * @param componente Componente a ser alterado.
     * @param texto Novo texto.
     */
    definirTexto(
        _interpretador: InterpretadorInterface,
        componente: ComponenteInterfaceGraficaInterface,
        texto: string
    ): void {
        this.backend.definirTexto(componente, texto);
    }

    /**
     * Lê o texto atual de um componente (rótulo ou caixa de texto).
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     * @param componente Componente a ser lido.
     */
    obterTexto(
        _interpretador: InterpretadorInterface,
        componente: ComponenteInterfaceGraficaInterface
    ): string {
        return this.backend.obterTexto(componente);
    }

    /**
     * Define a posição do componente em relação ao contêiner pai.
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     * @param componente Componente a ser posicionado.
     * @param x Coordenada horizontal em pixels.
     * @param y Coordenada vertical em pixels.
     */
    definirPosicao(
        _interpretador: InterpretadorInterface,
        componente: ComponenteInterfaceGraficaInterface,
        x: number,
        y: number
    ): void {
        this.backend.definirPosicao(componente, x, y);
    }

    /**
     * Define o tamanho do componente.
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     * @param componente Componente a ser redimensionado.
     * @param largura Largura em pixels.
     * @param altura Altura em pixels.
     */
    definirTamanho(
        _interpretador: InterpretadorInterface,
        componente: ComponenteInterfaceGraficaInterface,
        largura: number,
        altura: number
    ): void {
        this.backend.definirTamanho(componente, largura, altura);
    }

    /**
     * Registra uma função Delégua para ser chamada ao clicar no componente.
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     * @param componente Componente que receberá o evento.
     * @param funcaoDelegua Função declarada em Delégua a ser invocada no clique.
     */
    aoClicar(
        interpretador: InterpretadorInterface,
        componente: ComponenteInterfaceGraficaInterface,
        funcaoDelegua: any
    ): void {
        this.backend.conectarEvento(componente, 'clique', async () => {
            await interpretador.executarChamavel(funcaoDelegua, []);
        });
    }

    /**
     * Registra uma função Delégua para ser chamada quando o texto do componente mudar.
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     * @param componente Componente que receberá o evento.
     * @param funcaoDelegua Função declarada em Delégua a ser invocada na mudança.
     */
    aoAlterar(
        interpretador: InterpretadorInterface,
        componente: ComponenteInterfaceGraficaInterface,
        funcaoDelegua: any
    ): void {
        this.backend.conectarEvento(componente, 'alterado', async (novoTexto: string) => {
            await interpretador.executarChamavel(funcaoDelegua, [novoTexto]);
        });
    }

    /**
     * Inicia o laço de eventos da interface gráfica. Este método bloqueia
     * a execução do programa Delégua até que a janela seja fechada.
     * Deve ser chamado após criar e configurar todos os componentes.
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     */
    async iniciar(_interpretador: InterpretadorInterface): Promise<void> {
        await this.backend.iniciarLaco();
    }

    /**
     * Encerra a interface gráfica e fecha todas as janelas.
     * @param interpretador Passado automaticamente pelo interpretador Delégua.
     */
    encerrar(_interpretador: InterpretadorInterface): void {
        this.backend.encerrar();
    }
}
