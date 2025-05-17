import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Simple user database with plain text passwords for simplicity
// In a real app, passwords should be properly hashed
const USERS_DB = {
  'mazoorahmad': {
    password: 'ManzoorAhmad@123',
    name: 'Manzoor Ahmad',
    role: 'admin'
  },
  'teacher': {
    password: 'teacher@2025',
    name: 'Teacher User',
    role: 'teacher'
  }
};

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { username, password } = body;
    
    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { status: 'error', message: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // Get user from database
    const user = USERS_DB[username as keyof typeof USERS_DB];
    
    // Check if user exists and password matches
    if (!user || user.password !== password) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // Generate a token
    const token = crypto.randomBytes(16).toString('hex');
    
    // Return success with user data (excluding password)
    return NextResponse.json({
      status: 'success',
      message: 'Login successful',
      user: {
        username,
        name: user.name,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Server error' },
      { status: 500 }
    );
  }
} 