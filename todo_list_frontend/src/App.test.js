import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders todo app heading and add input", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /todo list/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/new task/i)).toBeInTheDocument();
});
