import { render, screen, fireEvent } from "@testing-library/react";
import { BusinessTypeExtraFields } from "../business-type-extra-fields";

describe("BusinessTypeExtraFields", () => {
  it("renders nothing when there are no extra fields (e.g. custom business type)", () => {
    const { container } = render(
      <BusinessTypeExtraFields fields={[]} values={{}} onChange={jest.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one input per configured extra field", () => {
    render(
      <BusinessTypeExtraFields
        fields={[
          { key: "expiryDate", label: "Expiry Date", type: "date" },
          { key: "partNumber", label: "Part Number", type: "text" },
        ]}
        values={{ expiryDate: "2026-01-01", partNumber: "" }}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByLabelText("Expiry Date")).toHaveValue("2026-01-01");
    expect(screen.getByLabelText("Part Number")).toHaveValue("");
  });

  it("calls onChange with the field key and new value when edited", () => {
    const onChange = jest.fn();
    render(
      <BusinessTypeExtraFields
        fields={[{ key: "partNumber", label: "Part Number", type: "text" }]}
        values={{}}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Part Number"), { target: { value: "PN-100" } });
    expect(onChange).toHaveBeenCalledWith("partNumber", "PN-100");
  });
});
