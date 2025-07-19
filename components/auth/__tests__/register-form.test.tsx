import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterForm from "../register-form";

const onBackToLogin = jest.fn();

beforeEach(() => {
  onBackToLogin.mockClear();
  // jsdom lacks window.alert
  window.alert = jest.fn();
});

describe("RegisterForm", () => {
  test("shows server error when result.error exists", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: "failed" }),
    }) as any;

    render(<RegisterForm onBackToLogin={onBackToLogin} />);

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "a" },
    });
    fireEvent.change(screen.getByLabelText(/apellidos/i), {
      target: { value: "b" },
    });
    fireEvent.change(screen.getByLabelText(/^rnc$/i), {
      target: { value: "101234567" },
    });
    fireEvent.change(screen.getByLabelText(/razón social/i), {
      target: { value: "Mi Empresa" },
    });
    fireEvent.change(screen.getByLabelText(/correo/i), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
      target: { value: "Aa123456" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "Aa123456" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /crear cuenta/i }));

    await screen.findByText("failed");
    expect(onBackToLogin).not.toHaveBeenCalled();
  });

  test("calls onBackToLogin on success", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    }) as any;

    render(<RegisterForm onBackToLogin={onBackToLogin} />);

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "a" },
    });
    fireEvent.change(screen.getByLabelText(/apellidos/i), {
      target: { value: "b" },
    });
    fireEvent.change(screen.getByLabelText(/^rnc$/i), {
      target: { value: "101234567" },
    });
    fireEvent.change(screen.getByLabelText(/razón social/i), {
      target: { value: "Mi Empresa" },
    });
    fireEvent.change(screen.getByLabelText(/correo/i), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
      target: { value: "Aa123456" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "Aa123456" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => expect(onBackToLogin).toHaveBeenCalled());
  });
});
