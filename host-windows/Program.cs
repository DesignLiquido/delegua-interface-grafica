using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Windows.Forms;

namespace DeleguaInterfaceGraficaWindowsHost;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();

        using var output = new StreamWriter(Console.OpenStandardOutput())
        {
            AutoFlush = true,
        };

        var runtime = new WindowsHostRuntime(output);
        runtime.InitializeDispatcher();
        runtime.Send(new JsonObject
        {
            ["tipo"] = "pronto",
            ["versao"] = "1.1.0-windows-host",
        });

        Task.Run(runtime.ProcessInputLoop);
        Application.Run(runtime.Context);
    }
}

internal sealed class WindowsHostRuntime
{
    private readonly JsonSerializerOptions serializerOptions = new()
    {
        PropertyNamingPolicy = null,
        WriteIndented = false,
    };

    private readonly TextWriter output;
    private readonly ConcurrentDictionary<string, Control> controlsById = new();
    private readonly ConcurrentDictionary<string, Form> formsById = new();
    private Control? dispatcher;

    public ApplicationContext Context { get; } = new();

    public WindowsHostRuntime(TextWriter output)
    {
        this.output = output;
    }

    public void InitializeDispatcher()
    {
        dispatcher = new Control();
        dispatcher.CreateControl();
    }

    public async Task ProcessInputLoop()
    {
        while (true)
        {
            var line = await Console.In.ReadLineAsync();
            if (line is null)
            {
                break;
            }

            var trimmed = line.Trim();
            if (trimmed.Length == 0)
            {
                continue;
            }

            JsonObject? message;
            try
            {
                message = JsonNode.Parse(trimmed)?.AsObject();
            }
            catch
            {
                SendError("protocolo", "JSON invalido recebido.");
                continue;
            }

            if (message is null || message["tipo"] is null)
            {
                SendError("protocolo", "Mensagem sem campo tipo.");
                continue;
            }

            Post(() => ProcessMessage(message));
        }

        Post(() => Context.ExitThread());
    }

    public void Send(JsonObject message)
    {
        lock (output)
        {
            output.WriteLine(message.ToJsonString(serializerOptions));
            output.Flush();
        }
    }

    private void ProcessMessage(JsonObject message)
    {
        var type = message["tipo"]?.GetValue<string>() ?? string.Empty;
        switch (type)
        {
            case "criar-janela":
                CreateWindow(message);
                break;
            case "criar-botao":
                CreateButton(message);
                break;
            case "criar-rotulo":
                CreateLabel(message);
                break;
            case "criar-caixa-texto":
                CreateTextBox(message);
                break;
            case "criar-caixa-vertical":
                CreateBox(message, true);
                break;
            case "criar-caixa-horizontal":
                CreateBox(message, false);
                break;
            case "criar-caixa-livre":
                CreateFreeBox(message);
                break;
            case "definir-texto":
                SetText(message);
                break;
            case "definir-geometria":
                SetGeometry(message);
                break;
            case "encerrar":
                CloseAll();
                break;
            default:
                SendError("protocolo", $"Tipo de mensagem nao suportado: {type}");
                break;
        }
    }

    private void CreateWindow(JsonObject message)
    {
        var id = GetString(message, "id");
        if (string.IsNullOrWhiteSpace(id))
        {
            SendError("protocolo", "criar-janela sem id");
            return;
        }

        var width = GetInt(message, "largura", 800);
        var height = GetInt(message, "altura", 600);
        var title = GetString(message, "titulo") ?? "Delegua";

        var form = new Form
        {
            Width = width,
            Height = height,
            Text = title,
            StartPosition = FormStartPosition.CenterScreen,
        };

        var content = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.TopDown,
            WrapContents = false,
            AutoScroll = true,
        };

        form.Controls.Add(content);
        form.FormClosed += (_, _) =>
        {
            Send(new JsonObject
            {
                ["tipo"] = "fechado",
                ["codigo"] = 0,
                ["sinal"] = null,
            });
            Context.ExitThread();
        };

