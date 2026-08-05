import { renderHook, act } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

/**
 * Regression test for a real bug: @hookform/resolvers@3.x reads a Zod
 * error's `.errors` array to build field errors, but Zod v4's ZodError
 * only exposes `.issues` — so on an invalid submit, the resolver silently
 * threw instead of reporting errors, and react-hook-form's handleSubmit
 * called neither the valid nor the invalid callback. Net effect: filling
 * in one field and submitting did nothing — no inline errors, no submit.
 * @hookform/resolvers must stay on a version whose zod adapter understands
 * Zod v4 (`^5.x`, which explicitly lists zod "^3.25.0 || ^4.0.0" as a peer).
 */
describe("zodResolver + zod v4 compatibility", () => {
  const schema = z.object({
    name: z.string().min(2, "Name is required"),
    sku: z.string().min(2, "SKU is required"),
  });

  it("reports field errors (not a silent no-op) when required fields are missing", async () => {
    const { result } = renderHook(() =>
      useForm({
        resolver: zodResolver(schema),
        defaultValues: { name: "A", sku: "" },
      }),
    );

    const onValid = jest.fn();
    const onInvalid = jest.fn();

    await act(async () => {
      await result.current.handleSubmit(onValid, onInvalid)();
    });

    expect(onValid).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledTimes(1);
    const receivedErrors = onInvalid.mock.calls[0][0];
    expect(receivedErrors.sku?.message).toBe("SKU is required");
  });

  it("submits successfully when all fields are valid", async () => {
    const { result } = renderHook(() =>
      useForm({
        resolver: zodResolver(schema),
        defaultValues: { name: "Ahmed", sku: "SKU1" },
      }),
    );

    const onValid = jest.fn();

    await act(async () => {
      await result.current.handleSubmit(onValid)();
    });

    expect(onValid).toHaveBeenCalledTimes(1);
    expect(onValid.mock.calls[0][0]).toEqual({ name: "Ahmed", sku: "SKU1" });
  });
});
