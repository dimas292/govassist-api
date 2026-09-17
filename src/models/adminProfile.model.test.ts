import assert from "node:assert/strict";
import test from "node:test";
import { updateAdminProfileSchema } from "./adminProfile.model";

test("accepts and trims valid admin profile fields", () => {
  const result = updateAdminProfileSchema.safeParse({
    name: "  Admin GovAssist  ",
    organizationName: "  GovAssist Nasional  ",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.name, "Admin GovAssist");
    assert.equal(result.data.organizationName, "GovAssist Nasional");
  }
});

test("rejects incomplete and unknown admin profile fields", () => {
  assert.equal(updateAdminProfileSchema.safeParse({ name: "A", organizationName: "" }).success, false);
  assert.equal(updateAdminProfileSchema.safeParse({ name: "Admin", organizationName: "GovAssist", role: "ADMIN" }).success, false);
});
