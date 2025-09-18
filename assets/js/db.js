function createTables() {
    // cria tables
    alasql("CREATE TABLE IF NOT EXISTS users (id INT, username STRING, password STRING)");
    alasql("CREATE TABLE IF NOT EXISTS clientes (id INT, nome STRING, cpf STRING, dataNasc STRING, telefone STRING, celular STRING)");
    alasql(`CREATE TABLE IF NOT EXISTS enderecos (
        id INT, clienteId INT, cep STRING, rua STRING, bairro STRING,
        cidade STRING, estado STRING, pais STRING, principal BOOL
    )`);
}

function getNextId(tableName) {
    const res = alasql(`SELECT MAX(id) AS maxId FROM ${tableName}`)[0].maxId;
    return res ? res + 1 : 1;
}

function saveDB() {
    alasql('COMMIT');
}

function initDatabase() {
    // usando local storage para não perder os dados ao dar reload
    alasql('CREATE localStorage DATABASE IF NOT EXISTS miniAppDB');
    alasql('ATTACH localStorage DATABASE miniAppDB');
    alasql('USE miniAppDB');

    createTables();
}

function resetDatabase() {
    // to com problemas na hora de dar drop. por algum motivo ele mantem os dados
    try {
        alasql('DETACH DATABASE miniAppDB');
    } catch (e) {
        console.log("Banco não estava anexado:", e.message);
    }
    localStorage.removeItem('alasqlDB_miniAppDB');

    alasql('DROP DATABASE IF EXISTS miniAppDB');

    alasql('CREATE localStorage DATABASE miniAppDB');
    alasql('ATTACH localStorage DATABASE miniAppDB');
    alasql('USE miniAppDB');

    createTables();

    console.log("Banco resetado com sucesso!");
}



initDatabase();

function listarUsuarios() {
    // funcao para debugar no terminal se meu drop esta funcionado 
    // tirar daqui dps
    try {
        const usuarios = alasql("SELECT * FROM users");
        console.log("Usuários cadastrados:");
        console.table(usuarios);
    } catch (e) {
        console.error("Erro ao listar usuários:", e.message);
    }
}
