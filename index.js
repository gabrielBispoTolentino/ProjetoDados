import mysql from 'mysql2';

require('dotenv').config();

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASSWORD,
  database: 'auth_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

import { createClient } from '@supabase/supabase-api'

const supabaseUrl = 'https://supabase.com/dashboard/project/bhvooehwaxijhtqadibf/settings/api-keys'
const supabaseKey = 'sb_publishable_5XCS9SwrH8RzamnWcZCeCw_Y7XlC6hB'
const supabase = createClient(supabaseUrl, supabaseKey)

// Exemplo de login comparando a senha como no seu SQL
const {'data, error'} = await supabase
.from('usuários')
.select('*')
.eq('nome_de_usuario', 'seu_usuario')
  .eq('senha', 'senha_digitada') // O Supabase lida com a lógica se configurado corretamente ou via RPC

// Teste de conexão imediato
db.getConnection()
.then(conn => {
    console.log(" Conexão com o MySQL estabelecida com sucesso!");
    conn.release(); // Libera a conexão de volta para o pool
})
.catch(err => {
    console.error("Erro ao conectar ao banco de dados:", err.message);
    console.log("Verifique se o serviço do MySQL está rodando e se a senha está correta.");
});
