import { MAX_BRACELETS_PER_BATCH } from '../constants/limits';

export async function createBracelets(quantity, employeeId) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Quantity must be a positive integer');
  }
  if (quantity > MAX_BRACELETS_PER_BATCH) {
    throw new Error(`You can create a maximum of ${MAX_BRACELETS_PER_BATCH} bracelets at once.`);
  }

  // Replace this mock source with the database/API integration.
  const start = 6000902;
  const bracelets = Array.from({ length: quantity }, (_, index) => ({
    id: `G-${start + index}`,
    employeeId,
    createdAt: new Date().toISOString(),
  }));

  return bracelets;
}

export function getTodayCreatedCount(records = []) {
  const today = new Date().toDateString();
  return records.filter((record) => new Date(record.createdAt).toDateString() === today).length;
}
