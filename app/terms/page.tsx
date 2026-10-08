import type { Metadata } from "next";
import { LegalPage, Section, Bullets } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms and Conditions — THE ASSET" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions" updated="October 8, 2026">
      <p>
        These Terms govern your use of THE ASSET (the “Platform”), the official anonymous
        feedback and transparency website of the Batangas State University – Lima Campus
        Supreme Student Council (“SSC”, “we”, “us”). By clicking “I Accept” or using the
        Platform, you agree to these Terms and to our Privacy Policy. If you do not agree,
        please do not use the Platform.
      </p>

      <Section title="1. Who may use the Platform">
        <p>
          The Platform is intended for students of BatStateU – Lima Campus. If you are
          under 18, you confirm that you are using it as part of your school life and that
          your parent or guardian does not object.
        </p>
      </Section>

      <Section title="2. What the Platform does">
        <Bullets
          items={[
            "Feed: post concerns and suggestions, mark them urgent, set them to public or SSC-only, like, and comment, without creating an account.",
            "Budget: view the Council’s budget sources, expenses, and projects.",
            "Archives: read official announcements and reports.",
            "Members: view the Council’s officers, representatives, and committees."
          ]}
        />
      </Section>

      <Section title="3. Your content">
        <p>
          You are responsible for what you post and comment. By posting, you confirm that
          it is your own honest concern or suggestion and you allow the SSC to display,
          review, reply to, endorse to other offices, edit for clarity or privacy, and
          remove it. You keep ownership of your words, and you give us permission to use
          them for the purposes of the Platform and Council work.
        </p>
        <p>
          Anonymous does not mean unaccountable. Posts are visible to the public unless
          marked SSC-only, and nobody should assume that a post can never be traced.
        </p>
      </Section>

      <Section title="4. Rules of conduct">
        <p>You agree not to post or do any of the following:</p>
        <Bullets
          items={[
            "Threats, harassment, bullying, hate speech, or sexual or obscene content.",
            "Accusations or claims you know are false, or that name a person without a reasonable basis.",
            "Personal information about yourself or others, such as phone numbers, addresses, student numbers, or private photos.",
            "Spam, advertising, repeated posting, or attempts to get around rate limits.",
            "Impersonating officers, faculty, or other students, or pretending to be an official SSC response.",
            "Attempting to access the admin tools, interfere with the site, or collect other users’ data.",
            "Anything that breaks the law, the University’s rules, or the Student Handbook."
          ]}
        />
      </Section>

      <Section title="5. Moderation">
        <p>
          Authorized SSC officers may mark posts with a status (Investigating, Executing,
          Resolved, or Denied), post official replies, hide or delete posts and comments,
          and limit access for misuse, at any time and without notice. A post being
          “Denied” or removed is not a judgment about you personally. Concerns outside the
          Council’s authority may be endorsed to the proper University office.
        </p>
      </Section>

      <Section title="6. Urgent and serious matters">
        <p>
          The Platform is not an emergency service. If someone is in danger or needs
          immediate help, contact campus security, the guidance office, or local emergency
          services directly. Posts that describe serious threats, abuse, or risk to safety
          may be reported to the proper University authorities, and the Council may share
          information it holds when required by the University or the law.
        </p>
      </Section>

      <Section title="7. Budget and published information">
        <p>
          Budget figures and announcements are provided by authorized officers for
          transparency and are based on Council records at the time of posting. We try to
          keep them accurate and current, but they may contain errors or be updated later.
        </p>
      </Section>

      <Section title="8. No guarantees">
        <p>
          The Platform is student-run and provided “as is”. We do not promise that it will
          always be available or error-free, that every post will receive a reply by a
          certain date, or that every request will be approved. To the extent allowed by
          law, the SSC and its officers are not liable for losses from your use of the
          Platform or from content posted by other users.
        </p>
      </Section>

      <Section title="9. Changes and termination">
        <p>
          We may update these Terms or the Platform at any time. When we make important
          changes, we will ask you to accept again. Continuing to use the Platform after
          that means you accept the new Terms. We may suspend or remove access for anyone
          who breaks these Terms.
        </p>
      </Section>

      <Section title="10. Governing rules and contact">
        <p>
          These Terms are subject to the laws of the Republic of the Philippines and the
          policies of Batangas State University. For questions, takedown requests, or
          technical issues, email the Executive PRO II at{" "}
          <a href="mailto:26-32070@g.batstate-u.edu.ph" className="text-gold-300 underline">
            26-32070@g.batstate-u.edu.ph
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
