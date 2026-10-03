import { describe, expect, it } from "vitest";
import { bookingDetailsSchema } from "./booking";
import { customerLoginSchema, customerRegisterSchema, linkBookingSchema } from "./customer";

describe("customerRegisterSchema", () => {
  const valid = { name: "Sara Ahmed", phone: "+966501234567", password: "longenough1" };

  it("accepts a valid Saudi number and an 8+ character password", () => {
    expect(customerRegisterSchema.safeParse(valid).success).toBe(true);
  });

  it("normalises local formats to +966", () => {
    for (const phone of ["0501234567", "501234567", "966501234567", "00966 50 123 4567", "٠٥٠١٢٣٤٥٦٧"]) {
      expect(customerRegisterSchema.parse({ ...valid, phone }).phone).toBe("+966501234567");
    }
  });

  it("rejects numbers that aren't Saudi", () => {
    expect(customerRegisterSchema.safeParse({ ...valid, phone: "+14155550123" }).success).toBe(false);
    expect(customerRegisterSchema.safeParse({ ...valid, phone: "05012" }).success).toBe(false);
  });

  it("rejects passwords shorter than 8 characters", () => {
    expect(customerRegisterSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
  });

  it("rejects passwords over bcrypt's 72-byte limit rather than silently truncating them", () => {
    expect(customerRegisterSchema.safeParse({ ...valid, password: "a".repeat(73) }).success).toBe(
      false,
    );
  });

  it("trims the name and rejects a one-letter name", () => {
    expect(customerRegisterSchema.safeParse({ ...valid, name: "  A  " }).success).toBe(false);
    const parsed = customerRegisterSchema.parse({ ...valid, name: "  Sara  " });
    expect(parsed.name).toBe("Sara");
  });
});

describe("customerLoginSchema", () => {
  it("requires a Saudi phone number and a non-empty password", () => {
    expect(customerLoginSchema.safeParse({ phone: "+966501234567", password: "x" }).success).toBe(
      true,
    );
    expect(customerLoginSchema.safeParse({ phone: "12345", password: "x" }).success).toBe(false);
    expect(customerLoginSchema.safeParse({ phone: "+966501234567", password: "" }).success).toBe(
      false,
    );
  });
});

describe("linkBookingSchema", () => {
  it("needs both a reference and a valid phone", () => {
    expect(linkBookingSchema.safeParse({ reference: "BK-ABC123", phone: "+966501234567" }).success).toBe(
      true,
    );
    expect(linkBookingSchema.safeParse({ reference: "", phone: "+966501234567" }).success).toBe(false);
    expect(linkBookingSchema.safeParse({ reference: "BK-ABC123", phone: "nope" }).success).toBe(false);
  });
});

describe("bookingDetailsSchema — free-text area", () => {
  const base = {
    customerName: "Sara Ahmed",
    customerPhone: "+966501234567",
    addressText: "Villa 4, Street 12",
  };

  it("requires the customer to type an area", () => {
    expect(bookingDetailsSchema.safeParse({ ...base, areaText: "" }).success).toBe(false);
    expect(bookingDetailsSchema.safeParse({ ...base, areaText: " " }).success).toBe(false);
  });

  it("accepts Arabic and English area text and trims it", () => {
    const ar = bookingDetailsSchema.parse({ ...base, areaText: "  حي النخيل، الرياض " });
    expect(ar.areaText).toBe("حي النخيل، الرياض");
    expect(bookingDetailsSchema.safeParse({ ...base, areaText: "Al Olaya, Riyadh" }).success).toBe(
      true,
    );
  });

  it("caps the area at 100 characters", () => {
    expect(bookingDetailsSchema.safeParse({ ...base, areaText: "x".repeat(101) }).success).toBe(
      false,
    );
  });
});
