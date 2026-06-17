async function run() {
  const res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'dummy@test.com',
      password: 'password123',
      role_name: 'student',
      student_no: '12345/2026',
      first_name: 'Dummy',
      last_name: 'User'
    })
  });
  console.log('Status:', res.status);
  console.log(await res.json());
}
run();
