import { NextResponse } from 'next/server';
import { MailtrapClient } from "mailtrap";

const TOKEN = process.env.MAILTRAP_TOKEN!;

const client = new MailtrapClient({
  token: TOKEN,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    const sender = {
      email: "hello@ilusion.io",
      name: "Ilusion Contact Form",
    };
    
    const recipients = [
      {
        email: "shreyashrpawar28@gmail.com",
      }
    ];

    await client.send({
      from: sender,
      to: recipients,
      subject: `[Contact Form] ${subject || 'New Message'}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      category: "Contact Form",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
