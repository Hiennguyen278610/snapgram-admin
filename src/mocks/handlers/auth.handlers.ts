import { http, HttpResponse } from 'msw';

export const authHandlers = [
  http.options('http://localhost:8080/api/auth/*', () => new HttpResponse(null, { status: 204 })),

  http.post('http://localhost:8080/api/auth/admin/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === 'admin@snapgram.dev' && body.password === 'password') {
      return HttpResponse.json(
        {
          user: { id: 'admin-id', email: body.email, role: 'ADMIN', roles: ['ADMIN', 'USER'] },
        },
        {
          status: 200,
          headers: {
            'Set-Cookie': 'admin_access_token=fake-token; HttpOnly; Path=/; SameSite=Lax',
          },
        }
      );
    }
    if (body.email === 'mod@snapgram.dev' && body.password === 'password') {
      return HttpResponse.json(
        {
          user: {
            id: 'mod-id',
            email: body.email,
            role: 'MODERATOR',
            roles: ['USER', 'MODERATOR'],
          },
        },
        {
          status: 200,
          headers: {
            'Set-Cookie': 'admin_access_token=fake-token; HttpOnly; Path=/; SameSite=Lax',
          },
        }
      );
    }
    if (body.email === 'user@snapgram.dev' && body.password === 'password') {
      return HttpResponse.json(
        {
          status: 403,
          error: 'Forbidden',
          message: 'Access denied: You do not have permission to access the admin portal',
        },
        { status: 403 }
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

  http.get('http://localhost:8080/api/auth/me', () => {
    return HttpResponse.json({
      id: '01dd12b3-c2fb-46cc-ac26-b237aee68510',
      username: 'admin',
      displayName: 'Snapgram Admin',
      email: 'admin@snapgram.com',
      role: 'ADMIN',
      roles: ['ADMIN'],
      permissions: [
        'USER:READ',
        'USER:BAN',
        'USER:UNBAN',
        'USER:ROLE_ASSIGN',
        'CONTENT:MODERATE',
        'POST:DELETE',
        'COMMENT:DELETE',
        'STORY:DELETE',
        'REPORT:VIEW',
        'REPORT:RESOLVE',
        'REPORT:DISMISS',
        'SUPPORT:TICKET_READ',
        'SUPPORT:TICKET_MANAGE',
        'SUPPORT:USER_ASSIST',
        'SYSTEM:SETTINGS_READ',
        'SYSTEM:SETTINGS_WRITE',
        'AUDIT:VIEW',
        'PAYMENT:READ',
        'PAYMENT:RECONCILE',
      ],
      avatarUrl: null,
      emailVerified: true,
      verified: false,
      createdAt: '2026-10-20T01:14:58Z',
    });
  }),

  http.post('http://localhost:8080/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
];
