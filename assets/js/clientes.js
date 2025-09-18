$(document).ready(function () {
    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuarioLogado) {
        window.location.href = "index.html";
        return;
    }

    $("body").show();
    $("#bemVindo").text(`Bem-vindo, ${usuarioLogado.username}!`);

    // logout
    $("#logout").on("click", function () {
        localStorage.removeItem("usuarioLogado");
        window.location.href = "index.html";
    });

    atualizarTabela();

    // funcao para teste, inseri clientes com dados fixos
    $("#novoCliente").on("click", function () {
        const id = getNextId("clientes");
        alasql("INSERT INTO clientes VALUES(?,?,?,?,?,?)", [id, "Cliente Exemplo", "12345678900", "01/01/1990", "(11)1111-1111", "(11)99999-9999"]);
        saveDB();
        atualizarTabela();
    });

    function atualizarTabela() {
        const clientes = alasql("SELECT * FROM clientes");
        const tbody = $("#tabelaClientes");
        tbody.empty();
        clientes.forEach(c => {
            tbody.append(`<tr>
        <td>${c.nome}</td>
        <td>${c.cpf}</td>
        <td>${c.dataNasc}</td>
        <td>${c.telefone}</td>
        <td>${c.celular}</td>
      </tr>`);
        });
    }
});
