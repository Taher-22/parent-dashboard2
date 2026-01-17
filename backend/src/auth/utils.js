import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateToken(parent) {
  return jwt.sign(
    {
      id: parent.id,
      email: parent.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
