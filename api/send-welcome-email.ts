import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import admin from 'firebase-admin';

// Initialize Firebase Admin (Assumes credentials are in environment)
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    });
}

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // --- SECURITY: Verify Firebase Auth Token ---
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log(`Verified request from user: ${decodedToken.uid}`);
    } catch (authError) {
        console.error('Auth verification failed:', authError);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    // --- END SECURITY ---

    const { email, username } = req.body;

    if (!email || !username) {
        return res.status(400).json({ error: 'Email and username are required' });
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Venda Learn <onboarding@resend.dev>',
            to: [email],
            subject: 'Roṱhani! Welcome to Venda Learn 🎉',
            html: buildWelcomeEmail(username),
        });

        if (error) {
            console.error('Resend error:', error);
            return res.status(500).json({ error: 'Failed to send email' });
        }

        return res.status(200).json({ success: true, id: data?.id });
    } catch (err) {
        console.error('Email send error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

function buildWelcomeEmail(username: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Venda Learn</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9FAFB; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
                        
                        <!-- Header Banner -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #FACC15 0%, #F59E0B 100%); padding: 40px 32px; text-align: center;">
                                <div style="font-size: 48px; margin-bottom: 12px;">🇿🇦</div>
                                <h1 style="margin: 0; color: #111827; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                                    Roṱhani, ${username}!
                                </h1>
                                <p style="margin: 8px 0 0; color: #92400E; font-size: 14px; font-weight: 600;">
                                    Welcome to Venda Learn
                                </p>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding: 32px;">
                                <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.7;">
                                    Your account has been created and you're ready to start learning Tshivenḓa! Here's what you can do:
                                </p>

                                <!-- Feature List -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                                    <tr>
                                        <td style="padding: 12px 16px; background-color: #FFFBEB; border-radius: 10px; margin-bottom: 8px;">
                                            <table role="presentation" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td style="vertical-align: top; padding-right: 12px; font-size: 20px;">📚</td>
                                                    <td>
                                                        <strong style="color: #111827; font-size: 14px;">Interactive Lessons</strong>
                                                        <p style="margin: 4px 0 0; color: #6B7280; font-size: 13px;">Learn vocabulary, grammar, and phrases step by step</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr><td style="height: 8px;"></td></tr>
                                    <tr>
                                        <td style="padding: 12px 16px; background-color: #FFFBEB; border-radius: 10px;">
                                            <table role="presentation" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td style="vertical-align: top; padding-right: 12px; font-size: 20px;">🎮</td>
                                                    <td>
                                                        <strong style="color: #111827; font-size: 14px;">Fun Games</strong>
                                                        <p style="margin: 4px 0 0; color: #6B7280; font-size: 13px;">Practice with word battles, puzzles, and challenges</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr><td style="height: 8px;"></td></tr>
                                    <tr>
                                        <td style="padding: 12px 16px; background-color: #FFFBEB; border-radius: 10px;">
                                            <table role="presentation" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td style="vertical-align: top; padding-right: 12px; font-size: 20px;">🔥</td>
                                                    <td>
                                                        <strong style="color: #111827; font-size: 14px;">Daily Streaks</strong>
                                                        <p style="margin: 4px 0 0; color: #6B7280; font-size: 13px;">Keep your streak alive and earn bonus points</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <!-- CTA Button -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <a href="https://venda-learn.vercel.app" 
                                               style="display: inline-block; background-color: #FACC15; color: #111827; font-weight: 700; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 15px; box-shadow: 0 4px 0 #EAB308; letter-spacing: 0.5px;">
                                                START LEARNING →
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 32px 28px; border-top: 1px solid #F3F4F6; text-align: center;">
                                <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                                    You received this because you registered on Venda Learn.<br>
                                    © ${new Date().getFullYear()} Venda Learn. All rights reserved.
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
