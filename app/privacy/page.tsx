import type { Metadata } from "next";
import { LegalPage, Section, Bullets } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy — THE ASSET" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 8, 2026">
      <p>
        This Policy explains what information THE ASSET collects, why, and what your
        choices are. We aim to follow the Data Privacy Act of 2012 (Republic Act No. 10173)
        and collect only what the Platform needs. By clicking “I Accept”, you consent to
        the collection and use described below.
      </p>

      <Section title="1. Information we collect">
        <Bullets
          items={[
            "What you submit: the text of your posts and comments, the category (concern or suggestion), whether it is urgent, and whether it is public or SSC-only, with the time it was posted.",
            "Your likes on posts.",
            "A random device ID: generated in your browser, not linked to your name, student number, or email. It is sent with your posts, comments, and likes so we can limit spam and stop repeated likes.",
            "Technical data: your IP address and basic request details are processed by our hosting and database providers and are used for security and rate limiting (for example, to limit repeated admin password attempts).",
            "If you email the Council: your email address and message."
          ]}
        />
        <p>
          We do not ask for your name, student number, email, or phone number to post. We
          do not use advertising trackers.
        </p>
      </Section>

      <Section title="2. Please do not include personal details">
        <p>
          Anything you type in a post or comment may be read by others. Please do not
          include your name, contact details, or private information about yourself or
          other people. We may edit or remove posts that contain personal data.
        </p>
      </Section>

      <Section title="3. How we use information">
        <Bullets
          items={[
            "To show posts, comments, likes, and statuses on the Platform.",
            "To let the Council review, reply to, and act on concerns and suggestions.",
            "To notify the Council by email when a new post is made (the email contains the post text, category, and whether it is urgent).",
            "To prevent spam, abuse, and misuse, and to keep the Platform secure.",
            "To improve the Platform and make general reports, without identifying individuals."
          ]}
        />
      </Section>

      <Section title="4. Who can see it">
        <Bullets
          items={[
            "Public posts, comments, and like counts are visible to anyone with the link.",
            "SSC-only posts are visible only to authorized Council officers.",
            "Authorized officers can see all posts and comments, but the Platform does not show them who the poster is.",
            "We may share information with University officials, or as required by law, in cases involving threats, safety, or serious violations of University rules."
          ]}
        />
        <p>We do not sell your information.</p>
      </Section>

      <Section title="5. Service providers">
        <p>
          We use trusted services to run the Platform: Supabase (database), Vercel
          (hosting), and Resend (email notifications to the Council). These providers
          process data for us and may store it on servers outside the Philippines.
        </p>
      </Section>

      <Section title="6. Data saved in your browser">
        <Bullets
          items={[
            "Your acceptance of these Terms and this Policy.",
            "Your random device ID and which posts you have liked.",
            "Recent post and comment times, used to show gentle “slow down” reminders.",
            "For authorized officers only: a temporary admin session, which is cleared when the browser tab is closed."
          ]}
        />
        <p>
          You can clear this data any time through your browser settings. Doing so resets
          your device ID, so your earlier likes will no longer be linked to you.
        </p>
      </Section>

      <Section title="7. How long we keep it">
        <p>
          Posts, comments, and the Council’s budget and archive records are kept while they
          are useful to the Council and for records of the term, and may be passed to the
          incoming Council. We delete or anonymize data that is no longer needed. Content
          that breaks our rules may be removed sooner.
        </p>
      </Section>

      <Section title="8. Security">
        <p>
          Admin tools are password-protected and rate limited, and the database limits
          what the public site can read and write. No system is completely secure, so
          please share carefully.
        </p>
      </Section>

      <Section title="9. Your rights">
        <p>
          Under the Data Privacy Act, you may ask to know what data we hold about you,
          correct it, object to its use, or request that it be removed. Because posts are
          anonymous, we may not be able to find which posts are yours. If you want a post
          removed, email us with a link to it and a short reason, and we will review the
          request. You also have the right to complain to the National Privacy Commission
          (privacy.gov.ph).
        </p>
      </Section>

      <Section title="10. Children and students under 18">
        <p>
          The Platform is for university students. We do not knowingly collect personal
          information from children, and we ask everyone to avoid sharing personal details.
        </p>
      </Section>

      <Section title="11. Changes and contact">
        <p>
          When this Policy changes in an important way, we will ask you to accept again.
          For privacy questions or requests, email the Executive PRO II at{" "}
          <a href="mailto:26-32070@g.batstate-u.edu.ph" className="text-gold-300 underline">
            26-32070@g.batstate-u.edu.ph
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
