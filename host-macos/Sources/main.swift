import AppKit
import Foundation

// MARK: - Output Writer (thread-safe)

final class OutputWriter {
    static let shared = OutputWriter()
    private let lock = NSLock()

    func send(_ dict: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: dict),
              let line = String(data: data, encoding: .utf8) else { return }
        lock.lock()
        defer { lock.unlock() }
        print(line)
        fflush(stdout)
    }

    func sendError(origem: String, mensagem: String) {
        send(["tipo": "erro", "origem": origem, "mensagem": mensagem])
    }
}

// MARK: - Window Delegate

final class WindowDelegate: NSObject, NSWindowDelegate {
    func windowWillClose(_ notification: Notification) {
        OutputWriter.shared.send(["tipo": "fechado", "codigo": 0])
        DispatchQueue.main.async { NSApp.terminate(nil) }
    }
}

// MARK: - Button Target
// NSButton.target is a weak reference, so we need to keep the target alive separately.

final class ButtonTarget: NSObject {
    private let closure: () -> Void
    init(_ closure: @escaping () -> Void) { self.closure = closure }
    @objc func fire() { closure() }
}

// MARK: - Text Field Delegate

final class TextFieldDelegate: NSObject, NSTextFieldDelegate {
    let id: String
    init(id: String) { self.id = id }

    func controlTextDidChange(_ notification: Notification) {
        guard let field = notification.object as? NSTextField else { return }
        let valor = field.stringValue
        OutputWriter.shared.send(["tipo": "valor-atualizado", "id": id, "valor": valor])
        OutputWriter.shared.send(["tipo": "evento", "componenteId": id, "evento": "alterado", "valor": valor])
    }
}

// MARK: - Runtime

final class MacOSHostRuntime {
    private var viewsById: [String: NSView] = [:]
    private var windowsById: [String: NSWindow] = [:]
    // Retains delegates, button targets, and other associated objects.
    private var retained: [String: AnyObject] = [:]

    func processLine(_ line: String) {
        let trimmed = line.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }

        guard let data = trimmed.data(using: .utf8),
              let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
              let tipo = json["tipo"] as? String
        else {
            OutputWriter.shared.sendError(origem: "protocolo", mensagem: "JSON inválido ou sem campo tipo.")
            return
        }

