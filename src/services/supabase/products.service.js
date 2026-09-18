import { findOrCreateByName } from "./shared";

export async function findOrCreate(organizationId, name) {
  return findOrCreateByName("products", organizationId, name);
}
