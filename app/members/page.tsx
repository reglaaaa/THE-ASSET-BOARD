import { Mail } from "lucide-react";
import { Logo } from "@/components/Logo";

type Member = {
  name: string;
  position: string;
  email: string | null;
  photo: string;
};

type Section = {
  title: string;
  members: Member[];
};

const SECTIONS: Section[] = [
  {
    title: "Executive Officers",
    members: [
      {
        name: "Enriquez, Jamyka Trina B.",
        position: "President",
        email: "26-35282@g.batstate-u.edu.ph",
        photo: "/members/president-enriquez.jpg"
      },
      {
        name: "Balmes, Harold Allen R.",
        position: "Executive Vice President",
        email: null,
        photo: "/members/vp-balmes.jpg"
      },
      {
        name: "Sinahon, Mikaella Rhaynne E.",
        position: "Secretary",
        email: "26-36092@g.batstate-u.edu.ph",
        photo: "/members/secretary-sinahon.jpg"
      },
      {
        name: "Casabuena, Ann Maricon Q.",
        position: "Asst. Secretary",
        email: "26-34244@g.batstate-u.edu.ph",
        photo: "/members/asst-secretary-casabuena.jpg"
      },
      {
        name: "Llenado, Felicity Becky C.",
        position: "Treasurer",
        email: "26-30476@g.batstate-u.edu.ph",
        photo: "/members/treasurer-llenado.jpg"
      },
      {
        name: "Ballesteros, Gabriel Giancarlo K.",
        position: "Asst. Treasurer",
        email: "26-31546@g.batstate-u.edu.ph",
        photo: "/members/asst-treasurer-ballesteros.jpg"
      },
      {
        name: "Castillo, Mervin F.",
        position: "Auditor",
        email: "26-36352@g.batstate-u.edu.ph",
        photo: "/members/auditor-castillo.jpg"
      },
      {
        name: "Regalado, Gerome Cristof R.",
        position: "Public Relations Officer",
        email: "26-32070@g.batstate-u.edu.ph",
        photo: "/members/pro-regalado.jpg"
      },
      {
        name: "Bullon, Jayron Anthony M.",
        position: "Board Member",
        email: "26-36707@g.batstate-u.edu.ph",
        photo: "/members/board-bullon.jpg"
      }
    ]
  },
  {
    title: "Program Representatives",
    members: [
      {
        name: "Macalintal, Rim Rilley C.",
        position: "Aerospace Engineering Rep.",
        email: "26-30817@g.batstate-u.edu.ph",
        photo: "/members/rep-aerospace-macalintal.jpg"
      },
      {
        name: "Dela Rosa, Beau Martin",
        position: "Automotive Engineering Rep.",
        email: "26-38348@g.batstate-u.edu.ph",
        photo: "/members/rep-automotive-delarosa.jpg"
      },
      {
        name: "Badillo, Frances Colleen B.",
        position: "Biomedical Engineering Rep.",
        email: null,
        photo: "/members/rep-biomed-badillo.jpg"
      },
      {
        name: "Abillar, Jeseer John S.",
        position: "Food Engineering Rep.",
        email: "26-37626@g.batstate-u.edu.ph",
        photo: "/members/rep-food-abillar.jpg"
      },
      {
        name: "Vargas, Von Cyruz T.",
        position: "Instrumentation & Control Engineering Rep.",
        email: "26-39350@g.batstateu-edu.ph",
        photo: "/members/rep-ice-vargas.jpg"
      },
      {
        name: "Panopio, Jeric",
        position: "Mechatronics Engineering Rep.",
        email: "26-36419@g.batstate-u.edu.ph",
        photo: "/members/rep-mechatronics-panopio.jpg"
      },
      {
        name: "Fideli, Ren Eunice",
        position: "Transportation System Engineering Rep.",
        email: null,
        photo: "/members/rep-tse-fideli.jpg"
      },
      {
        name: "Bringas, Adam Matthew T.",
        position: "Computer Engineering Technology Rep.",
        email: "26-31144@g.batstate-u.edu.ph",
        photo: "/members/rep-cet-bringas.jpg"
      },
      {
        name: "Latayan, Prince Gabriel T.",
        position: "Electrical Engineering Technology Rep.",
        email: "26-33303@g.batstate-u.edu.ph",
        photo: "/members/rep-eet-latayan.jpg"
      },
      {
        name: "Urriza, Noah Isaac I.",
        position: "Electronics Engineering Technology Rep.",
        email: "26-36605@g.batstate-u.edu.ph",
        photo: "/members/rep-elxt-urriza.jpg"
      }
    ]
  },
  {
    title: "Committees",
    members: [
      {
        name: "Bool, Carmel Faye Marie G.",
        position: "Academic Affairs",
        email: null,
        photo: "/members/com-academic-bool.jpg"
      },
      {
        name: "Evangelista, James Niño V.",
        position: "Sports and Athletics",
        email: null,
        photo: "/members/com-sports-evangelista.jpg"
      },
      {
        name: "Pendel, Cyrus James L.",
        position: "Culture and Arts",
        email: "26-36266@g.batstate-u.edu.ph",
        photo: "/members/com-culture-pendel.jpg"
      },
      {
        name: "Flores, Jeremy Robi S.",
        position: "Technical Affairs",
        email: "26-33347@g.batstate-u.edu.ph",
        photo: "/members/com-technical-flores.jpg"
      },
      {
        name: "Dapol, Nealah Reign M.",
        position: "Publication Affairs",
        email: "26-30900@g.batstate-u.edu.ph",
        photo: "/members/com-publication-dapol.jpg"
      },
      {
        name: "Joson, Samantha Gracelle S.",
        position: "Media Affairs",
        email: "26-37218@g.batstate-u.edu.ph",
        photo: "/members/com-media-joson.jpg"
      },
      {
        name: "Samatra, Gia Sharlene A.",
        position: "DRRM Committee",
        email: "26-34616@g.batstate-u.edu.ph",
        photo: "/members/com-drrm-samatra.jpg"
      },
      {
        name: "Jacob, Prince Enzo R.",
        position: "Student Rights and Welfare",
        email: "26-36522@g.batstate-u.edu.ph",
        photo: "/members/com-srw-jacob.jpg"
      },
      {
        name: "Selim Jr., Jimmy Emmanuel M.",
        position: "Gender and Development",
        email: "26-32139@g.batstate-u.edu.ph",
        photo: "/members/com-gad-selim.jpg"
      },
      {
        name: "Miralpez, Ryza Claire R.",
        position: "Sustainable Development",
        email: null,
        photo: "/members/com-sd-miralpez.jpg"
      },
      {
        name: "Atienza, Jhian Carlo M.",
        position: "Scholarships and Awards",
        email: "26-34622@g.batstate-u.edu.ph",
        photo: "/members/com-scholar-atienza.jpg"
      },
      {
        name: "Robles, Roland Michael A.",
        position: "Research Affairs",
        email: "26-30310@g.batstate-u.edu.ph",
        photo: "/members/com-research-robles.jpg"
      },
      {
        name: "Celiz, Shekinah D.",
        position: "Extension Services",
        email: null,
        photo: "/members/com-extension-celiz.jpg"
      },
      {
        name: "Porto, Rhinna Jane S.",
        position: "Linkages and Industry Partnerships",
        email: "26-30332@g.batstate-u.edu.ph",
        photo: "/members/com-linkages-porto.jpg"
      }
    ]
  }
];

