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

  // Admin session identity (mini-sprint 3.05). Shape verified against the LIVE
  // backend: a single `role` string, no `roles` array (BI-010 fixed).
  http.get('http://localhost:8080/api/auth/me', () =>
    HttpResponse.json({
      id: 'admin-id',
      username: 'admin',
      email: 'admin@snapgram.com',
      displayName: 'Administrator',
      role: 'ADMIN',
      emailVerified: true,
      createdAt: new Date().toISOString(),
    })
  ),

  http.post('http://localhost:8080/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
];
