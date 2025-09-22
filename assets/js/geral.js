$(document).ready(function () {

    function inicializarDb() {
        alasql(`
            CREATE localStorage DATABASE IF NOT EXISTS agrosys_db;
            ATTACH localStorage DATABASE agrosys_db;
            USE agrosys_db;
        `);
        alasql(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT IDENTITY(1,1) PRIMARY KEY,
                usuario STRING UNIQUE,
                senha STRING
            );
        `);
        alasql(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INT IDENTITY(1,1) PRIMARY KEY,
                nome STRING,
                cpf STRING UNIQUE,
                nascimento DATE,
                telefone STRING,
                celular STRING
            );
        `);
        alasql(`
            CREATE TABLE IF NOT EXISTS enderecos (
                id INT IDENTITY(1,1) PRIMARY KEY,
                cliente_id INT,
                cep STRING,
                rua STRING,
                bairro STRING,
                cidade STRING,
                estado STRING,
                pais STRING,
                principal BOOLEAN
            );
        `);
        console.log("DB inicializado com sucesso!");
    }
    inicializarDb();

    $('#formLogin').on('submit', function (e) {
        e.preventDefault();
        const usuario = $('#loginUsuario').val().trim();
        const senha = $('#loginSenha').val().trim();

        const result = alasql('SELECT * FROM usuarios WHERE usuario = ? AND senha = ?', [usuario, senha]);

        if (result.length > 0) {
            sessionStorage.setItem('usuario_logado', usuario);
            window.location.href = 'clientes.html';
        } else {
            alert('Usuário ou senha inválidos!');
        }
    });

    $('#formCadastroUsuario').on('submit', function (e) {
        e.preventDefault();
        const usuario = $('#cadastroUsuario').val().trim();
        const senha = $('#cadastroSenha').val().trim();

        try {
            alasql('INSERT INTO usuarios (usuario, senha) VALUES (?, ?)', [usuario, senha]);
            alert('Usuário cadastrado com sucesso!');
            $('#modalCadastroUsuario').modal('hide');
            $(this)[0].reset();
        } catch (error) {
            alert('Erro ao cadastrar usuário: ' + error);
        }
    });

    $('#btnImportarDb').on('click', function () {
        const fileInput = document.getElementById('uploadDb');
        if (fileInput.files.length === 0) {
            alert('Selecione um arquivo JSON.');
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);

                alasql('DELETE FROM usuarios');
                alasql('DELETE FROM clientes');
                alasql('DELETE FROM enderecos');

                if (data.usuarios) {
                    data.usuarios.forEach(u =>
                        alasql('INSERT INTO usuarios (usuario, senha) VALUES (?, ?)', [u.usuario, u.senha])
                    );
                }
                if (data.clientes) {
                    data.clientes.forEach(c =>
                        alasql('INSERT INTO clientes (id, nome, cpf, nascimento, telefone, celular) VALUES (?, ?, ?, ?, ?, ?)',
                            [c.id, c.nome, c.cpf, c.nascimento, c.telefone, c.celular])
                    );
                }
                if (data.enderecos) {
                    data.enderecos.forEach(e =>
                        alasql('INSERT INTO enderecos (id, cliente_id, cep, rua, bairro, cidade, estado, pais, principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            [e.id, e.cliente_id, e.cep, e.rua, e.bairro, e.cidade, e.estado, e.pais, e.principal])
                    );
                }

                alert('Banco de dados importado com sucesso!');
                $('#modalConfiguracoes').modal('hide');
            } catch (err) {
                alert('Erro ao importar JSON: ' + err);
            }
        };

        reader.readAsText(file);
    });

    $('#btnLogout').on('click', function () {
        sessionStorage.removeItem('usuario_logado');
        window.location.href = 'index.html';
    });

    $('#clienteCpf').mask('000.000.000-00');
    $('#clienteTelefone').mask('(00) 0000-0000');
    $('#clienteCelular').mask('(00) 00000-0000');
    $('#enderecoCep').mask('00000-000');

    let clienteAtualId = null;

    function carregarClientes() {
        let clientes = alasql('SELECT * FROM clientes');

        const filtroNome = $('#filtroNome').val()?.toLowerCase();
        const filtroCpf = $('#filtroCpf').val();

        if (filtroNome) clientes = clientes.filter(c => c.nome.toLowerCase().includes(filtroNome));
        if (filtroCpf) clientes = clientes.filter(c => c.cpf.includes(filtroCpf));

        const tabela = $('#tabelaClientes');
        tabela.empty();
        clientes.forEach(cliente => {
            const dataNasc = cliente.nascimento ? new Date(cliente.nascimento).toLocaleDateString('pt-BR') : '';
            tabela.append(`
                <tr>
                    <td>${cliente.nome}</td>
                    <td>${cliente.cpf}</td>
                    <td>${dataNasc}</td>
                    <td>${cliente.celular}</td>
                    <td>
                        <button class="btn btn-info btn-sm btn-ver-enderecos" data-id="${cliente.id}" data-nome="${cliente.nome}">Endereços</button>
                        <button class="btn btn-warning btn-sm btn-editar-cliente" data-id="${cliente.id}">Editar</button>
                        <button class="btn btn-danger btn-sm btn-excluir-cliente" data-id="${cliente.id}">Excluir</button>
                    </td>
                </tr>
            `);
        });
    }

    $('#filtroNome, #filtroCpf').on('input', carregarClientes);

    $('#formCliente').on('submit', function (e) {
        e.preventDefault();
        const id = $('#clienteId').val() ? parseInt($('#clienteId').val()) : null;
        const cliente = {
            nome: $('#clienteNome').val().trim(),
            cpf: $('#clienteCpf').val().trim(),
            nascimento: $('#clienteNascimento').val() || null,
            telefone: $('#clienteTelefone').val().trim(),
            celular: $('#clienteCelular').val().trim()
        };

        try {
            const cpfExistente = alasql('SELECT id FROM clientes WHERE cpf = ? AND id != ?', [cliente.cpf, id || 0]);
            if (cpfExistente.length > 0) {
                alert('Este CPF já está cadastrado.');
                return;
            }

            if (id) {
                alasql('UPDATE clientes SET nome=?, cpf=?, nascimento=?, telefone=?, celular=? WHERE id=?',
                    [cliente.nome, cliente.cpf, cliente.nascimento, cliente.telefone, cliente.celular, id]);
                alert('Cliente atualizado com sucesso!');
            } else {
                alasql('INSERT INTO clientes (nome, cpf, nascimento, telefone, celular) VALUES (?, ?, ?, ?, ?)',
                    [cliente.nome, cliente.cpf, cliente.nascimento, cliente.telefone, cliente.celular]);
                alert('Cliente cadastrado com sucesso!');
            }

            $('#modalCliente').modal('hide');
            $(this)[0].reset();
            carregarClientes();

        } catch (error) {
            alert('Erro ao salvar cliente: ' + error);
        }
    });

    $('#modalCliente').on('hidden.bs.modal', function () {
        $('#formCliente')[0].reset();
        $('#clienteId').val('');
    });

    // editar cliente
    $(document).on('click', '.btn-editar-cliente', function () {
        const id = $(this).data('id');
        const cliente = alasql('SELECT * FROM clientes WHERE id = ?', [id])[0];
        if (cliente) {
            $('#clienteId').val(cliente.id);
            $('#clienteNome').val(cliente.nome);
            $('#clienteCpf').val(cliente.cpf);
            $('#clienteNascimento').val(cliente.nascimento);
            $('#clienteTelefone').val(cliente.telefone);
            $('#clienteCelular').val(cliente.celular);
            $('#modalCliente').modal('show');
        }
    });

    // excluir cliente
    $(document).on('click', '.btn-excluir-cliente', function () {
        if (confirm('Deseja excluir este cliente e todos os endereços?')) {
            const id = $(this).data('id');
            alasql('DELETE FROM clientes WHERE id=?', [id]);
            alasql('DELETE FROM enderecos WHERE cliente_id=?', [id]);
            carregarClientes();
        }
    });

    // ver enderecos
    $(document).on('click', '.btn-ver-enderecos', function () {
        clienteAtualId = $(this).data('id');
        const nomeCliente = $(this).data('nome');
        $('#nomeClienteEnderecos').text(`Endereços de: ${nomeCliente}`);
        $('#secaoClientes').addClass('d-none');
        $('#secaoEnderecos').removeClass('d-none');
        carregarEnderecos(clienteAtualId);
    });

    $('#btnVoltarClientes').on('click', function () {
        clienteAtualId = null;
        $('#secaoEnderecos').addClass('d-none');
        $('#secaoClientes').removeClass('d-none');
    });

    function carregarEnderecos(clienteId) {
        const enderecos = alasql('SELECT * FROM enderecos WHERE cliente_id = ?', [clienteId]);
        const tabela = $('#tabelaEnderecos');
        tabela.empty();
        enderecos.forEach(end => {
            tabela.append(`
                <tr>
                    <td>${end.rua}</td>
                    <td>${end.cep}</td>
                    <td>${end.cidade}</td>
                    <td>${end.principal ? '<span class="badge bg-success">Sim</span>' : 'Não'}</td>
                    <td>
                        <button class="btn btn-warning btn-sm btn-editar-endereco" data-id="${end.id}">Editar</button>
                        <button class="btn btn-danger btn-sm btn-excluir-endereco" data-id="${end.id}">Excluir</button>
                    </td>
                </tr>
            `);
        });
    }

    $('#formEndereco').on('submit', function (e) {
        e.preventDefault();
        const id = $('#enderecoId').val() ? parseInt($('#enderecoId').val()) : null;
        const endereco = {
            cliente_id: clienteAtualId,
            cep: $('#enderecoCep').val().trim(),
            rua: $('#enderecoRua').val().trim(),
            bairro: $('#enderecoBairro').val().trim(),
            cidade: $('#enderecoCidade').val().trim(),
            estado: $('#enderecoEstado').val().trim(),
            pais: $('#enderecoPais').val().trim(),
            principal: $('#enderecoPrincipal').is(':checked') ? true : false
        };

        if (endereco.principal) {
            alasql('UPDATE enderecos SET principal=false WHERE cliente_id=?', [clienteAtualId]);
        }

        if (id) {
            alasql('UPDATE enderecos SET cep=?, rua=?, bairro=?, cidade=?, estado=?, pais=?, principal=? WHERE id=?',
                [endereco.cep, endereco.rua, endereco.bairro, endereco.cidade, endereco.estado, endereco.pais, endereco.principal, id]);
            alert('Endereço atualizado com sucesso!');
        } else {
            alasql('INSERT INTO enderecos (cliente_id, cep, rua, bairro, cidade, estado, pais, principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [endereco.cliente_id, endereco.cep, endereco.rua, endereco.bairro, endereco.cidade, endereco.estado, endereco.pais, endereco.principal]);
            alert('Endereço cadastrado com sucesso!');
        }

        $('#modalEndereco').modal('hide');
        $(this)[0].reset();
        carregarEnderecos(clienteAtualId);
    });

    $('#modalEndereco').on('hidden.bs.modal', function () {
        $('#formEndereco')[0].reset();
        $('#enderecoId').val('');
    });

    $(document).on('click', '.btn-editar-endereco', function () {
        const id = $(this).data('id');
        const end = alasql('SELECT * FROM enderecos WHERE id=?', [id])[0];
        if (end) {
            $('#enderecoId').val(end.id);
            $('#enderecoCep').val(end.cep);
            $('#enderecoRua').val(end.rua);
            $('#enderecoBairro').val(end.bairro);
            $('#enderecoCidade').val(end.cidade);
            $('#enderecoEstado').val(end.estado);
            $('#enderecoPais').val(end.pais);
            $('#enderecoPrincipal').prop('checked', end.principal);
            $('#modalEndereco').modal('show');
        }
    });

    $(document).on('click', '.btn-excluir-endereco', function () {
        if (confirm('Deseja excluir este endereço?')) {
            const id = $(this).data('id');
            alasql('DELETE FROM enderecos WHERE id=?', [id]);
            carregarEnderecos(clienteAtualId);
        }
    });

    // api para pegar endereco pelo cep
    $('#enderecoCep').on('blur', function () {
        const cep = $(this).val().replace(/\D/g, '');
        if (cep.length !== 8) {
            alert('CEP inválido!');
            return;
        }

        $.getJSON(`https://viacep.com.br/ws/${cep}/json/`, function (data) {
            if (!("erro" in data)) {
                // console.log('passou aqui')
                // console.log(data)
                $('#enderecoRua').val(data.logradouro);
                $('#enderecoBairro').val(data.bairro);
                $('#enderecoCidade').val(data.localidade);
                $('#enderecoEstado').val(data.uf);
                $('#enderecoPais').val("Brasil");
            } else {
                alert("CEP não encontrado.");
            }
        }).fail(function () {
            alert("Erro ao buscar CEP. Verifique sua conexão.");
        });
    });


    $('#btnExportarDb').on('click', function () {
        const data = {
            usuarios: alasql('SELECT * FROM usuarios'),
            clientes: alasql('SELECT * FROM clientes'),
            enderecos: alasql('SELECT * FROM enderecos'),
        };
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'agrosys_backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Banco de dados exportado com sucesso!');
    });

    if ($('#tabelaClientes').length > 0) {
        carregarClientes();
    }
});
