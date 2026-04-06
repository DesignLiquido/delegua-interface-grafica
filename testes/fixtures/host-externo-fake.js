const readline = require('readline');

const textos = new Map();
const geometrias = new Map();

function enviar(mensagem) {
    if (!process.stdout.writable) {
        return;
    }

    process.stdout.write(`${JSON.stringify(mensagem)}\n`);
}

process.stdout.on('error', (erro) => {
    if (erro && erro.code === 'EPIPE') {
        process.exit(0);
        return;
    }

    throw erro;
});

enviar({ tipo: 'pronto', versao: '1.0.0-fake' });

const leitor = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
});

leitor.on('line', (linha) => {
    const texto = linha.trim();
    if (!texto) {
        return;
    }

    let mensagem;
    try {
        mensagem = JSON.parse(texto);
    } catch (_) {
        enviar({ tipo: 'erro', origem: 'host-fake', mensagem: 'json invalido no stdin' });
        return;
    }

    if (mensagem.tipo === 'forcar-json-invalido') {
        process.stdout.write('{json-invalido\n');
        return;
    }

    if (mensagem.tipo === 'definir-texto' && mensagem.id) {
        textos.set(mensagem.id, mensagem.texto ?? '');
        enviar({ tipo: 'valor-atualizado', id: mensagem.id, valor: mensagem.texto ?? '' });
        enviar({
            tipo: 'evento',
            componenteId: mensagem.id,
            evento: 'alterado',
            valor: mensagem.texto ?? '',
        });
    }

    if (mensagem.tipo === 'definir-geometria' && mensagem.id) {
        const geometriaAtual = geometrias.get(mensagem.id) ?? {};
        geometrias.set(mensagem.id, {
            ...geometriaAtual,
            ...(mensagem.x !== undefined ? { x: mensagem.x } : {}),
            ...(mensagem.y !== undefined ? { y: mensagem.y } : {}),
            ...(mensagem.largura !== undefined ? { largura: mensagem.largura } : {}),
            ...(mensagem.altura !== undefined ? { altura: mensagem.altura } : {}),
        });
    }

    if (mensagem.tipo === 'encerrar') {
        enviar({ tipo: 'fechado', codigo: 0, sinal: null });
        process.exit(0);
        return;
    }

    enviar({ tipo: 'recebido', payload: mensagem });
});
