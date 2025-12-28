
import { inngest } from "../client.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";

console.log("[on-signup.js] File loaded");

export const onUserSignup = inngest.createFunction(
    { id: "on-user-signup", retries: 2 },
    { event: "user/signup" },
    async ({ event, step }) => {
        console.log("[onUserSignup] Function triggered");
        const { email } = event.data
        console.log("[onUserSignup] Event data:", event.data);
        const user = await step.run("get-user-email", async () => {
            console.log("[step:get-user-email] Looking for user with email:", email);
            const userObject = await User.findOne({ email });
            if (!userObject) {
                console.log("[step:get-user-email] User not found for email:", email);
                throw new NonRetriableError("User Does not exist");
            }
            console.log("[step:get-user-email] User found:", userObject);
            return userObject;
        })


        await step.run("send-welcome-message", async () => {
            console.log("[step:send-welcome-message] Preparing to send welcome email to:", user.email);
            const subject = `Welcome to the app!`
            const message = `Hi\n\nThanks for signing up! We're glad to have you onboard!`
            try {
                const mailResult = await sendMail(user.email, subject, message);
                console.log("[step:send-welcome-message] Email sent result:", mailResult);
            } catch (mailErr) {
                console.error("[step:send-welcome-message] Error sending email:", mailErr);
                throw mailErr;
            }
        })

        console.log("[onUserSignup] All steps completed successfully");
        return { success: true };
    }
)