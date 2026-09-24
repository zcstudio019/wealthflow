import { compare, hash } from "bcryptjs";
import { createUser, findUserByEmail, updateLastLogin, type UserRow } from "../repositories/users.js";

export class AuthValidationError extends Error {}
export class EmailAlreadyRegisteredError extends Error {}
export class InvalidCredentialsError extends Error {}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function objectBody(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthValidationError("请求参数不正确");
  return body as Record<string, unknown>;
}

function requiredString(input: Record<string, unknown>, name: string) {
  const value = input[name];
  if (typeof value !== "string") throw new AuthValidationError("请求参数不正确");
  return value.trim();
}

function normalizeEmail(value: string) {
  const email = value.toLowerCase();
  if (email.length > 255 || !emailPattern.test(email)) throw new AuthValidationError("请输入有效的邮箱地址");
  return email;
}

function validatePassword(password: string) {
  if (password.length < 8 || password.length > 128) throw new AuthValidationError("密码长度应为 8~128 位");
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) throw new AuthValidationError("密码至少包含一个字母和一个数字");
}

export function toPublicUser(user: UserRow) {
  return { id: user.id, email: user.email, displayName: user.displayName };
}

export async function registerUser(body: unknown) {
  const input = objectBody(body);
  const displayName = requiredString(input, "displayName");
  const email = normalizeEmail(requiredString(input, "email"));
  const passwordValue = input.password;
  if (typeof passwordValue !== "string") throw new AuthValidationError("请求参数不正确");
  if (Array.from(displayName).length < 2 || Array.from(displayName).length > 30) {
    throw new AuthValidationError("昵称长度应为 2~30 个字符");
  }
  validatePassword(passwordValue);
  if (await findUserByEmail(email)) throw new EmailAlreadyRegisteredError("该邮箱已注册");

  const now = new Date();
  try {
    return await createUser({
      id: crypto.randomUUID(),
      email,
      displayName,
      passwordHash: await hash(passwordValue, 12),
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") {
      throw new EmailAlreadyRegisteredError("该邮箱已注册");
    }
    throw error;
  }
}

export async function loginUser(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new InvalidCredentialsError("邮箱或密码错误");
  const input = body as Record<string, unknown>;
  const emailValue = input.email;
  const passwordValue = input.password;
  if (typeof emailValue !== "string" || typeof passwordValue !== "string") throw new InvalidCredentialsError("邮箱或密码错误");
  let email: string;
  try { email = normalizeEmail(emailValue.trim()); } catch { throw new InvalidCredentialsError("邮箱或密码错误"); }

  const user = await findUserByEmail(email);
  if (!user || user.status !== "active" || !(await compare(passwordValue, user.passwordHash))) {
    throw new InvalidCredentialsError("邮箱或密码错误");
  }
  await updateLastLogin(user.id, new Date());
  return user;
}
