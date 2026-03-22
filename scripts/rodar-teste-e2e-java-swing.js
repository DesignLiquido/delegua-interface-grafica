const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const raizProjeto = path.resolve(__dirname, '..');
const pastaHostSwing = path.resolve(raizProjeto, 'host-java-swing');
const pastaLibs = path.resolve(pastaHostSwing, 'build', 'libs');

function descobrirComandoGradle() {
    if (process.env.DELEGUA_SWING_E2E_GRADLE_CMD) {
        return process.env.DELEGUA_SWING_E2E_GRADLE_CMD;
    }

    const gradleWrapperWindows = path.resolve(pastaHostSwing, 'gradlew.bat');
    if (fs.existsSync(gradleWrapperWindows)) {
        return gradleWrapperWindows;
    }

    const gradleWrapperUnix = path.resolve(pastaHostSwing, 'gradlew');
    if (fs.existsSync(gradleWrapperUnix)) {
        return gradleWrapperUnix;
    }

    return 'gradle';
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

function localizarJarHostSwing() {
    if (!fs.existsSync(pastaLibs)) {
        return null;
    }

    const jars = fs
        .readdirSync(pastaLibs)
        .filter((arquivo) => arquivo.toLowerCase().endsWith('.jar'))
        .filter((arquivo) => !arquivo.toLowerCase().includes('-plain'))
        .sort();

    if (jars.length === 0) {
        return null;
    }

    const jarComDependencias = jars.find((arquivo) => arquivo.toLowerCase().includes('-all.jar'));
    if (jarComDependencias) {
        return path.resolve(pastaLibs, jarComDependencias);
    }

    return path.resolve(pastaLibs, jars[jars.length - 1]);
}

function main() {
    const gradleComando = descobrirComandoGradle();

    console.log('[e2e-java-swing] Compilando host Java Swing...');
    executarComando(gradleComando, ['fatJar'], pastaHostSwing, process.env);

    const jarHost = localizarJarHostSwing();
    if (!jarHost) {
        throw new Error('Nao foi possivel localizar o JAR do host Java Swing em host-java-swing/build/libs.');
    }

    console.log(`[e2e-java-swing] JAR localizado: ${jarHost}`);
    console.log('[e2e-java-swing] Executando teste E2E Swing...');

    const envTeste = {
        ...process.env,
        DELEGUA_SWING_E2E: '1',
        DELEGUA_SWING_E2E_JAR: jarHost,
    };

    executarComando('yarn', ['jest', '--runInBand', 'testes/infraestrutura-java-swing-e2e.test.ts'], raizProjeto, envTeste);

    console.log('[e2e-java-swing] Teste E2E concluido com sucesso.');
}

try {
    main();
} catch (erro) {
    console.error('[e2e-java-swing] Verifique os erros exibidos acima (build Java ou execucao do teste).');
    console.error(`[e2e-java-swing] Falha: ${erro.message}`);
    process.exit(1);
}
