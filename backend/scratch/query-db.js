const { Client } = require('pg');

const client = new Client({
  user: 'aprendiz',
  host: 'localhost',
  database: 'senavicoladb',
  password: '3145650',
  port: 5432,
});

async function main() {
  try {
    await client.connect();
    console.log('--- ROLES ---');
    const rolesRes = await client.query('SELECT * FROM rol;');
    console.table(rolesRes.rows);

    console.log('--- PERMISOS ---');
    const permRes = await client.query('SELECT * FROM permiso;');
    console.table(permRes.rows);

    console.log('--- USUARIO_ROL ---');
    const userRolRes = await client.query('SELECT * FROM usuario_rol;');
    console.table(userRolRes.rows);

  } catch (err) {
    console.error('Error connecting or querying database:', err);
  } finally {
    await client.end();
  }
}

main();
