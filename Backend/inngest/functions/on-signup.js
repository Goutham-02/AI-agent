import { inngest } from "../client";
import User from "../../models/user";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer";

export const onUserSignup = inngest.createFunction(
    { id: "on-user-signup", retries: 2 },
    { event: "user/signup" },
    async ({ event, step }) => {
        try {
            const { email } = event.data
            const user = await step.run("get-user-email", async () => {
                const userObject = await User.findOne({ email });
                if (!userObject) {
                    throw new NonRetriableError("User Does not exist");
                }
                return userObject;
            })


            await step.run("send-welcome-error", async () => {
                const subject = `Welcome to the app!`
                const message = `Hi
                \n\n
                Thanks for signing up! We're glad to have you onboard!
                `
                await sendMail(user.email, subject, message);
            })

            return { success: true };
        } catch (error) {
            console.error("Error running step", error.message)
            return { success: false }
        }
    }
)