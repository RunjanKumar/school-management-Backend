import { User } from '../models';
import { Constants } from '@school/common';
import bcrypt from 'bcrypt';

export const runMigrations = async () => {
  const superAdminCount = await User.countDocuments({ role: Constants.USER_ROLES.SUPER_ADMIN });
  if (superAdminCount === 0) {
    const passwordHash = await bcrypt.hash('superadmin123', 10);
    await User.create({
      email: 'admin@school.com',
      normalizedEmail: 'admin@school.com',
      passwordHash,
      role: Constants.USER_ROLES.SUPER_ADMIN,
      authProviders: { password: true, google: false },
      emailVerified: true,
      status: Constants.USER_STATUS.ACTIVE
    });
    console.log('Super Admin seeded.');
  }
};
