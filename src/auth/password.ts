/**
 * Password hashing (bcryptjs — pure JS, no native build). 12 rounds.
 * Never log passwords or hashes (G4).
 */

import bcrypt from 'bcryptjs';

const ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
