import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateToken(parent) {
  return jwt.sign(
    { parentId: parent.id, role: parent.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
