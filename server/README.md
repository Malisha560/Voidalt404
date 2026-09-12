# API Authentication

Admin and invigilator accounts are stored in the existing `users` table. The
`role` column distinguishes `ADMIN` from `INVIGILATOR`; no separate account
tables are required.

Create or rotate an account from the `server` directory:

```bash
export USER_EMAIL=admin@example.com
export USER_PASSWORD='use-a-strong-password'
export USER_ROLE=ADMIN
npm run create-user
```

Use `USER_ROLE=INVIGILATOR` for an invigilator account. Passwords are stored
as bcrypt hashes. Staff login is available at `POST /api/auth/login` and
returns an 8-hour JWT containing the user id, email, and role.