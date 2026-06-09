import * as Nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_USER = process.env.SMTP_USER || "hello@ilusion.io";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";

const transport = Nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports (e.g. 587)
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

export async function sendEmail({
  from,
  to,
  replyTo,
  subject,
  text,
  html,
}: {
  from?: { name: string; address: string } | string;
  to: string | string[];
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
}) {
  try {
    const info = await transport.sendMail({
      from: from || { name: "Ilusion", address: SMTP_USER },
      to: Array.isArray(to) ? to.join(", ") : to,
      replyTo,
      subject,
      text,
      html,
    });
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

export async function sendSecretBurnedEmail(recipientEmail: string, secretId: string, readByIp: string) {
  try {
    await transport.sendMail({
      from: {
        address: SMTP_USER,
        name: "Ilusion Vault",
      },
      to: [recipientEmail],
      subject: "🔒 Your secret has been burned",
      text: `Your secret with ID ${secretId} has just been viewed and destroyed.\n\nIt was opened by IP: ${readByIp}\nTime: ${new Date().toLocaleString()}`,
    });
    console.log(`Burn notification sent to ${recipientEmail} for secret ${secretId}`);
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
}

