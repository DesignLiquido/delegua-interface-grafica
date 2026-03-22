package br.com.designliquido.delegua.gui;

import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;

public final class SimplesDocumentListener implements DocumentListener {
    private final Runnable acao;

    public SimplesDocumentListener(Runnable acao) {
        this.acao = acao;
    }

    @Override
    public void insertUpdate(DocumentEvent e) {
        acao.run();
    }

    @Override
    public void removeUpdate(DocumentEvent e) {
        acao.run();
    }

    @Override
    public void changedUpdate(DocumentEvent e) {
        acao.run();
    }
}
