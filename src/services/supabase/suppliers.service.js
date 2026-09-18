import { findOrCreateByName } from "./shared";

export async function findOrCreate(organizationId, name) {
  return findOrCreateByName("suppliers", organizationId, name);
}
