import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { Autocomplete } from "../ui/autocomplete";

function Harness({ suggestions }: { suggestions: string[] }) {
  const [value, setValue] = useState("");
  return <Autocomplete value={value} onChange={setValue} suggestions={suggestions} placeholder="Search" />;
}

describe("Autocomplete", () => {
  const items = ["Brake Pad Set", "Brake Shoe", "Spark Plug", "Piston"];

  it("shows all suggestions on focus", () => {
    render(<Harness suggestions={items} />);
    fireEvent.focus(screen.getByPlaceholderText("Search"));
    expect(screen.getByText("Brake Pad Set")).toBeInTheDocument();
    expect(screen.getByText("Spark Plug")).toBeInTheDocument();
  });

  it("filters suggestions as the user types", () => {
    render(<Harness suggestions={items} />);
    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "brake" } });
    expect(screen.getByText("Brake Pad Set")).toBeInTheDocument();
    expect(screen.getByText("Brake Shoe")).toBeInTheDocument();
    expect(screen.queryByText("Spark Plug")).not.toBeInTheDocument();
  });

  it("selecting a suggestion updates the input value", () => {
    render(<Harness suggestions={items} />);
    const input = screen.getByPlaceholderText("Search") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.click(screen.getByText("Piston"));
    expect(input.value).toBe("Piston");
  });

  it("reopens the suggestions when the input is clicked again after a selection", () => {
    render(<Harness suggestions={items} />);
    const input = screen.getByPlaceholderText("Search") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.click(screen.getByText("Piston"));
    expect(input.value).toBe("Piston");
    // List closes after selecting, even though the input keeps focus.
    expect(screen.queryByRole("button", { name: /piston/i })).not.toBeInTheDocument();

    // Clicking the already-focused input (no blur happened) must reopen it.
    fireEvent.click(input);
    expect(screen.getByRole("button", { name: /piston/i })).toBeInTheDocument();
  });

  it("allows free text that is not in the suggestion list", () => {
    render(<Harness suggestions={items} />);
    const input = screen.getByPlaceholderText("Search") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Custom Widget XYZ" } });
    expect(input.value).toBe("Custom Widget XYZ");
    expect(screen.getByText(/press Enter to keep what you typed/i)).toBeInTheDocument();
  });
});
