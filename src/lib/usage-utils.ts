import { prisma } from '@/lib/prisma';

export interface UserUsageRecord {
  id: string;
  monthlyUsageActual: number;
  monthlyUsagePrevious: number;
  updatedAt?: Date | string | null;
}

/**
 * Normalizes monthly usage for a ClientUser.
 * If updatedAt is in a previous month (or missing), it updates DB and returns reset values:
 * - If gap is 1 month: monthlyUsagePrevious = monthlyUsageActual, monthlyUsageActual = 0
 * - If gap > 1 month: monthlyUsagePrevious = 0, monthlyUsageActual = 0
 */
export async function normalizeUserMonthlyUsage<T extends UserUsageRecord>(user: T): Promise<T> {
  if (!user) return user;

  const now = new Date();
  const lastUpdated = user.updatedAt ? new Date(user.updatedAt) : null;

  let isNewMonth = false;
  let monthsDiff = 0;

  if (lastUpdated && !isNaN(lastUpdated.getTime())) {
    monthsDiff =
      (now.getUTCFullYear() - lastUpdated.getUTCFullYear()) * 12 +
      (now.getUTCMonth() - lastUpdated.getUTCMonth());
    if (monthsDiff > 0) {
      isNewMonth = true;
    }
  } else {
    isNewMonth = true;
    monthsDiff = 1;
  }

  if (isNewMonth) {
    const newPrev = monthsDiff === 1 ? user.monthlyUsageActual || 0 : 0;
    const newActual = 0;

    try {
      await prisma.clientUser.update({
        where: { id: user.id },
        data: {
          monthlyUsageActual: newActual,
          monthlyUsagePrevious: newPrev,
          updatedAt: now,
        },
      });

      return {
        ...user,
        monthlyUsageActual: newActual,
        monthlyUsagePrevious: newPrev,
        updatedAt: now,
      };
    } catch (err) {
      console.error(`Failed to update monthly usage reset for user ${user.id}:`, err);
    }
  }

  return user;
}

/**
 * Pure helper function to calculate normalized usage values without DB side effects (for bulk lists or read-only transforms).
 */
export function getNormalizedUsageValues(
  monthlyUsageActual: number,
  monthlyUsagePrevious: number,
  updatedAt?: Date | string | null
): { monthlyUsageActual: number; monthlyUsagePrevious: number } {
  const now = new Date();
  const lastUpdated = updatedAt ? new Date(updatedAt) : null;

  if (!lastUpdated || isNaN(lastUpdated.getTime())) {
    return {
      monthlyUsageActual: 0,
      monthlyUsagePrevious: monthlyUsageActual || 0,
    };
  }

  const monthsDiff =
    (now.getUTCFullYear() - lastUpdated.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - lastUpdated.getUTCMonth());

  if (monthsDiff > 0) {
    return {
      monthlyUsageActual: 0,
      monthlyUsagePrevious: monthsDiff === 1 ? monthlyUsageActual || 0 : 0,
    };
  }

  return {
    monthlyUsageActual: monthlyUsageActual || 0,
    monthlyUsagePrevious: monthlyUsagePrevious || 0,
  };
}
