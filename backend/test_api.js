import http from 'http';
http.get('http://localhost:3001/api/documents/15eIZTCLMjQkSnwWXa5Foj4T-ke_CjBs_zgkvmn90uew/view?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXFoajNlNTYwMDAwaXNrbm9paTY4cjEzIiwiZW1haWwiOiJzYW5qYW5hLmIwODMxQGdtYWlsLmNvbSIsInJvbGUiOiJURUFDSEVSIiwiaWF0IjoxNzgyMjA3ODgyLCJleHAiOjE3ODIyMDg3ODJ9.4LWhxupT-LmPbR7sAbsCgpwePVZ872D6_8XkgTuC1XU', (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Body:', data.slice(0, 500)));
}).on('error', (err) => console.log('Error:', err.message));
