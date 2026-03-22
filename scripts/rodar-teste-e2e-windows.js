const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const raizProjeto = path.resolve(__dirname, '..');
const pastaHostWindows = path.resolve(raizProjeto, 'host-windows');
const pastaPublicacao = path.resolve(pastaHostWindows, 'publish');

function descobrirComandoDotnet() {
    return process.env.DELEGUA_WINDOWS_E2E_DOTNET_CMD || 'dotnet';
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

function localizarExecutavelWindows() {
    if (!fs.existsSync(pastaPublicacao)) {
        return null;
    }

    const executaveis = fs
        .readdirSync(pastaPublicacao)
        .filter((arquivo) => arquivo.toLowerCase().endsWith('.exe'))
        .sort();

    if (executaveis.length === 0) {
        return null;
    }

    return path.resolve(pastaPublicacao, executaveis[executaveis.length - 1]);
}

function main() {
    const dotnet = descobrirComandoDotnet();
    const projeto = path.resolve(pastaHostWindows, 'DeleguaInterfaceGraficaWindowsHost.csproj');

    console.log('[e2e-windows] Publicando host Windows...');
    executarComando(dotnet, ['publish', projeto, '-c', 'Release', '-r', 'win-x64', '--self-contained', 'false', '-o', pastaPublicacao], raizProjeto, process.env);

    const executavel = localizarExecutavelWindows();
    if (!executavel) {
        throw new Error('Nao foi possivel localizar o executavel do host Windows em host-windows/publish.');
    }

    console.log(`[e2e-windows] Executavel localizado: ${executavel}`);
    console.log('[e2e-windows] Executando teste E2E Windows...');

    const envTeste = {
        ...process.env,
        DELEGUA_WINDOWS_E2E: '1',
        DELEGUA_WINDOWS_E2E_EXE: executavel,
    };

    executarComando('yarn', ['jest', '--runInBand', 'testes/infraestrutura-windows-e2e.test.ts'], raizProjeto, envTeste);

    console.log('[e2e-windows] Teste E2E concluido com sucesso.');
}

try {
    main();
} catch (erro) {
    console.error('[e2e-windows] Verifique os erros exibidos acima (build .NET ou execucao do teste).');
    console.error(`[e2e-windows] Falha: ${erro.message}`);
    process.exit(1);
}
