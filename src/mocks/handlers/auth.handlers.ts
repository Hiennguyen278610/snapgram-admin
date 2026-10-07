import { http, HttpResponse } from 'msw';

export const authHandlers = [
  http.post('http://localhost:8080/api/auth/admin/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === 'admin@snapgram.dev' && body.password === 'password') {
      return HttpResponse.json(
        {
          user: { id: 'admin-id', email: body.email, role: 'ADMIN' },
        },
        {
          status: 200,
          headers: {
            'Set-Cookie': 'admin_access_token=fake-token; HttpOnly; Path=/; SameSite=Lax',
          },
        }
      );
    }
    if (body.password === 'locked') {
      return HttpResponse.json(
        { status: 401, error: 'Unauthorized', message: 'Account is locked' },
        { status: 401 }
      );
    }
    return HttpResponse.json(
      { status: 401, error: 'Unauthorized', message: 'Invalid email or password' },
      { status: 401 }
    );
  }),

  http.post('http://localhost:8080/api/auth/login/2fa', async () => {
    return HttpResponse.json({ user: { id: 'admin-id', role: 'ADMIN' } }, { status: 200 });
  }),
];