        formsById[id] = form;
        controlsById[id] = content;
        form.Show();
    }

    private void CreateButton(JsonObject message)
    {
        var id = GetString(message, "id");
        var parentId = GetString(message, "paiId");
        var label = GetString(message, "rotulo") ?? "Botao";

        var parent = GetParent(parentId, "criar-botao");
        if (parent is null || string.IsNullOrWhiteSpace(id))
        {
            return;
        }

        var button = new Button
        {
            AutoSize = true,
            Text = label,
        };

        button.Click += (_, _) =>
        {
            Send(new JsonObject
            {
                ["tipo"] = "evento",
                ["componenteId"] = id,
                ["evento"] = "clique",
            });
        };

        AddChild(parent, button);
        controlsById[id] = button;
    }

    private void CreateLabel(JsonObject message)
    {
        var id = GetString(message, "id");
        var parentId = GetString(message, "paiId");
        var text = GetString(message, "texto") ?? string.Empty;

        var parent = GetParent(parentId, "criar-rotulo");
        if (parent is null || string.IsNullOrWhiteSpace(id))
        {
            return;
        }

        var label = new Label
        {
            AutoSize = true,
            Text = text,
        };

        AddChild(parent, label);
        controlsById[id] = label;
    }

    private void CreateTextBox(JsonObject message)
    {
        var id = GetString(message, "id");
        var parentId = GetString(message, "paiId");
        var initialText = GetString(message, "textoInicial") ?? string.Empty;

        var parent = GetParent(parentId, "criar-caixa-texto");
        if (parent is null || string.IsNullOrWhiteSpace(id))
        {
            return;
        }

        var textBox = new TextBox
        {
            Width = 240,
            Text = initialText,
        };

        textBox.TextChanged += (_, _) =>
        {
            Send(new JsonObject
            {
                ["tipo"] = "valor-atualizado",
                ["id"] = id,
                ["valor"] = textBox.Text,
            });

            Send(new JsonObject
            {
                ["tipo"] = "evento",
                ["componenteId"] = id,
                ["evento"] = "alterado",
                ["valor"] = textBox.Text,
            });
        };

        AddChild(parent, textBox);
        controlsById[id] = textBox;
    }

    private void CreateBox(JsonObject message, bool vertical)
    {
        var id = GetString(message, "id");
        var parentId = GetString(message, "paiId");

        var parent = GetParent(parentId, vertical ? "criar-caixa-vertical" : "criar-caixa-horizontal");
        if (parent is null || string.IsNullOrWhiteSpace(id))
        {
            return;
        }

        var panel = new FlowLayoutPanel
        {
            AutoSize = true,
            FlowDirection = vertical ? FlowDirection.TopDown : FlowDirection.LeftToRight,
            WrapContents = !vertical,
        };

        AddChild(parent, panel);
        controlsById[id] = panel;
    }

    private void CreateFreeBox(JsonObject message)
    {
        var id = GetString(message, "id");
        var parentId = GetString(message, "paiId");

        var parent = GetParent(parentId, "criar-caixa-livre");
        if (parent is null || string.IsNullOrWhiteSpace(id))
        {
            return;
        }

        var panel = new Panel
        {
            Width = Math.Max(parent.ClientSize.Width, 1),
            Height = Math.Max(parent.ClientSize.Height, 1),
            Margin = new Padding(0),
        };

        if (parent is FlowLayoutPanel)
        {
            panel.Anchor = AnchorStyles.Left | AnchorStyles.Top | AnchorStyles.Right | AnchorStyles.Bottom;
        }

        AddChild(parent, panel);
        controlsById[id] = panel;
    }

    private void SetText(JsonObject message)
    {
        var id = GetString(message, "id");
        var text = GetString(message, "texto") ?? string.Empty;

        if (string.IsNullOrWhiteSpace(id) || !controlsById.TryGetValue(id, out var control))
        {
            SendError("host", $"Componente nao encontrado: {id}");
            return;
        }

        switch (control)
        {
            case Label label:
                label.Text = text;
                break;
            case Button button:
                button.Text = text;
                break;
            case TextBox textBox:
                textBox.Text = text;
                Send(new JsonObject
                {
                    ["tipo"] = "valor-atualizado",
                    ["id"] = id,
                    ["valor"] = text,
                });
                Send(new JsonObject
                {
                    ["tipo"] = "evento",
                    ["componenteId"] = id,
                    ["evento"] = "alterado",
                    ["valor"] = text,
                });
                break;
        }
    }

    private void SetGeometry(JsonObject message)
    {
        var id = GetString(message, "id");
        if (string.IsNullOrWhiteSpace(id) || !controlsById.TryGetValue(id, out var control))
        {
            SendError("host", $"Componente nao encontrado: {id}");
            return;
        }

        var hasX = TryGetInt(message, "x", out var x);
        var hasY = TryGetInt(message, "y", out var y);
        var hasWidth = TryGetInt(message, "largura", out var width);
        var hasHeight = TryGetInt(message, "altura", out var height);

        if (hasX || hasY)
        {
            if (control.Parent is not Panel || control.Parent is FlowLayoutPanel)
            {
                SendError("host", $"Posicionamento absoluto nao suportado para o componente: {id}");
                return;
            }

            control.Left = hasX ? x : control.Left;
            control.Top = hasY ? y : control.Top;
        }

        if (hasWidth || hasHeight)
        {
            control.AutoSize = false;
            control.Width = hasWidth ? width : control.Width;
            control.Height = hasHeight ? height : control.Height;
        }
    }

    private void CloseAll()
    {
        foreach (var form in formsById.Values)
        {
            form.Close();
        }

        formsById.Clear();
        controlsById.Clear();
        Context.ExitThread();
    }

    private Control? GetParent(string? parentId, string operation)
    {
        if (string.IsNullOrWhiteSpace(parentId) || !controlsById.TryGetValue(parentId, out var parent))
        {
            SendError("host", $"Pai nao encontrado para {operation}: {parentId}");
            return null;
        }

        if (parent is FlowLayoutPanel || (parent is Panel && parent is not Form))
        {
            return parent;
        }

        SendError("host", $"Pai invalido para {operation}: {parentId}");
        return null;
    }

    private string? GetString(JsonObject message, string key)
    {
        return message[key]?.GetValue<string>();
    }

    private int GetInt(JsonObject message, string key, int fallback)
    {
        try
        {
            return message[key]?.GetValue<int>() ?? fallback;
        }
        catch
        {
            return fallback;
        }
    }

    private bool TryGetInt(JsonObject message, string key, out int value)
    {
        value = 0;

        try
        {
            if (message[key] is null)
            {
                return false;
            }

            value = message[key]!.GetValue<int>();
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static void AddChild(Control parent, Control child)
    {
        parent.Controls.Add(child);
    }

    private void SendError(string origin, string description)
    {
        Send(new JsonObject
        {
            ["tipo"] = "erro",
            ["origem"] = origin,
            ["mensagem"] = description,
        });
    }

    private void Post(Action action)
    {
        if (dispatcher is null)
        {
            action();
            return;
        }

        if (dispatcher.IsDisposed)
        {
            return;
        }

        dispatcher.BeginInvoke(action);
    }
}
