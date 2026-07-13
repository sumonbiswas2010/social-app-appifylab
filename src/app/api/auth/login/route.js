import bcrypt from 'bcryptjs';
import { apiHandler, AppError } from '@/lib/errors';
import { ok } from '@/lib/response';
import { db } from '@/lib/models';
import { setAuthCookies, publicUser } from '@/lib/auth';
import { cleanString, cleanEmail } from '@/lib/validate';

export const POST = apiHandler(async (req) => {
  const body = await req.json();
  const email = cleanEmail(body.email);
  const password = cleanString(body.password, { field: 'Password', max: 72 });

  const user = await db.User.findOne({ where: { email } });
  const valid = user?.passwordHash && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) throw new AppError('Invalid email or password', 401);

  await setAuthCookies(user);
  return ok(publicUser(user), 'Logged in');
});