        DispatchQueue.main.async { self.dispatch(tipo: tipo, message: json) }
    }

    private func dispatch(tipo: String, message: [String: Any]) {
        switch tipo {
        case "criar-janela":          createWindow(message)
        case "criar-botao":           createButton(message)
        case "criar-rotulo":          createLabel(message)
        case "criar-caixa-texto":     createTextField(message)
        case "criar-caixa-vertical":  createStack(message, vertical: true)
        case "criar-caixa-horizontal": createStack(message, vertical: false)
        case "definir-texto":         setText(message)
        case "encerrar":              closeAll()
        default:
            OutputWriter.shared.sendError(origem: "protocolo", mensagem: "Tipo de mensagem não suportado: \(tipo)")
        }
    }

    private func createWindow(_ msg: [String: Any]) {
        guard let id = msg["id"] as? String else {
            OutputWriter.shared.sendError(origem: "protocolo", mensagem: "criar-janela sem id")
            return
        }

        let width  = (msg["largura"] as? CGFloat) ?? 800
        let height = (msg["altura"]  as? CGFloat) ?? 600
        let titulo = (msg["titulo"]  as? String)  ?? "Delégua"

        let rect = NSRect(x: 0, y: 0, width: width, height: height)
        let style: NSWindow.StyleMask = [.titled, .closable, .miniaturizable, .resizable]
        let window = NSWindow(contentRect: rect, styleMask: style, backing: .buffered, defer: false)
        window.title = titulo
        window.center()

        let stack = NSStackView()
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 8
        stack.edgeInsets = NSEdgeInsets(top: 12, left: 12, bottom: 12, right: 12)
        stack.frame = NSRect(x: 0, y: 0, width: width, height: height)
        stack.autoresizingMask = [.width, .height]
        window.contentView = stack

        let delegate = WindowDelegate()
        window.delegate = delegate
        retained["window-delegate-\(id)"] = delegate

        windowsById[id] = window
        viewsById[id] = stack

        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    private func createButton(_ msg: [String: Any]) {
        guard let id       = msg["id"]    as? String,
              let parentId = msg["paiId"] as? String,
              let parent   = viewsById[parentId] as? NSStackView
        else {
            OutputWriter.shared.sendError(origem: "host", mensagem: "Pai não encontrado para criar-botao: \(msg["paiId"] ?? "nil")")
            return
        }

        let rotulo = (msg["rotulo"] as? String) ?? "Botão"
        let button = NSButton(title: rotulo, target: nil, action: nil)
        button.bezelStyle = .rounded

        let target = ButtonTarget { [id] in
            OutputWriter.shared.send(["tipo": "evento", "componenteId": id, "evento": "clique"])
        }
        button.target = target
        button.action = #selector(ButtonTarget.fire)
        retained["target-\(id)"] = target

        parent.addArrangedSubview(button)
        viewsById[id] = button
    }

    private func createLabel(_ msg: [String: Any]) {
        guard let id       = msg["id"]    as? String,
              let parentId = msg["paiId"] as? String,
              let parent   = viewsById[parentId] as? NSStackView
        else {
            OutputWriter.shared.sendError(origem: "host", mensagem: "Pai não encontrado para criar-rotulo: \(msg["paiId"] ?? "nil")")
            return
        }

        let texto = (msg["texto"] as? String) ?? ""
        let label = NSTextField(labelWithString: texto)
        parent.addArrangedSubview(label)
        viewsById[id] = label
    }

    private func createTextField(_ msg: [String: Any]) {
        guard let id       = msg["id"]    as? String,
              let parentId = msg["paiId"] as? String,
              let parent   = viewsById[parentId] as? NSStackView
        else {
            OutputWriter.shared.sendError(origem: "host", mensagem: "Pai não encontrado para criar-caixa-texto: \(msg["paiId"] ?? "nil")")
            return
        }

        let textoInicial = (msg["textoInicial"] as? String) ?? ""
        let field = NSTextField(string: textoInicial)
        field.widthAnchor.constraint(equalToConstant: 240).isActive = true

        let delegate = TextFieldDelegate(id: id)
        field.delegate = delegate
        retained["delegate-\(id)"] = delegate

        parent.addArrangedSubview(field)
        viewsById[id] = field
    }

    private func createStack(_ msg: [String: Any], vertical: Bool) {
        let op = vertical ? "criar-caixa-vertical" : "criar-caixa-horizontal"
        guard let id       = msg["id"]    as? String,
              let parentId = msg["paiId"] as? String,
              let parent   = viewsById[parentId] as? NSStackView
        else {
            OutputWriter.shared.sendError(origem: "host", mensagem: "Pai não encontrado para \(op): \(msg["paiId"] ?? "nil")")
            return
        }

        let stack = NSStackView()
        stack.orientation = vertical ? .vertical : .horizontal
        stack.alignment   = vertical ? .leading  : .centerY
        stack.spacing     = 8

        parent.addArrangedSubview(stack)
        viewsById[id] = stack
    }

    private func setText(_ msg: [String: Any]) {
        guard let id   = msg["id"] as? String,
              let view = viewsById[id]
        else {
            OutputWriter.shared.sendError(origem: "host", mensagem: "Componente não encontrado: \(msg["id"] ?? "nil")")
            return
        }

        let texto = (msg["texto"] as? String) ?? ""

        if let button = view as? NSButton {
            button.title = texto
        } else if let field = view as? NSTextField {
            field.stringValue = texto
            if field.isEditable {
                OutputWriter.shared.send(["tipo": "valor-atualizado", "id": id, "valor": texto])
                OutputWriter.shared.send(["tipo": "evento", "componenteId": id, "evento": "alterado", "valor": texto])
            }
        }
    }

    func closeAll() {
        for (_, window) in windowsById { window.close() }
        windowsById.removeAll()
        viewsById.removeAll()
        retained.removeAll()
        NSApp.terminate(nil)
    }
}

// MARK: - App Delegate

final class AppDelegate: NSObject, NSApplicationDelegate {
    let runtime = MacOSHostRuntime()

    func applicationDidFinishLaunching(_ notification: Notification) {
        OutputWriter.shared.send(["tipo": "pronto", "versao": "1.0.0-macos-host"])

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            while let line = readLine() {
                self?.runtime.processLine(line)
            }
            // stdin closed — terminate gracefully
            DispatchQueue.main.async { NSApp.terminate(nil) }
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return false
    }
}

// MARK: - Entry Point

let app = NSApplication.shared
app.setActivationPolicy(.regular)
let appDelegate = AppDelegate()
app.delegate = appDelegate
app.run()
