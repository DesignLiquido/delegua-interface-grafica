package br.com.designliquido.delegua.gui;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import java.awt.Container;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public final class HostSwing {
    private final Gson gson = new Gson();
    private final PrintWriter saida;
    private final Map<String, JComponent> componentes = new HashMap<>();
    private final Map<String, JFrame> janelas = new HashMap<>();

    private HostSwing(PrintWriter saida) {
        this.saida = saida;
    }

    public static void main(String[] args) throws IOException {
        PrintWriter saida = new PrintWriter(System.out, true, StandardCharsets.UTF_8);
        BufferedReader entrada = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));

        HostSwing host = new HostSwing(saida);
        host.enviar(mensagem("pronto"));

        String linha;
        while ((linha = entrada.readLine()) != null) {
            final String linhaAtual = linha.trim();
            if (linhaAtual.isEmpty()) {
                continue;
            }

            JsonObject mensagem;
            try {
                mensagem = host.gson.fromJson(linhaAtual, JsonObject.class);
                if (mensagem == null || !mensagem.has("tipo")) {
                    host.enviar(host.erro("protocolo", "Mensagem sem campo tipo."));
                    continue;
                }
            } catch (Exception e) {
                host.enviar(host.erro("protocolo", "JSON invalido recebido."));
                continue;
            }

            SwingUtilities.invokeLater(() -> host.processarMensagem(mensagem));
        }
    }

    private void processarMensagem(JsonObject mensagem) {
        String tipo = texto(mensagem, "tipo", "");
        switch (tipo) {
            case "criar-janela" -> criarJanela(mensagem);
            case "criar-botao" -> criarBotao(mensagem);
            case "criar-rotulo" -> criarRotulo(mensagem);
            case "criar-caixa-texto" -> criarCaixaTexto(mensagem);
            case "criar-caixa-vertical" -> criarCaixa(mensagem, true);
            case "criar-caixa-horizontal" -> criarCaixa(mensagem, false);
            case "definir-texto" -> definirTexto(mensagem);
            case "encerrar" -> encerrar();
            default -> enviar(erro("protocolo", "Tipo de mensagem nao suportado: " + tipo));
        }
    }

    private void criarJanela(JsonObject mensagem) {
        String id = texto(mensagem, "id", "");
        if (id.isEmpty()) {
            enviar(erro("protocolo", "criar-janela sem id"));
            return;
        }

        int largura = inteiro(mensagem, "largura", 800);
        int altura = inteiro(mensagem, "altura", 600);
        String titulo = texto(mensagem, "titulo", "Delégua");

        JFrame frame = new JFrame(titulo);
        frame.setSize(largura, altura);
        frame.setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);

        JPanel conteudo = new JPanel();
        conteudo.setLayout(new BoxLayout(conteudo, BoxLayout.Y_AXIS));
        frame.setContentPane(conteudo);

        frame.addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosed(WindowEvent e) {
                JsonObject fechado = mensagem("fechado");
                fechado.addProperty("codigo", 0);
                fechado.add("sinal", null);
                enviar(fechado);
            }
        });

        janelas.put(id, frame);
        componentes.put(id, conteudo);

        frame.setVisible(true);
        enviar(recebido(mensagem));
    }

    private void criarBotao(JsonObject mensagem) {
        String id = texto(mensagem, "id", "");
        String paiId = texto(mensagem, "paiId", "");
        String rotulo = texto(mensagem, "rotulo", "Botao");

        Container pai = obterContainer(paiId);
        if (pai == null) {
            enviar(erro("host", "Pai nao encontrado para criar-botao: " + paiId));
            return;
        }

        JButton botao = new JButton(rotulo);
        botao.addActionListener(_ -> {
            JsonObject evento = mensagem("evento");
            evento.addProperty("componenteId", id);
            evento.addProperty("evento", "clique");
            enviar(evento);
        });

        pai.add(botao);
        pai.revalidate();
        pai.repaint();
        componentes.put(id, botao);
        enviar(recebido(mensagem));
    }

    private void criarRotulo(JsonObject mensagem) {
        String id = texto(mensagem, "id", "");
        String paiId = texto(mensagem, "paiId", "");
        String texto = texto(mensagem, "texto", "");

        Container pai = obterContainer(paiId);
        if (pai == null) {
            enviar(erro("host", "Pai nao encontrado para criar-rotulo: " + paiId));
            return;
        }

        JLabel rotulo = new JLabel(texto);
        pai.add(rotulo);
        pai.revalidate();
        pai.repaint();
        componentes.put(id, rotulo);
        enviar(recebido(mensagem));
    }

    private void criarCaixaTexto(JsonObject mensagem) {
        String id = texto(mensagem, "id", "");
        String paiId = texto(mensagem, "paiId", "");
        String textoInicial = texto(mensagem, "textoInicial", "");

        Container pai = obterContainer(paiId);
        if (pai == null) {
            enviar(erro("host", "Pai nao encontrado para criar-caixa-texto: " + paiId));
            return;
        }

        JTextField caixa = new JTextField(textoInicial);
        caixa.getDocument().addDocumentListener(new SimplesDocumentListener(() -> {
            JsonObject atualizado = mensagem("valor-atualizado");
            atualizado.addProperty("id", id);
            atualizado.addProperty("valor", caixa.getText());
            enviar(atualizado);

            JsonObject evento = mensagem("evento");
            evento.addProperty("componenteId", id);
            evento.addProperty("evento", "alterado");
            evento.addProperty("valor", caixa.getText());
            enviar(evento);
        }));

        pai.add(caixa);
        pai.revalidate();
        pai.repaint();
        componentes.put(id, caixa);
        enviar(recebido(mensagem));
    }

    private void criarCaixa(JsonObject mensagem, boolean vertical) {
        String id = texto(mensagem, "id", "");
        String paiId = texto(mensagem, "paiId", "");

        Container pai = obterContainer(paiId);
        if (pai == null) {
            enviar(erro("host", "Pai nao encontrado para caixa: " + paiId));
            return;
        }

        JPanel caixa = new JPanel();
        caixa.setLayout(new BoxLayout(caixa, vertical ? BoxLayout.Y_AXIS : BoxLayout.X_AXIS));

        pai.add(caixa);
        pai.revalidate();
        pai.repaint();
        componentes.put(id, caixa);
        enviar(recebido(mensagem));
    }

    private void definirTexto(JsonObject mensagem) {
        String id = texto(mensagem, "id", "");
        String texto = texto(mensagem, "texto", "");

        JComponent componente = componentes.get(id);
        if (componente == null) {
            enviar(erro("host", "Componente nao encontrado: " + id));
            return;
        }

        if (componente instanceof JLabel rotulo) {
            rotulo.setText(texto);
        } else if (componente instanceof JButton botao) {
            botao.setText(texto);
        } else if (componente instanceof JTextField caixa) {
            caixa.setText(texto);

            JsonObject atualizado = mensagem("valor-atualizado");
            atualizado.addProperty("id", id);
            atualizado.addProperty("valor", texto);
            enviar(atualizado);
        }

        enviar(recebido(mensagem));
    }

    private void encerrar() {
        for (JFrame frame : janelas.values()) {
            frame.dispose();
        }

        componentes.clear();
        janelas.clear();

        JsonObject fechado = mensagem("fechado");
        fechado.addProperty("codigo", 0);
        fechado.add("sinal", null);
        enviar(fechado);
    }

    private Container obterContainer(String id) {
        JComponent componente = componentes.get(id);
        if (componente == null) {
            return null;
        }

        if (componente instanceof Container container) {
            return container;
        }

        return null;
    }

    private JsonObject recebido(JsonObject original) {
        JsonObject msg = mensagem("recebido");
        msg.add("payload", original);
        return msg;
    }

    private JsonObject erro(String origem, String descricao) {
        JsonObject msg = mensagem("erro");
        msg.addProperty("origem", origem);
        msg.addProperty("mensagem", descricao);
        return msg;
    }

    private JsonObject mensagem(String tipo) {
        JsonObject msg = new JsonObject();
        msg.addProperty("tipo", tipo);
        return msg;
    }

    private synchronized void enviar(JsonObject mensagem) {
        saida.println(gson.toJson(mensagem));
        saida.flush();
    }

    private static String texto(JsonObject objeto, String chave, String padrao) {
        JsonElement valor = objeto.get(chave);
        if (valor == null || valor.isJsonNull()) {
            return padrao;
        }

        return valor.getAsString();
    }

    private static int inteiro(JsonObject objeto, String chave, int padrao) {
        JsonElement valor = objeto.get(chave);
        if (valor == null || valor.isJsonNull()) {
            return padrao;
        }

        try {
            return valor.getAsInt();
        } catch (Exception e) {
            return padrao;
        }
    }
}
