const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const raizProjeto = path.resolve(__dirname, '..');
const pastaHostGtk = path.resolve(raizProjeto, 'host-gtk');
const pastaRelease = path.resolve(pastaHostGtk, 'target', 'release');

function descobrirComandoCargo() {
    return process.env.DELEGUA_GTK_E2E_CARGO_CMD || 'cargo';
}

function executarComando(comando, args, cwd, env) {
    const resultado = spawnSync(comando, args, {
        cwd,
        env,
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });

    if (resultado.error) {
        throw resultado.error;
    }

    if (resultado.status !== 0) {
        throw new Error(`Comando falhou: ${comando} ${args.join(' ')}`);
    }
}

function localizarExecutavelGtk() {
    if (!fs.existsSync(pastaRelease)) {
        return null;
    }

    const candidatos = fs
        .readdirSync(pastaRelease)
        .filter((arquivo) => arquivo.startsWith('delegua-interface-grafica-gtk-host'))
        .filter((arquivo) => !arquivo.endsWith('.d'))
        .sort();

    if (candidatos.length === 0) {
        return null;
    }

    return path.resolve(pastaRelease, candidatos[candidatos.length - 1]);
}

function main() {
    if (process.platform === 'win32') {
        throw new Error('E2E GTK exige ambiente Linux com bibliotecas GTK instaladas.');
    }

    const cargo = descobrirComandoCargo();

    console.log('[e2e-gtk] Compilando host GTK...');
    executarComando(cargo, ['build', '--release', '--manifest-path', path.resolve(pastaHostGtk, 'Cargo.toml')], raizProjeto, process.env);

    const executavel = localizarExecutavelGtk();
    if (!executavel) {
        throw new Error('Nao foi possivel localizar o executavel do host GTK em host-gtk/target/release.');
    }

    console.log(`[e2e-gtk] Executavel localizado: ${executavel}`);
    console.log('[e2e-gtk] Executando teste E2E GTK...');

    const envTeste = {
        ...process.env,
        DELEGUA_GTK_E2E: '1',
        DELEGUA_GTK_E2E_CMD: executavel,
    };

    executarComando('yarn', ['jest', '--runInBand', 'testes/infraestrutura-gtk-e2e.test.ts'], raizProjeto, envTeste);

    console.log('[e2e-gtk] Teste E2E concluido com sucesso.');
}

try {
    main();
} catch (erro) {
    console.error('[e2e-gtk] Verifique os erros exibidos acima (build Rust/GTK ou execucao do teste).');
    console.error(`[e2e-gtk] Falha: ${erro.message}`);
    process.exit(1);
}
