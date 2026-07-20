import { describe, expect, it } from "vitest";
import type { CrmUserRole } from "./auth";

describe("CrmUserRole", () => {
  it("accepts the three foundation roles", () => {
    const roles: CrmUserRole[] = ["gestor", "vendedor", "atendimento"];

    expect(roles).toEqual(["gestor", "vendedor", "atendimento"]);
  });
});
