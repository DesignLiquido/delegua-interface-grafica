describe('delegua-modulo selecao de infraestrutura', () => {
    const backupEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...backupEnv };
        delete process.env.DELEGUA_INTERFACE_GRAFICA_BACKEND;
        delete process.env.DELEGUA_INTERFACE_GRAFICA_SWING_COMANDO;
        delete process.env.DELEGUA_INTERFACE_GRAFICA_SWING_ARGUMENTOS;
        delete process.env.DELEGUA_INTERFACE_GRAFICA_SWING_JAR;
        delete process.env.DELEGUA_INTERFACE_GRAFICA_SWING_CWD;
        delete process.env.DELEGUA_INTERFACE_GRAFICA_GTK_COMANDO;
        delete process.env.DELEGUA_INTERFACE_GRAFICA_GTK_ARGUMENTOS;
        delete process.env.DELEGUA_INTERFACE_GRAFICA_GTK_CWD;
        delete (global as any).document;
    });

    afterAll(() => {
        process.env = backupEnv;
    });

    it('usa InfraestruturaVazia por padrao em ambiente sem document', () => {
        const construtorVazia = jest.fn().mockImplementation(() => ({}));
        const construtorElectron = jest.fn().mockImplementation(() => ({}));
        const construtorSwing = jest.fn().mockImplementation(() => ({}));
        const construtorGtk = jest.fn().mockImplementation(() => ({}));

        jest.doMock('../fontes/infraestruturas/vazia/infraestrutura-vazia', () => ({
            InfraestruturaVazia: construtorVazia,
        }));

        jest.doMock('../fontes/infraestruturas/electron/infraestrutura-electron', () => ({
            InfraestruturaElectron: construtorElectron,
        }));

        jest.doMock('../fontes/infraestruturas/java-swing/infraestrutura-java-swing', () => ({
            InfraestruturaJavaSwing: construtorSwing,
        }));

        jest.doMock('../fontes/infraestruturas/gtk/infraestrutura-gtk', () => ({
            InfraestruturaGtk: construtorGtk,
        }));

        jest.isolateModules(() => {
            require('../fontes/delegua-modulo');
        });

        expect(construtorVazia).toHaveBeenCalledTimes(1);
        expect(construtorElectron).not.toHaveBeenCalled();
        expect(construtorSwing).not.toHaveBeenCalled();
        expect(construtorGtk).not.toHaveBeenCalled();
    });

    it('usa InfraestruturaJavaSwing quando backend for configurado em variavel de ambiente', () => {
        process.env.DELEGUA_INTERFACE_GRAFICA_BACKEND = 'java-swing';
        process.env.DELEGUA_INTERFACE_GRAFICA_SWING_COMANDO = 'java-custom';
        process.env.DELEGUA_INTERFACE_GRAFICA_SWING_ARGUMENTOS = '-jar host.jar';
        process.env.DELEGUA_INTERFACE_GRAFICA_SWING_CWD = 'C:/tmp/swing-host';

        const construtorVazia = jest.fn().mockImplementation(() => ({}));
        const construtorElectron = jest.fn().mockImplementation(() => ({}));
        const construtorSwing = jest.fn().mockImplementation(() => ({}));
        const construtorGtk = jest.fn().mockImplementation(() => ({}));

        jest.doMock('../fontes/infraestruturas/vazia/infraestrutura-vazia', () => ({
            InfraestruturaVazia: construtorVazia,
        }));

        jest.doMock('../fontes/infraestruturas/electron/infraestrutura-electron', () => ({
            InfraestruturaElectron: construtorElectron,
        }));

        jest.doMock('../fontes/infraestruturas/java-swing/infraestrutura-java-swing', () => ({
            InfraestruturaJavaSwing: construtorSwing,
        }));

        jest.doMock('../fontes/infraestruturas/gtk/infraestrutura-gtk', () => ({
            InfraestruturaGtk: construtorGtk,
        }));

        jest.isolateModules(() => {
            require('../fontes/delegua-modulo');
        });

        expect(construtorSwing).toHaveBeenCalledWith({
            comando: 'java-custom',
            argumentos: ['-jar', 'host.jar'],
            diretorioTrabalho: 'C:/tmp/swing-host',
        });
        expect(construtorVazia).not.toHaveBeenCalled();
        expect(construtorElectron).not.toHaveBeenCalled();
        expect(construtorGtk).not.toHaveBeenCalled();
    });

    it('faz fallback para InfraestruturaVazia se Java Swing falhar ao iniciar', () => {
        process.env.DELEGUA_INTERFACE_GRAFICA_BACKEND = 'java-swing';

        const construtorVazia = jest.fn().mockImplementation(() => ({}));
        const construtorElectron = jest.fn().mockImplementation(() => ({}));
        const construtorSwing = jest.fn(() => {
            throw new Error('java nao encontrado');
        });
        const construtorGtk = jest.fn().mockImplementation(() => ({}));

        const espiarWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        jest.doMock('../fontes/infraestruturas/vazia/infraestrutura-vazia', () => ({
            InfraestruturaVazia: construtorVazia,
        }));

        jest.doMock('../fontes/infraestruturas/electron/infraestrutura-electron', () => ({
            InfraestruturaElectron: construtorElectron,
        }));

        jest.doMock('../fontes/infraestruturas/java-swing/infraestrutura-java-swing', () => ({
            InfraestruturaJavaSwing: construtorSwing,
        }));

        jest.doMock('../fontes/infraestruturas/gtk/infraestrutura-gtk', () => ({
            InfraestruturaGtk: construtorGtk,
        }));

        jest.isolateModules(() => {
            require('../fontes/delegua-modulo');
        });

        expect(construtorSwing).toHaveBeenCalledTimes(1);
        expect(construtorVazia).toHaveBeenCalledTimes(1);
        expect(espiarWarn).toHaveBeenCalledTimes(1);

        espiarWarn.mockRestore();
    });

    it('usa argumento -jar automaticamente quando SWING_JAR for definido', () => {
        process.env.DELEGUA_INTERFACE_GRAFICA_BACKEND = 'java-swing';
        process.env.DELEGUA_INTERFACE_GRAFICA_SWING_JAR = 'C:/apps/host/delegua-swing-host.jar';

        const construtorVazia = jest.fn().mockImplementation(() => ({}));
        const construtorElectron = jest.fn().mockImplementation(() => ({}));
        const construtorSwing = jest.fn().mockImplementation(() => ({}));
        const construtorGtk = jest.fn().mockImplementation(() => ({}));

        jest.doMock('../fontes/infraestruturas/vazia/infraestrutura-vazia', () => ({
            InfraestruturaVazia: construtorVazia,
        }));

        jest.doMock('../fontes/infraestruturas/electron/infraestrutura-electron', () => ({
            InfraestruturaElectron: construtorElectron,
        }));

        jest.doMock('../fontes/infraestruturas/java-swing/infraestrutura-java-swing', () => ({
            InfraestruturaJavaSwing: construtorSwing,
        }));

        jest.doMock('../fontes/infraestruturas/gtk/infraestrutura-gtk', () => ({
            InfraestruturaGtk: construtorGtk,
        }));

        jest.isolateModules(() => {
            require('../fontes/delegua-modulo');
        });

        expect(construtorSwing).toHaveBeenCalledWith({
            comando: undefined,
            argumentos: ['-jar', 'C:/apps/host/delegua-swing-host.jar'],
            diretorioTrabalho: undefined,
        });
        expect(construtorVazia).not.toHaveBeenCalled();
        expect(construtorElectron).not.toHaveBeenCalled();
        expect(construtorGtk).not.toHaveBeenCalled();
    });

    it('usa InfraestruturaGtk quando backend for configurado em variavel de ambiente', () => {
        process.env.DELEGUA_INTERFACE_GRAFICA_BACKEND = 'gtk';
        process.env.DELEGUA_INTERFACE_GRAFICA_GTK_COMANDO = 'gtk-host';
        process.env.DELEGUA_INTERFACE_GRAFICA_GTK_ARGUMENTOS = '--modo headless';
        process.env.DELEGUA_INTERFACE_GRAFICA_GTK_CWD = '/tmp/gtk-host';

        const construtorVazia = jest.fn().mockImplementation(() => ({}));
        const construtorElectron = jest.fn().mockImplementation(() => ({}));
        const construtorSwing = jest.fn().mockImplementation(() => ({}));
        const construtorGtk = jest.fn().mockImplementation(() => ({}));

        jest.doMock('../fontes/infraestruturas/vazia/infraestrutura-vazia', () => ({
            InfraestruturaVazia: construtorVazia,
        }));

        jest.doMock('../fontes/infraestruturas/electron/infraestrutura-electron', () => ({
            InfraestruturaElectron: construtorElectron,
        }));

        jest.doMock('../fontes/infraestruturas/java-swing/infraestrutura-java-swing', () => ({
            InfraestruturaJavaSwing: construtorSwing,
        }));

        jest.doMock('../fontes/infraestruturas/gtk/infraestrutura-gtk', () => ({
            InfraestruturaGtk: construtorGtk,
        }));

        jest.isolateModules(() => {
            require('../fontes/delegua-modulo');
        });

        expect(construtorGtk).toHaveBeenCalledWith({
            comando: 'gtk-host',
            argumentos: ['--modo', 'headless'],
            diretorioTrabalho: '/tmp/gtk-host',
        });
        expect(construtorVazia).not.toHaveBeenCalled();
        expect(construtorElectron).not.toHaveBeenCalled();
        expect(construtorSwing).not.toHaveBeenCalled();
    });

    it('faz fallback para InfraestruturaVazia se GTK falhar ao iniciar', () => {
        process.env.DELEGUA_INTERFACE_GRAFICA_BACKEND = 'gtk';

        const construtorVazia = jest.fn().mockImplementation(() => ({}));
        const construtorElectron = jest.fn().mockImplementation(() => ({}));
        const construtorSwing = jest.fn().mockImplementation(() => ({}));
        const construtorGtk = jest.fn(() => {
            throw new Error('gtk host indisponivel');
        });

        const espiarWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        jest.doMock('../fontes/infraestruturas/vazia/infraestrutura-vazia', () => ({
            InfraestruturaVazia: construtorVazia,
        }));

        jest.doMock('../fontes/infraestruturas/electron/infraestrutura-electron', () => ({
            InfraestruturaElectron: construtorElectron,
        }));

        jest.doMock('../fontes/infraestruturas/java-swing/infraestrutura-java-swing', () => ({
            InfraestruturaJavaSwing: construtorSwing,
        }));

        jest.doMock('../fontes/infraestruturas/gtk/infraestrutura-gtk', () => ({
            InfraestruturaGtk: construtorGtk,
        }));

        jest.isolateModules(() => {
            require('../fontes/delegua-modulo');
        });

        expect(construtorGtk).toHaveBeenCalledTimes(1);
        expect(construtorVazia).toHaveBeenCalledTimes(1);
        expect(espiarWarn).toHaveBeenCalledTimes(1);
        expect(construtorElectron).not.toHaveBeenCalled();
        expect(construtorSwing).not.toHaveBeenCalled();

        espiarWarn.mockRestore();
    });
});
