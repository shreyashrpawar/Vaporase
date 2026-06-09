import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    const result = await sendEmail({
      from: {
        address: process.env.SMTP_USER || "hello@ilusion.io",
        name: "Ilusion Contact Form",
      },
      to: "shreyashrpawar28@gmail.com",
      replyTo: email,
      subject: `[Contact Form] ${subject || 'New Message'}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (!result.success) {
      throw result.error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

