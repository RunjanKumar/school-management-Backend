import { User } from '../models';
import { Constants } from '@school/common';
import bcrypt from 'bcrypt';

type SuperAdminSeedInput = {
  NAME?: string;
  EMAIL: string;
  PASSWORD?: string;
};

export const buildSuperAdminUserPayload = (seed: SuperAdminSeedInput, passwordHash: string) => {
  const normalizedEmail = seed.EMAIL.trim().toLowerCase();

  return {
    email: normalizedEmail,
    normalizedEmail,
    passwordHash,
    role: Constants.USER_ROLES.SUPER_ADMIN,
    authProviders: { password: true, google: false },
    emailVerified: true,
    status: Constants.USER_STATUS.ACTIVE,
    isDeleted: false
  };
};

export const runMigrations = async () => {
  const superAdminCount = await User.countDocuments({ role: Constants.USER_ROLES.SUPER_ADMIN });
  if (superAdminCount === 0) {
    const passwordHash = await bcrypt.hash('superadmin123', 10);
    await User.create(buildSuperAdminUserPayload({ EMAIL: 'admin@school.com' }, passwordHash));
    console.log('Super Admin seeded.');
  }
};
