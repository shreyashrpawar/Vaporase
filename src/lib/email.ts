import * as Nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";

const TOKEN = "d1dc5948488276cd2829a5a6451fb75a";

const transport = Nodemailer.createTransport(
  MailtrapTransport({
    token: TOKEN,
    sandbox: true,
    testInboxId: 4354931,
  })
);

const sender = {
  address: "hello@ilusion.in",
  name: "Ilusion Vault",
};

export async function sendSecretBurnedEmail(recipientEmail: string, secretId: string, readByIp: string) {
  try {
    await transport.sendMail({
      from: sender,
      to: [recipientEmail],
      subject: "🔒 Your secret has been burned",
      text: `Your secret with ID ${secretId} has just been viewed and destroyed.\n\nIt was opened by IP: ${readByIp}\nTime: ${new Date().toLocaleString()}`,
      category: "Notification",
    });
    console.log(`Burn notification sent to ${recipientEmail} for secret ${secretId}`);
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
}
