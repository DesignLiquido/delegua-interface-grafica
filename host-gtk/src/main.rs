use gtk4::prelude::*;
use gtk4::{Application, ApplicationWindow, Box as GtkBox, Button, Entry, Label, Orientation, Widget};
use serde_json::{json, Value};
use std::cell::RefCell;
use std::collections::HashMap;
use std::io::{self, BufRead, BufReader, Write};
use std::rc::Rc;
use std::sync::{Arc, Mutex};

#[derive(Clone)]
struct Runtime {
    components: Rc<RefCell<HashMap<String, Widget>>>,
    windows: Rc<RefCell<HashMap<String, ApplicationWindow>>>,
    writer: Arc<Mutex<io::Stdout>>,
}

impl Runtime {
    fn send(&self, message: Value) {
        if let Ok(mut writer) = self.writer.lock() {
            let _ = writeln!(writer, "{}", message);
            let _ = writer.flush();
        }
    }

    fn send_error(&self, origin: &str, message: &str) {
        self.send(json!({
            "tipo": "erro",
            "origem": origin,
            "mensagem": message,
        }));
    }

    fn get_parent_box(&self, parent_id: &str, operation: &str) -> Option<GtkBox> {
        let components = self.components.borrow();
        let Some(widget) = components.get(parent_id) else {
            self.send_error("host", &format!("Pai nao encontrado para {}: {}", operation, parent_id));
            return None;
        };

        widget.downcast_ref::<GtkBox>().cloned().or_else(|| {
            self.send_error("host", &format!("Pai invalido para {}: {}", operation, parent_id));
            None
        })
    }

    fn process_message(&self, app: &Application, message: Value) {
        let tipo = message
            .get("tipo")
            .and_then(Value::as_str)
            .unwrap_or_default();

        match tipo {
            "criar-janela" => self.create_window(app, &message),
            "criar-botao" => self.create_button(&message),
            "criar-rotulo" => self.create_label(&message),
            "criar-caixa-texto" => self.create_textbox(&message),
            "criar-caixa-vertical" => self.create_box(&message, Orientation::Vertical),
            "criar-caixa-horizontal" => self.create_box(&message, Orientation::Horizontal),
            "definir-texto" => self.set_text(&message),
            "encerrar" => self.close_all(app),
            _ => self.send_error("protocolo", &format!("Tipo de mensagem nao suportado: {}", tipo)),
        }
    }

    fn create_window(&self, app: &Application, message: &Value) {
        let id = message.get("id").and_then(Value::as_str).unwrap_or_default();
        if id.is_empty() {
            self.send_error("protocolo", "criar-janela sem id");
            return;
        }

        let width = message.get("largura").and_then(Value::as_i64).unwrap_or(800) as i32;
        let height = message.get("altura").and_then(Value::as_i64).unwrap_or(600) as i32;
        let title = message
            .get("titulo")
            .and_then(Value::as_str)
            .unwrap_or("Delegua");

        let window = ApplicationWindow::builder()
            .application(app)
            .title(title)
            .default_width(width)
            .default_height(height)
            .build();

        let content = GtkBox::new(Orientation::Vertical, 8);
        content.set_margin_top(8);
        content.set_margin_bottom(8);
        content.set_margin_start(8);
        content.set_margin_end(8);

        window.set_child(Some(&content));

        let runtime = self.clone();
        let app_clone = app.clone();
        window.connect_close_request(move |_| {
            runtime.send(json!({
                "tipo": "fechado",
                "codigo": 0,
                "sinal": null,
            }));
            app_clone.quit();
            gtk4::glib::Propagation::Proceed
        });

        window.show();

        self.windows.borrow_mut().insert(id.to_string(), window);
        self.components
            .borrow_mut()
            .insert(id.to_string(), content.upcast::<Widget>());
    }

    fn create_button(&self, message: &Value) {
        let id = message.get("id").and_then(Value::as_str).unwrap_or_default();
        let parent_id = message.get("paiId").and_then(Value::as_str).unwrap_or_default();
        let label = message
            .get("rotulo")
            .and_then(Value::as_str)
            .unwrap_or("Botao");

        if id.is_empty() {
            self.send_error("protocolo", "criar-botao sem id");
            return;
        }

        let Some(parent) = self.get_parent_box(parent_id, "criar-botao") else {
            return;
        };

        let button = Button::with_label(label);
        let runtime = self.clone();
        let id_owned = id.to_string();
        button.connect_clicked(move |_| {
            runtime.send(json!({
                "tipo": "evento",
                "componenteId": id_owned,
                "evento": "clique",
            }));
        });

        parent.append(&button);
        self.components
            .borrow_mut()
            .insert(id.to_string(), button.upcast::<Widget>());
    }

