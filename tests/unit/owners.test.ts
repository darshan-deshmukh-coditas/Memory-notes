import { describe, expect, it } from "vitest";
import { UsageError } from "../../src/domain/errors.js";
import { ownerDisplay, resolveOwner, resolveOwnerArg } from "../../src/owners/resolve.js";

// specs/03-owner-resolution; FRD D4, D16, D23 to D25, D41, D42, D46, D50, D60, D67; plan 03 Q1 to Q16.

const ATTENDEES = [{ name: "Priya Nair" }, { name: "Priya Shah" }, { name: "Anita Desai" }, { name: "Rahul Mehta" }];
const NO_ATTENDEES: { name: string }[] = [];
const ROSTER = ["Sam Okafor", "Rahul Verma", "Rahul Mehta"];

function display(text: string, attendees = ATTENDEES, roster = ROSTER): string[] {
  return resolveOwner(text, attendees, roster).owners.map(ownerDisplay);
}

describe("owner phrase (D24, D67)", () => {
  it("`Priya N.` resolves by surname initial (D24.1)", () => {
    expect(display("Priya N. to send the quote")).toEqual(["Priya Nair"]);
    expect(display("Priya S. to run tests")).toEqual(["Priya Shah"]);
  });

  it("bare ambiguous first name gives (ambiguous) (D4.2)", () => {
    expect(display("Priya to review the plan")).toEqual(["(ambiguous)"]);
  });

  it("`@anita:` is Anita; the colon ends the owner (D24.2, D67.2)", () => {
    const r = resolveOwner("@Anita: talk to Priya about X", ATTENDEES, ROSTER);
    expect(r.owners.map(ownerDisplay)).toEqual(["Anita Desai"]);
    expect(r.task).toBe("talk to Priya about X");
  });

  it("`A & B to ...` gives one result per person (D24.3)", () => {
    expect(display("Anita & Rahul to review the deck")).toEqual(["Anita Desai", "Rahul Mehta"]);
  });

  it("`Lena (with Priya) to ...` is owned by the first person; collaborator stays in the task (D24.4)", () => {
    const att = [{ name: "Lena Fischer" }, ...ATTENDEES];
    const r = resolveOwner("Lena Fischer (with Priya Nair) to draft the outline", att, ROSTER);
    expect(r.owners.map(ownerDisplay)).toEqual(["Lena Fischer"]);
    expect(r.task).toBe("draft the outline");
  });

  it("`Sam to talk to Priya` has owner Sam when Sam is known (D67.1)", () => {
    const r = resolveOwner("Sam to talk to Priya about X", ATTENDEES, ROSTER);
    expect(r.owners.map(ownerDisplay)).toEqual(["Sam Okafor"]);
    expect(r.task).toBe("talk to Priya about X");
  });

  it("an unknown word before ` to ` stays in the task: (no owner) (Q9)", () => {
    const r = resolveOwner("Schedule to review budget", ATTENDEES, ROSTER);
    expect(r.owners.map(ownerDisplay)).toEqual(["(no owner)"]);
    expect(r.task).toBe("Schedule to review budget");
  });
});

describe("labels (D25, D46)", () => {
  it("Everyone and Team are (group); Someone, TBD and Owner are (no owner) (D25, D46.1)", () => {
    expect(display("Everyone to review the prototype")).toEqual(["(group)"]);
    expect(display("Team to test")).toEqual(["(group)"]);
    expect(display("Someone to update the CRM")).toEqual(["(no owner)"]);
    expect(display("TBD to decide")).toEqual(["(no owner)"]);
    expect(display("Owner to remediate")).toEqual(["(no owner)"]);
  });

  it("placeholders match case-insensitively (Q4)", () => {
    expect(display("someone: to update")).toEqual(["(no owner)"]);
  });
});

describe("name resolution (D4, D23, D41, D60)", () => {
  it("a bare first name uses the roster when the note has no attendees (D23.2)", () => {
    expect(display("Sam to send the invoice", NO_ATTENDEES)).toEqual(["Sam Okafor"]);
  });

  it("a bare first name matching several roster people is ambiguous (D41.2)", () => {
    expect(display("Rahul to update docs", NO_ATTENDEES)).toEqual(["(ambiguous)"]);
  });

  it("a full name not among attendees is accepted from the roster (D60.1)", () => {
    expect(display("@Sam Okafor: draft the plan")).toEqual(["Sam Okafor"]);
  });

  it("a full name not on the roster or attendees is unresolved (D60.1)", () => {
    expect(display("@Zed Quinn: draft the plan")).toEqual(["(unresolved)"]);
  });

  it("the wrong surname gives unresolved, with no fallback to the first name (Q11)", () => {
    expect(display("@Priya Sharma: draft the plan")).toEqual(["(unresolved)"]);
  });
});

describe("resolveOwnerArg (D4.4, D31.3, D42)", () => {
  const known = ["Priya Nair", "Priya Shah", "Anita Desai"];

  it("full name is case-insensitive", () => {
    expect(resolveOwnerArg("priya nair", known)).toEqual({ kind: "person", name: "Priya Nair" });
  });

  it("a first name matching several people is a usage error that lists the choices (D4.4)", () => {
    expect(() => resolveOwnerArg("Priya", known)).toThrow(UsageError);
    expect(() => resolveOwnerArg("Priya", known)).toThrow(/Priya Nair, Priya Shah/);
  });

  it("the four tokens select labels (D42.1); a label text is not accepted (Q15)", () => {
    expect(resolveOwnerArg("none", known)).toEqual({ kind: "label", label: "(no owner)" });
    expect(resolveOwnerArg("(no owner)", known)).toEqual({ kind: "no-match" });
  });

  it("an unknown name is no-match, not an error (D72.1)", () => {
    expect(resolveOwnerArg("Zed", known)).toEqual({ kind: "no-match" });
  });
});
