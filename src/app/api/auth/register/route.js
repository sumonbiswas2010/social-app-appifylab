import bcrypt from 'bcryptjs';
import { apiHandler, AppError } from '@/lib/errors';
import { ok } from '@/lib/response';
import { db } from '@/lib/models';
import { setAuthCookies, publicUser } from '@/lib/auth';
import { cleanString, cleanEmail } from '@/lib/validate';

export const POST = apiHandler(async (req) => {
  const body = await req.json();
  const firstName = cleanString(body.firstName, { field: 'First name', max: 50 });
  const lastName = cleanString(body.lastName, { field: 'Last name', max: 50 });
  const email = cleanEmail(body.email);
  const password = cleanString(body.password, { field: 'Password', min: 8, max: 72 });

  const exists = await db.User.findOne({ where: { email } });
  if (exists) throw new AppError('An account with this email already exists', 409);

  const user = await db.User.create({
    firstName,
    lastName,
    email,
    passwordHash: await bcrypt.hash(password, 10),
  });
  await setAuthCookies(user);
  return ok(publicUser(user), 'Account created', 201);
});