    fn create_label(&self, message: &Value) {
        let id = message.get("id").and_then(Value::as_str).unwrap_or_default();
        let parent_id = message.get("paiId").and_then(Value::as_str).unwrap_or_default();
        let text = message.get("texto").and_then(Value::as_str).unwrap_or_default();

        if id.is_empty() {
            self.send_error("protocolo", "criar-rotulo sem id");
            return;
        }

        let Some(parent) = self.get_parent_box(parent_id, "criar-rotulo") else {
            return;
        };

        let label = Label::new(Some(text));
        label.set_xalign(0.0);
        parent.append(&label);
        self.components
            .borrow_mut()
            .insert(id.to_string(), label.upcast::<Widget>());
    }

    fn create_textbox(&self, message: &Value) {
        let id = message.get("id").and_then(Value::as_str).unwrap_or_default();
        let parent_id = message.get("paiId").and_then(Value::as_str).unwrap_or_default();
        let text = message
            .get("textoInicial")
            .and_then(Value::as_str)
            .unwrap_or_default();

        if id.is_empty() {
            self.send_error("protocolo", "criar-caixa-texto sem id");
            return;
        }

        let Some(parent) = self.get_parent_box(parent_id, "criar-caixa-texto") else {
            return;
        };

        let entry = Entry::new();
        entry.set_text(text);
        entry.set_width_chars(28);

        let runtime = self.clone();
        let id_owned = id.to_string();
        entry.connect_changed(move |e| {
            let current = e.text().to_string();
            runtime.send(json!({
                "tipo": "valor-atualizado",
                "id": id_owned,
                "valor": current,
            }));

            runtime.send(json!({
                "tipo": "evento",
                "componenteId": id_owned,
                "evento": "alterado",
                "valor": current,
            }));
        });

        parent.append(&entry);
        self.components
            .borrow_mut()
            .insert(id.to_string(), entry.upcast::<Widget>());
    }

    fn create_box(&self, message: &Value, orientation: Orientation) {
        let id = message.get("id").and_then(Value::as_str).unwrap_or_default();
        let parent_id = message.get("paiId").and_then(Value::as_str).unwrap_or_default();

        if id.is_empty() {
            self.send_error("protocolo", "criar-caixa sem id");
            return;
        }

        let op = if orientation == Orientation::Vertical {
            "criar-caixa-vertical"
        } else {
            "criar-caixa-horizontal"
        };

        let Some(parent) = self.get_parent_box(parent_id, op) else {
            return;
        };

        let container = GtkBox::new(orientation, 8);
        parent.append(&container);
        self.components
            .borrow_mut()
            .insert(id.to_string(), container.upcast::<Widget>());
    }

    fn set_text(&self, message: &Value) {
        let id = message.get("id").and_then(Value::as_str).unwrap_or_default();
        let text = message.get("texto").and_then(Value::as_str).unwrap_or_default();

        if id.is_empty() {
            self.send_error("protocolo", "definir-texto sem id");
            return;
        }

        let components = self.components.borrow();
        let Some(widget) = components.get(id) else {
            self.send_error("host", &format!("Componente nao encontrado: {}", id));
            return;
        };

        if let Some(label) = widget.downcast_ref::<Label>() {
            label.set_text(text);
        } else if let Some(button) = widget.downcast_ref::<Button>() {
            button.set_label(text);
        } else if let Some(entry) = widget.downcast_ref::<Entry>() {
            entry.set_text(text);
            self.send(json!({
                "tipo": "valor-atualizado",
                "id": id,
                "valor": text,
            }));
            self.send(json!({
                "tipo": "evento",
                "componenteId": id,
                "evento": "alterado",
                "valor": text,
            }));
        }
    }

    fn close_all(&self, app: &Application) {
        for window in self.windows.borrow().values() {
            window.close();
        }

        self.windows.borrow_mut().clear();
        self.components.borrow_mut().clear();

        app.quit();
    }
}

fn main() {
    let app = Application::builder()
        .application_id("br.com.designliquido.delegua.gtkhost")
        .build();

    app.connect_activate(|app| {
        let writer = Arc::new(Mutex::new(io::stdout()));
        let runtime = Runtime {
            components: Rc::new(RefCell::new(HashMap::new())),
            windows: Rc::new(RefCell::new(HashMap::new())),
            writer,
        };

        runtime.send(json!({
            "tipo": "pronto",
            "versao": "1.0.0-gtk-host",
        }));

        let (sender, receiver) = gtk4::glib::MainContext::channel::<Value>(gtk4::glib::Priority::default());
        let runtime_for_receiver = runtime.clone();
        let app_for_receiver = app.clone();

        receiver.attach(None, move |message| {
            runtime_for_receiver.process_message(&app_for_receiver, message);
            gtk4::glib::ControlFlow::Continue
        });

        std::thread::spawn(move || {
            let stdin = io::stdin();
            let reader = BufReader::new(stdin);

            for line in reader.lines() {
                let Ok(line) = line else { continue };
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    continue;
                }

                let parsed = serde_json::from_str::<Value>(trimmed);
                if let Ok(value) = parsed {
                    let _ = sender.send(value);
                }
            }
        });
    });

    app.run();
}
