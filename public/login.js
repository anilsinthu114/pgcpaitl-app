document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorDiv = document.getElementById('error');

  try {
    const res = await fetch('/admin/login', {
      method: 'POST', // ✅ use POST, not GET
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.ok) {
      localStorage.setItem('adminToken', data.token);
      window.location.href = '/admin/dashboard';
    } else {
      errorDiv.textContent = data.error || 'Invalid credentials';
      errorDiv.style.display = 'block';
    }
  } catch (err) {
    errorDiv.textContent = 'Login failed. Please try again.';
    errorDiv.style.display = 'block';
  }
});
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorDiv = document.getElementById('error');

  try {
    const res = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    console.log('Login response:', data);

    if (data.ok) {
      localStorage.setItem('adminToken', data.token);
      window.location.href = '/admin/dashboard';
    } else {
      errorDiv.textContent = data.error || 'Invalid credentials';
      errorDiv.style.display = 'block';
    }
  } catch (err) {
    errorDiv.textContent = 'Login failed. Please try again.';
    errorDiv.style.display = 'block';
  }
});