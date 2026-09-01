import { MAX_BRACELETS_PER_BATCH } from '../utils/constants';
import * as jobsApi from '../api/jobsApi';
import { getTodayCreatedCount as getTodayCreatedCountFromStore } from '../api/mockData';

export async function createBracelets(quantity, employeeId, employeeName = 'Security Operator') {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Quantity must be a positive integer');
  }
  if (quantity > MAX_BRACELETS_PER_BATCH) {
    throw new Error(`You can create a maximum of ${MAX_BRACELETS_PER_BATCH} bracelets at once.`);
  }

  const job = await jobsApi.createJob({
    quantity,
    operatorId: employeeId,
    operatorName: employeeName,
  });

  return job;
}

export function getTodayCreatedCount(employeeIdOrRecords) {
  if (typeof employeeIdOrRecords === 'string') {
    return getTodayCreatedCountFromStore(employeeIdOrRecords);
  }
  if (Array.isArray(employeeIdOrRecords)) {
    const today = new Date().toDateString();
    return employeeIdOrRecords.filter((record) => new Date(record.createdAt).toDateString() === today).length;
  }
  return 0;
}
