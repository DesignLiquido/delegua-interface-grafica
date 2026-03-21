/**
 * Identificador opaco de um componente de interface gráfica.
 * Delégua recebe e devolve este objeto às funções da biblioteca.
 * Cada infraestrutura é responsável por implementar e interpretar o conteúdo interno.
 */
export interface ComponenteInterfaceGraficaInterface {
    readonly idComponente: string;
}
