import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@smartshift.app";

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
    if (!resend) {
        return { error: "Email service not configured" };
    }

    const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export function buildInviteEmail(params: {
    organizationName: string;
    role: string;
    inviteUrl: string;
}) {
    return {
        subject: `You've been invited to join ${params.organizationName}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <h2 style="color: #111; margin-bottom: 8px;">You've been invited!</h2>
    <p style="color: #555; font-size: 15px; line-height: 1.6;">
        You've been invited to join <strong>${params.organizationName}</strong> as a <strong>${params.role}</strong> on Smart Shift Scheduler.
    </p>
    <a href="${params.inviteUrl}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; margin: 16px 0;">
        Accept Invite
    </a>
    <p style="color: #999; font-size: 13px; margin-top: 24px;">
        If the button doesn't work, copy this link: ${params.inviteUrl}
    </p>
</body>
</html>`,
    };
}

export function buildWelcomeEmail(params: { organizationName: string }) {
    return {
        subject: `Welcome to Smart Shift Scheduler!`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <h2 style="color: #111; margin-bottom: 8px;">Welcome to Smart Shift Scheduler!</h2>
    <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Your organization <strong>${params.organizationName}</strong> is all set up. You can now start managing your team's shifts.
    </p>
    <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Head to your dashboard to add employees, set up shift templates, and generate your first schedule.
    </p>
    <p style="color: #999; font-size: 13px; margin-top: 24px;">
        Smart Shift Scheduler
    </p>
</body>
</html>`,
    };
}
