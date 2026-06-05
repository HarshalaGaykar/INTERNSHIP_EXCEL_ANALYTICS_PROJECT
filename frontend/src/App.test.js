import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the application home page", () => {
  render(<App />);
  expect(screen.getAllByText(/Excel Analytics/i).length).toBeGreaterThan(0);
});
