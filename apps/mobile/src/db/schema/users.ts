import { z } from "zod"

export const CREATE_USERS_TABLE = `
	CREATE TABLE IF NOT EXISTS users (
		id           TEXT PRIMARY KEY NOT NULL,
		email        TEXT NOT NULL UNIQUE,
		passwordHash TEXT,
		name         TEXT,
		userImage    TEXT,
		createdAt    TEXT NOT NULL,
		updatedAt    TEXT NOT NULL
	);
`

const emailValidator = z
	.string()
	.refine(val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()), {
		message: "Email inválido",
	})

export const loginFormValidator = z.object({
	email: emailValidator,
	password: z.string().min(6, "Mínimo 6 caracteres"),
})

export type LoginFormType = z.infer<typeof loginFormValidator>

export const registerFormValidator = z
	.object({
		email: emailValidator,
		password: z.string().min(6, "Mínimo 6 caracteres"),
		confirmPassword: z.string(),
	})
	.refine(value => value.password === value.confirmPassword, {
		message: "Las contraseñas no coinciden",
		path: ["confirmPassword"],
	})

export type RegisterFormType = z.infer<typeof registerFormValidator>

export const defaultLogin: LoginFormType = {
	email: "",
	password: "",
}

export const defaultRegister: RegisterFormType = {
	email: "",
	password: "",
	confirmPassword: "",
}
