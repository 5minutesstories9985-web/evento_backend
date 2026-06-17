import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { User } from './auth.model.js';

function sign(user) {
  const token = jwt.sign({ id: user._id, name: user.name, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpires,
  });
  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
}

export async function register({ name, email, password, role = 'user' }) {
  const exists = await User.findOne({ email });
  if (exists) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role });
  return sign(user);
}

export async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  return sign(user);
}
