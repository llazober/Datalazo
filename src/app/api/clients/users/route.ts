import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const { clientId, username, password } = await req.json();

    if (!clientId || !username || !password) {
      return NextResponse.json({ error: 'Client ID, username, and password are required' }, { status: 400 });
    }

    // Check if client exists
    const clientExists = await prisma.client.findUnique({
      where: { id: clientId }
    });
    if (!clientExists) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check username uniqueness globally
    const existingUser = await prisma.clientUser.findUnique({
      where: { username }
    });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    // Hash password and store user
    const passwordHash = hashPassword(password);
    const user = await prisma.clientUser.create({
      data: {
        clientId,
        username,
        password: passwordHash,
        termsAccepted: false
      },
      select: {
        id: true,
        username: true,
        termsAccepted: true
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Client User Create Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, username, password } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch existing user to check
    const existing = await prisma.clientUser.findUnique({
      where: { id: userId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data: any = {};

    if (username && username !== existing.username) {
      // Validate unique username
      const dup = await prisma.clientUser.findUnique({
        where: { username }
      });
      if (dup) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
      data.username = username;
    }

    if (password) {
      data.password = hashPassword(password);
    }

    const updated = await prisma.clientUser.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        termsAccepted: true
      }
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Client User Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await prisma.clientUser.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Client User Delete Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
