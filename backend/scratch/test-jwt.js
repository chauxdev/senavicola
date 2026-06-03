const jwt = require('jsonwebtoken');

const secret = 'aebb701812baacedaed493d2d71da435e046a2d24f91618d9e1dd1c3044e01cd20e733e715f873279acfc212951ad9076e80edea58b47cf025bd9d30829a06e7';
const payload = {
  sub: 'some-uuid',
  email: 'test@example.com',
  roles: ['admin']
};

console.log('Secret length:', secret.length);

const token = jwt.sign(payload, secret, { expiresIn: '8h' });
console.log('Generated Token:', token);

try {
  const decoded = jwt.verify(token, secret);
  console.log('Verification Success:', decoded);
} catch (error) {
  console.error('Verification Failed:', error.message);
}
