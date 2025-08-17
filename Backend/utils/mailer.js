import nodemailer from 'nodemailer';

export const sendMail = async (to, subject, from) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.AILTRAP_SMTP_HOST,
            port: process.env.AILTRAP_SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.AILTRAP_SMTP_USER,
                pass: process.env.AILTRAP_SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: 'NOREPLY Inngest',
            to,
            subject,
            text
        });

        console.log("Message sent:", info.messageId);
        return info;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
