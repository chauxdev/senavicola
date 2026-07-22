const http = require('http');

function post(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const bodyStr = JSON.stringify(data);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function run() {
  try {
    console.log('1. Intentando hacer login...');
    const loginRes = await post('http://localhost:3000/auth/login', {
      documento: '000000',
      password: 'Admin123'
    });

    console.log('Status Login:', loginRes.statusCode);
    if (loginRes.statusCode !== 201 && loginRes.statusCode !== 200) {
      console.error('Error en Login:', loginRes.data);
      return;
    }

    const token = loginRes.data.data.access_token;
    console.log('Token obtenido con éxito');

    console.log('2. Intentando crear un insumo...');
    const supplyPayload = {
      nombre: 'Alimento Concentrado',
      cantidad: 150.5,
      fecha: new Date().toISOString(),
      id_categoria: '3c25088e-d05e-47f4-80fb-b02b99da4f11', // Alimentos
      id_unidad_medida: '18409102-4c30-4cbf-9758-ae66f79ab650', // Kilos
      id_llamar_usuario: 1
    };

    const supplyRes = await post('http://localhost:3000/supplies', supplyPayload, {
      'Authorization': `Bearer ${token}`
    });

    console.log('Status Creación Insumo:', supplyRes.statusCode);
    console.log('Response Creación Insumo:', JSON.stringify(supplyRes.data, null, 2));

  } catch (err) {
    console.error('Error de red/servidor:', err);
  }
}

run();
