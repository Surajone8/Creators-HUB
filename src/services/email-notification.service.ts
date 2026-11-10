import nodemailer from "nodemailer";
import { SupabaseClient } from "@supabase/supabase-js";

export interface SendEmailParams {
  recipientEmail: string;
  scheduleId: string;
  videoTitle: string;
  targetPublishTime: string;
  displayTimezone: string;
  visibility: string;
  fileName?: string | null;
  autoPublish: boolean;
  autoDeleteMedia: boolean;
}

export interface SendPostPublishEmailParams {
  recipientEmail: string;
  scheduleId: string;
  videoTitle: string;
  youtubeVideoId: string;
  visibility: string;
  fileName?: string | null;
  driveFileDeleted: boolean;
  publishedAt: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  status: "sent" | "simulated" | "failed";
  error?: string;
}

export class EmailNotificationService {
  /**
   * Builds the responsive, styled HTML email template for 2-minute action reminders
   * (Sent ONLY when at least one option is NOT selected / requires user manual action)
   */
  buildScheduleReminderHtml({
    videoTitle,
    targetPublishTime,
    displayTimezone,
    visibility,
    fileName,
    autoPublish,
    autoDeleteMedia,
  }: Omit<SendEmailParams, "recipientEmail" | "scheduleId">): string {
    const formattedDate = new Date(targetPublishTime).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: displayTimezone || "UTC",
    });

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const manualPublishNeeded = !autoPublish;
    const manualDriveCleanNeeded = !autoDeleteMedia;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Creator Hub - Action Required in 2 Minutes</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #121216; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; background: linear-gradient(180deg, #18181b 0%, #121216 100%); border-bottom: 1px solid #27272a;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="display: inline-block; padding: 6px 12px; background: #dc2626; color: #ffffff; font-size: 11px; font-weight: 700; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase;">
                      Creator Hub
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.5); color: #fbbf24; font-size: 11px; font-weight: 700; border-radius: 20px;">
                      ⚠️ Action Required in 2 Mins
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                Action required on your scheduled video!
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                Your video is scheduled to publish in <strong>2 minutes</strong>. Because you chose manual confirmation, your action is required on Creator Hub.
              </p>

              <!-- Video Details Card -->
              <table role="presentation" width="100%" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 6px;">
                      Scheduled Video Title
                    </div>
                    <div style="font-size: 16px; font-weight: 600; color: #f4f4f5; margin-bottom: 16px; line-height: 1.4;">
                      ${videoTitle}
                    </div>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" style="padding-bottom: 12px;">
                          <span style="font-size: 11px; color: #71717a; display: block;">Target Publish Time</span>
                          <span style="font-size: 13px; font-weight: 500; color: #e4e4e7;">${formattedDate}</span>
                        </td>
                        <td width="50%" style="padding-bottom: 12px;">
                          <span style="font-size: 11px; color: #71717a; display: block;">Platform & Visibility</span>
                          <span style="font-size: 13px; font-weight: 500; color: #e4e4e7;">YouTube • ${visibility.toUpperCase()}</span>
                        </td>
                      </tr>
                      ${
                        fileName
                          ? `
                      <tr>
                        <td colspan="2" style="border-top: 1px solid #27272a; padding-top: 12px;">
                          <span style="font-size: 11px; color: #71717a; display: block;">Staged Source Media</span>
                          <span style="font-size: 12px; font-family: monospace; color: #38bdf8;">${fileName}</span>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Required Action Notice Box -->
              <table role="presentation" width="100%" style="background-color: #451a03; border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 13px; font-weight: 700; color: #fde68a; margin-bottom: 6px;">
                      👉 Actions Awaiting Your Click:
                    </div>
                    <div style="font-size: 12px; color: #fef3c7; line-height: 1.6;">
                      ${
                        manualPublishNeeded
                          ? "• <strong>Manual Upload Required:</strong> Auto-publish was turned off. Visit the Calendar to click <strong>Publish Now</strong> when target time arrives.<br>"
                          : "• <strong>Auto-Publish:</strong> The system will stream the video automatically.<br>"
                      }
                      ${
                        manualDriveCleanNeeded
                          ? "• <strong>Manual Drive Cleanup Required:</strong> Auto-purge was turned off. Visit the Calendar to click <strong>Clean Drive File</strong> post-upload.<br>"
                          : "• <strong>Auto-Purge:</strong> Staged Drive media will be cleared automatically post-upload.<br>"
                      }
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action CTA Button -->
              <table role="presentation" width="100%">
                <tr>
                  <td align="center">
                    <a href="${appBaseUrl}/calendar" target="_blank" style="display: inline-block; width: 85%; background: #dc2626; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; text-align: center; padding: 14px 24px; border-radius: 10px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);">
                      Open Content Calendar to Confirm &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0c0c0e; border-top: 1px solid #27272a; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #71717a;">
                Creator Hub Automated Publishing Engine • Zero Permanent Storage
              </p>
              <p style="margin: 0; font-size: 11px; color: #52525b;">
                You are receiving this alert because manual action was chosen for this scheduled release.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Builds the responsive HTML email template sent AFTER a video is published
   * (Sent ONLY when BOTH options: auto-publish AND auto-delete are enabled)
   */
  buildPostPublishSuccessHtml({
    videoTitle,
    youtubeVideoId,
    visibility,
    fileName,
    driveFileDeleted,
    publishedAt,
  }: Omit<SendPostPublishEmailParams, "recipientEmail" | "scheduleId">): string {
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const youtubeUrl = `https://youtu.be/${youtubeVideoId}`;
    const formattedDate = new Date(publishedAt).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Creator Hub - Video Published Successfully</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #121216; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; background: linear-gradient(180deg, #18181b 0%, #121216 100%); border-bottom: 1px solid #27272a;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="display: inline-block; padding: 6px 12px; background: #dc2626; color: #ffffff; font-size: 11px; font-weight: 700; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase;">
                      Creator Hub
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 11px; font-weight: 600; border-radius: 20px;">
                      🎉 Auto-Published & Cleaned
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                Your video is now live on YouTube!
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                Both automation rules were executed successfully: your video was automatically published to YouTube, and the temporary Google Drive staged file has been purged.
              </p>

              <!-- Video Details Card -->
              <table role="presentation" width="100%" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 6px;">
                      Video Title
                    </div>
                    <div style="font-size: 17px; font-weight: 600; color: #f4f4f5; margin-bottom: 16px; line-height: 1.4;">
                      ${videoTitle}
                    </div>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" style="padding-bottom: 12px;">
                          <span style="font-size: 11px; color: #71717a; display: block;">Published At</span>
                          <span style="font-size: 13px; font-weight: 500; color: #e4e4e7;">${formattedDate}</span>
                        </td>
                        <td width="50%" style="padding-bottom: 12px;">
                          <span style="font-size: 11px; color: #71717a; display: block;">Visibility</span>
                          <span style="font-size: 13px; font-weight: 500; color: #34d399;">YouTube • ${visibility.toUpperCase()}</span>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top: 1px solid #27272a; padding-top: 12px;">
                          <span style="font-size: 11px; color: #71717a; display: block;">Google Drive Ephemeral Media</span>
                          <span style="font-size: 12px; font-family: monospace; color: ${
                            driveFileDeleted ? "#34d399" : "#38bdf8"
                          };">
                            ${
                              driveFileDeleted
                                ? "✅ Safely Purged from Google Drive"
                                : "Retained in Google Drive"
                            } ${fileName ? `(${fileName})` : ""}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Buttons -->
              <table role="presentation" width="100%" style="margin-bottom: 12px;">
                <tr>
                  <td align="center">
                    <a href="${youtubeUrl}" target="_blank" style="display: inline-block; width: 85%; background: #dc2626; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; text-align: center; padding: 14px 24px; border-radius: 10px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);">
                      Watch Video on YouTube &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%">
                <tr>
                  <td align="center">
                    <a href="${appBaseUrl}/calendar" target="_blank" style="display: inline-block; font-size: 12px; color: #a1a1aa; text-decoration: underline; padding: 6px;">
                      Open Content Calendar
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0c0c0e; border-top: 1px solid #27272a; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #71717a;">
                Creator Hub Automated Publishing Engine • Zero Permanent Storage
              </p>
              <p style="margin: 0; font-size: 11px; color: #52525b;">
                This post-publish receipt confirms automated execution of your scheduled video.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Creates a nodemailer transport if credentials exist in environment
   */
  private getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER || process.env.GMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    if (host && user && pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }

    // Gmail shorthand: connect via smtp.gmail.com on port 587 (STARTTLS)
    // Avoids port 465 which is frequently blocked by local firewalls/ISPs
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
    }

    return null;
  }

  /**
   * Dispatches the 2-minute schedule reminder email
   */
  async sendScheduleReminderEmail(
    supabase: SupabaseClient,
    params: SendEmailParams
  ): Promise<EmailDispatchResult> {
    const subject = `⏳ Reminder: "${params.videoTitle}" is scheduled to publish in 2 minutes`;
    const htmlBody = this.buildScheduleReminderHtml(params);

    const emailRecordId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const transporter = this.getTransporter();

    if (transporter) {
      try {
        const fromAddress =
          process.env.SMTP_FROM ||
          `"Creator Hub" <${process.env.SMTP_USER || process.env.GMAIL_USER || "no-reply@creatorhub.local"}>`;

        const info = await transporter.sendMail({
          from: fromAddress,
          to: params.recipientEmail,
          subject,
          html: htmlBody,
        });

        // Record successful dispatch in email_notifications table
        await supabase.from("email_notifications").insert({
          id: emailRecordId,
          schedule_id: params.scheduleId,
          recipient_email: params.recipientEmail,
          subject,
          html_body: htmlBody,
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        return {
          success: true,
          messageId: info.messageId,
          status: "sent",
        };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "SMTP send failure";
        console.error("Nodemailer send failed:", errMsg);

        // Record failure
        await supabase.from("email_notifications").insert({
          id: emailRecordId,
          schedule_id: params.scheduleId,
          recipient_email: params.recipientEmail,
          subject,
          html_body: htmlBody,
          status: "failed",
          error_message: errMsg,
          sent_at: new Date().toISOString(),
        });

        return {
          success: false,
          status: "failed",
          error: errMsg,
        };
      }
    }

    // Fallback: If SMTP credentials are not yet configured in .env, simulate and record
    console.log(
      `\n==================== [CREATOR HUB EMAIL NOTIFICATION] ====================\n` +
        `To: ${params.recipientEmail}\n` +
        `Subject: ${subject}\n` +
        `Target Publish Time: ${params.targetPublishTime} (${params.displayTimezone})\n` +
        `Auto-Publish: ${params.autoPublish ? "YES" : "NO (Awaiting Creator Action)"}\n` +
        `Auto-Delete Media: ${params.autoDeleteMedia ? "YES" : "NO"}\n` +
        `Note: SMTP credentials not set in .env. Email recorded to Supabase audit table.\n` +
        `=========================================================================\n`
    );

    try {
      await supabase.from("email_notifications").insert({
        id: emailRecordId,
        schedule_id: params.scheduleId,
        recipient_email: params.recipientEmail,
        subject,
        html_body: htmlBody,
        status: "simulated",
        sent_at: new Date().toISOString(),
      });
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      messageId: `simulated_${emailRecordId}`,
      status: "simulated",
    };
  }

  /**
   * Scans for schedules that are 2 minutes away from targetPublishTime
   * and sends advance reminder emails
   */
  async checkAndDispatchDueEmails(
    supabase: SupabaseClient,
    fallbackUserEmail: string = "reachsurajyadav@gmail.com"
  ): Promise<{ sentCount: number; processed: string[] }> {
    const now = new Date();
    // 2 minutes from now with a 10-second buffer to absorb polling jitter
    const twoMinutesFromNow = new Date(now.getTime() + (2 * 60 + 10) * 1000).toISOString();
    // Only look back up to 15 minutes to avoid alerting on stale missed items
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

    const { data: schedules, error } = await supabase
      .from("content_schedules")
      .select(`
        id,
        target_publish_time,
        display_timezone,
        schedule_state,
        auto_publish,
        auto_delete_media,
        notify_email_sent,
        notify_email_target,
        content_posts (
          id,
          title,
          user_id,
          media_assets (
            file_name
          )
        ),
        content_post_platforms (
          title,
          visibility
        )
      `)
      .eq("schedule_state", "scheduled")
      .eq("notify_email_sent", false)
      .lte("target_publish_time", twoMinutesFromNow)
      .gte("target_publish_time", fifteenMinutesAgo);

    if (error || !schedules || schedules.length === 0) {
      return { sentCount: 0, processed: [] };
    }

    const processed: string[] = [];

    for (const sched of schedules) {
      const post = sched.content_posts as any;
      const platform = sched.content_post_platforms as any;
      const media = post?.media_assets as any;

      const autoPublish = sched.auto_publish !== false;
      const autoDeleteMedia = sched.auto_delete_media !== false;

      // USER RULE:
      // "if the user has selected both option to auto upload and purge then we dont send any email
      // and if even one of the option is not selected then we have to send the email"
      if (autoPublish && autoDeleteMedia) {
        // Both options are active -> Do NOT send advance email.
        // Mark notify_email_sent as true so it won't be queried again during pre-publish.
        await supabase
          .from("content_schedules")
          .update({
            notify_email_sent: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sched.id);
        continue;
      }

      // Even one option is NOT selected (requires user click on site) -> send 2-minute advance email
      const recipient = sched.notify_email_target || fallbackUserEmail;

      const res = await this.sendScheduleReminderEmail(supabase, {
        recipientEmail: recipient,
        scheduleId: sched.id,
        videoTitle: platform?.title || post?.title || "Scheduled Video",
        targetPublishTime: sched.target_publish_time,
        displayTimezone: sched.display_timezone || "UTC",
        visibility: platform?.visibility || "public",
        fileName: media?.file_name || null,
        autoPublish,
        autoDeleteMedia,
      });

      if (res.success) {
        // Mark as sent so it never triggers again for this schedule
        await supabase
          .from("content_schedules")
          .update({
            notify_email_sent: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sched.id);

        processed.push(sched.id);
      }
    }

    return { sentCount: processed.length, processed };
  }

  /**
   * Dispatches the post-publish confirmation email
   * (Sent ONLY when BOTH options: auto-publish AND auto-delete are enabled)
   */
  async sendPostPublishConfirmationEmail(
    supabase: SupabaseClient,
    params: SendPostPublishEmailParams
  ): Promise<EmailDispatchResult> {
    const subject = `🎉 Live on YouTube: "${params.videoTitle}" has been published!`;
    const htmlBody = this.buildPostPublishSuccessHtml(params);

    const emailRecordId = `email_pub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const transporter = this.getTransporter();

    if (transporter) {
      try {
        const fromAddress =
          process.env.SMTP_FROM ||
          `"Creator Hub" <${process.env.SMTP_USER || process.env.GMAIL_USER || "no-reply@creatorhub.local"}>`;

        const info = await transporter.sendMail({
          from: fromAddress,
          to: params.recipientEmail,
          subject,
          html: htmlBody,
        });

        await supabase.from("email_notifications").insert({
          id: emailRecordId,
          schedule_id: params.scheduleId,
          recipient_email: params.recipientEmail,
          subject,
          html_body: htmlBody,
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        return {
          success: true,
          messageId: info.messageId,
          status: "sent",
        };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "SMTP post-publish send failure";
        console.error("Post-publish send failed:", errMsg);

        await supabase.from("email_notifications").insert({
          id: emailRecordId,
          schedule_id: params.scheduleId,
          recipient_email: params.recipientEmail,
          subject,
          html_body: htmlBody,
          status: "failed",
          error_message: errMsg,
          sent_at: new Date().toISOString(),
        });

        return {
          success: false,
          status: "failed",
          error: errMsg,
        };
      }
    }

    // Simulation fallback
    try {
      await supabase.from("email_notifications").insert({
        id: emailRecordId,
        schedule_id: params.scheduleId,
        recipient_email: params.recipientEmail,
        subject,
        html_body: htmlBody,
        status: "simulated",
        sent_at: new Date().toISOString(),
      });
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      messageId: `simulated_${emailRecordId}`,
      status: "simulated",
    };
  }
}

export const emailNotificationService = new EmailNotificationService();