function MemberCard({ member }: { member: Member }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl border border-ink-600 bg-ink-800/60 p-4 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={member.photo}
        alt={member.name}
        className="h-20 w-20 rounded-full border-2 border-gold-600/50 object-cover"
      />
      <div>
        <p className="font-display text-sm font-bold leading-snug text-[#f2ecdb]">
          {member.name}
        </p>
        <p className="mt-0.5 text-[11px] font-medium tracking-wide text-gold-300">
          {member.position}
        </p>
      </div>
      {member.email ? (
        <a
          href={`mailto:${member.email}`}
          className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-400 hover:text-gold-300"
        >
          <Mail size={11} strokeWidth={2.2} />
          <span className="break-all">{member.email}</span>
        </a>
      ) : (
        <p className="mt-0.5 text-[11px] text-ink-400/60">Email not available</p>
      )}
    </div>
  );
}

export default function MembersPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-24">
      <header className="sticky top-0 z-10 -mx-4 border-b border-ink-700 bg-ink-950/85 px-4 pb-3 pt-5 backdrop-blur">
        <Logo />
        <p className="mt-1.5 text-xs tracking-wide text-ink-400">
          Meet the council — officers, representatives, and committees.
        </p>
      </header>

      <div className="mt-5 flex flex-col gap-7">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 font-display text-base font-bold text-[#f2ecdb]">
              {section.title}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {section.members.map((member) => (
                <MemberCard key={member.name} member={member} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
