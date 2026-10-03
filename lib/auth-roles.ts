// One session cookie serves two kinds of people: staff (admin dashboard) and
// customers (their own account page). Anything that gates the admin area must
// check the *role*, not just "is there a session" — otherwise a signed-in
// customer would be waved through.
export const CUSTOMER_ROLE = "CUSTOMER";
const STAFF_ROLES = ["ADMIN", "STAFF"];

export function isStaffRole(role: string | null | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role);
}

export function isCustomerRole(role: string | null | undefined): boolean {
  return role === CUSTOMER_ROLE;
}
