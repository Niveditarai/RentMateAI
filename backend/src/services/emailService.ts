import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string = '"RentMate AI" <no-reply@rentmate.ai>';

  // Lazy load transporter
  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM;

    if (from) this.fromAddress = from;

    if (host && user && pass) {
      console.log('📬 Initializing SMTP Transporter using .env credentials...');
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
    } else {
      console.log('⚠️ Missing SMTP credentials in .env. Initializing dynamic Ethereal Mail Fallback...');
      // Ethereal is a real SMTP test sandbox that renders layout previews instantly!
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`🛡️ Ethereal SMTP test account initialized: user="${testAccount.user}"`);
    }

    return this.transporter;
  }

  // Generic mail sender wrapper
  public async sendMail(options: MailOptions) {
    try {
      const transport = await this.getTransporter();
      const info = await transport.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html
      });

      console.log(`✉️ Email successfully dispatched to ${options.to}. ID: ${info.messageId}`);
      
      // If using ethereal fallback, print the preview URL in logs
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 [Email Preview Link] View dynamic email layout here: ${previewUrl}`);
      }
      return info;
    } catch (error) {
      console.error('❌ Failed to dispatch email notification:', error);
      // Suppress email crashes in production so the user flow never breaks
      return null;
    }
  }

  // 1. OTP Verification Code Email
  public async sendOtpEmail(toEmail: string, name: string, otpCode: string) {
    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0;">
        <h2 style="color: #2563EB; font-weight: 800; margin-bottom: 5px;">RentMate AI</h2>
        <p style="font-size: 14px; color: #64748B; margin-top: 0;">Verify Your Coliving Profile</p>
        <hr style="border-top: 1px solid #E2E8F0; margin: 20px 0;" />
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">Hi ${name},</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">Thank you for registering at RentMate AI. Use the 6-digit OTP verification code below to activate your account:</p>
        <div style="background-color: #2563EB; color: #FFFFFF; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: 800; letter-spacing: 5px; margin: 25px 0;">
          ${otpCode}
        </div>
        <p style="font-size: 12px; color: #94A3B8; line-height: 1.5;">This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.</p>
      </div>
    `;
    return this.sendMail({ to: toEmail, subject: '🔒 Verify Your RentMate AI Account', html });
  }

  // 2. High Compatibility Tenant Alert Email (Sent to listing Owner)
  public async sendHighCompatibilityEmail(
    ownerEmail: string,
    ownerName: string,
    tenantName: string,
    listingTitle: string,
    score: number,
    message: string
  ) {
    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0;">
        <h2 style="color: #2563EB; font-weight: 800; margin-bottom: 5px;">RentMate AI</h2>
        <p style="font-size: 14px; color: #64748B; margin-top: 0;">High Compatibility Match Alert</p>
        <hr style="border-top: 1px solid #E2E8F0; margin: 20px 0;" />
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">Hi ${ownerName},</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">We have found a highly compatible tenant for your listing: <strong>"${listingTitle}"</strong>!</p>
        <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <div style="font-size: 18px; font-weight: 800; margin-bottom: 5px;">🔥 ${score}% Compatibility Match!</div>
          <div style="font-size: 13px;">Applicant <strong>${tenantName}</strong> aligns strongly with your budget, location, and housing specifications.</div>
        </div>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;"><strong>Applicant Note:</strong></p>
        <blockquote style="background-color: #FFFFFF; border-left: 4px solid #2563EB; padding: 12px; margin: 15px 0; font-style: italic; color: #475569; font-size: 13px;">
          "${message}"
        </blockquote>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">Log into your Landlord Dashboard to review this request and open a direct chat.</p>
      </div>
    `;
    return this.sendMail({ to: ownerEmail, subject: '🌟 High Match Tenant Application Alert', html });
  }

  // 3. Application Accepted Alert Email (Sent to Tenant)
  public async sendAcceptanceEmail(
    tenantEmail: string,
    tenantName: string,
    listingTitle: string,
    ownerName: string
  ) {
    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0;">
        <h2 style="color: #2563EB; font-weight: 800; margin-bottom: 5px;">RentMate AI</h2>
        <p style="font-size: 14px; color: #64748B; margin-top: 0;">Application Status Update</p>
        <hr style="border-top: 1px solid #E2E8F0; margin: 20px 0;" />
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">Hi ${tenantName},</p>
        <p style="font-size: 16px; color: #16A34A; font-weight: 700; margin: 15px 0;">🎉 Your Application Has Been Accepted!</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">Landlord <strong>${ownerName}</strong> has accepted your interest request for the flat listing: <strong>"${listingTitle}"</strong>.</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">A secure real-time chat channel is now active. You can log in and start chatting with the landlord directly in the RentMate platform!</p>
      </div>
    `;
    return this.sendMail({ to: tenantEmail, subject: `🎉 Application Accepted for "${listingTitle}"`, html });
  }

  // 4. Application Declined Alert Email (Sent to Tenant)
  public async sendDeclineEmail(
    tenantEmail: string,
    tenantName: string,
    listingTitle: string,
    ownerName: string
  ) {
    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0;">
        <h2 style="color: #2563EB; font-weight: 800; margin-bottom: 5px;">RentMate AI</h2>
        <p style="font-size: 14px; color: #64748B; margin-top: 0;">Application Status Update</p>
        <hr style="border-top: 1px solid #E2E8F0; margin: 20px 0;" />
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">Hi ${tenantName},</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">Thank you for your interest in the listing: <strong>"${listingTitle}"</strong>.</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; font-style: italic;">
          Landlord ${ownerName} has decided to move forward with another applicant for this room.
        </p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Don't lose heart! Go back to your dashboard to review other high-compatibility suggestions calculated for you by our AI match engine.
        </p>
      </div>
    `;
    return this.sendMail({ to: tenantEmail, subject: `Update on your application for "${listingTitle}"`, html });
  }
}

export const emailService = new EmailService();
