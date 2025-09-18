$(document).ready(function () {
    // alterna entre login e cadastro index.html
    $("#showRegisterForm").on("click", e => {
        e.preventDefault();
        $("#loginForm, #showRegisterForm").addClass("d-none");
        $("#registerForm").removeClass("d-none");
    });
    $("#backToLogin").on("click", e => {
        e.preventDefault();
        $("#registerForm").addClass("d-none");
        $("#loginForm, #showRegisterForm").removeClass("d-none");
    });

    $("#loginForm").on("submit", e => {
        e.preventDefault();
        const username = $("#username").val();
        const password = $("#password").val();
        const user = alasql("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
        if (user.length > 0) {
            localStorage.setItem("usuarioLogado", JSON.stringify(user[0]));
            window.location.href = "clientes.html";
        } else {
            alert("Usuário ou senha incorretos!");
        }
    });

    // function para cadastro de user
    $("#registerForm").on("submit", e => {
        e.preventDefault();
        const username = $("#newUsername").val();
        const password = $("#newPassword").val();
        const exists = alasql("SELECT * FROM users WHERE username = ?", [username]);
        if (exists.length > 0) {
            alert("Usuário já existe!");
        } else {
            const id = getNextId('users');
            alasql("INSERT INTO users VALUES(?,?,?)", [id, username, password]);
            saveDB();
            alert("Usuário cadastrado com sucesso!");
            $("#registerForm").trigger("reset").addClass("d-none");
            $("#loginForm, #showRegisterForm").removeClass("d-none");
        }
    });

    // importar JSON
    $("#uploadDb").on("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const data = JSON.parse(reader.result);
            data.users?.forEach(u => {
                const exists = alasql("SELECT * FROM users WHERE username = ?", [u.username]);
                if (exists.length === 0) alasql("INSERT INTO users VALUES(?,?,?)", [u.id, u.username, u.password]);
            });
            data.clientes?.forEach(c => {
                const exists = alasql("SELECT * FROM clientes WHERE cpf = ?", [c.cpf]);
                if (exists.length === 0) alasql("INSERT INTO clientes VALUES(?,?,?,?,?,?)", [c.id, c.nome, c.cpf, c.dataNasc, c.telefone, c.celular]);
            });
            data.enderecos?.forEach(e => alasql("INSERT INTO enderecos VALUES(?,?,?,?,?,?,?,?,?)", [e.id, e.clienteId, e.cep, e.rua, e.bairro, e.cidade, e.estado, e.pais, e.principal]));
            saveDB();
            alert("Banco importado com sucesso!");
        };
        reader.readAsText(file);
    });
});
