import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../core/auth.service';

/** Public landing page shown first at "/". "Sign in" leads to /login. */
@Component({
  selector: 'app-landing', standalone: true, imports: [RouterLink],
  template: `
  <header class="nav"><div class="wrap navin">
    <a class="brand" routerLink="/" aria-label="Campus1Cloud home"><i>C</i><b>Campus1<span>Cloud</span></b></a>
    <nav class="links" aria-label="Sections"><a routerLink="/" fragment="features">Features</a><a routerLink="/" fragment="roles">Who it's for</a><a routerLink="/" fragment="how">How it works</a><a routerLink="/" fragment="secure">Security</a></nav>
    @if (auth.user()) { <a class="btn solid" [routerLink]="auth.home()">Open my dashboard</a> } @else { <a class="btn solid" routerLink="/login">Sign in</a> }
  </div></header>

  <div class="page">
  <section class="hero"><div class="wrap herogrid">
    <div>
      <p class="eyebrow">Learn · Manage · Grow together</p>
      <h1>Run every school on one cloud desk.</h1>
      <p class="lead">Campus1Cloud gives each school its own space for attendance, timetables, teachers, fees, store, events and sports, and tells parents the moment a child is marked absent.</p>
      <div class="cta">
        @if (auth.user()) { <a class="btn solid big" [routerLink]="auth.home()">Open my dashboard</a> } @else { <a class="btn solid big" routerLink="/login">Sign in</a> }
        <a class="btn ghost big" [href]="mail">Book a demo</a>
      </div>
      <p class="small">Schools join by invitation only. Ask your school or Campus1Cloud for your link.</p>
    </div>
    <div class="mock" aria-hidden="true">
      <div class="card c1"><span class="dot red"></span><div><b>Absent alert sent</b><small>Aarav Reddy, Class 8A · parent notified at 9:12 AM</small></div></div>
      <div class="card c2"><span class="dot amber"></span><div><b>Maths sir is on leave</b><small>P3 and P5 covered by Mrs. Kavitha (free, Maths)</small></div></div>
      <div class="card c3"><div class="bars"><i style="--h:82%"></i><i style="--h:91%"></i><i style="--h:76%"></i><i style="--h:95%"></i><i style="--h:88%"></i><i style="--h:69%"></i></div><div><b>94% present today</b><small>Class-wise attendance</small></div></div>
      <div class="card c4"><span class="dot green"></span><div><b>Fee receipt RCP-1001</b><small>₹11,000 paid online</small></div></div>
    </div>
  </div></section>

  <section class="strip"><div class="wrap stripin">
    <div><b>1 login per person</b><span>Your own password, set from an invite</span></div>
    <div><b>Instant parent alerts</b><span>Absence, marks and fee reminders</span></div>
    <div><b>1-click substitutes</b><span>Free teachers ranked for each period</span></div>
    <div><b>Every school separate</b><span>Data never mixes between schools</span></div>
  </div></section>

  <section id="features" class="sec"><div class="wrap">
    <p class="eyebrow">Features</p><h2>Everything a school office does every day</h2>
    <div class="grid">
      @for (f of features; track f.t) {
        <article class="feat"><span class="ico" [style.background]="f.c">{{ f.i }}</span><h3>{{ f.t }}</h3><p>{{ f.d }}</p></article>
      }
    </div>
  </div></section>

  <section id="roles" class="sec alt"><div class="wrap">
    <p class="eyebrow">Who it's for</p><h2>One platform, four kinds of people</h2>
    <div class="roles">
      @for (r of roles; track r.t) {
        <article class="rcard" [style.--c]="r.c"><h3>{{ r.t }}</h3><ul>@for (x of r.items; track x) { <li>{{ x }}</li> }</ul></article>
      }
    </div>
  </div></section>

  <section id="how" class="sec"><div class="wrap">
    <p class="eyebrow">How it works</p><h2>Invitation by invitation</h2>
    <ol class="steps">
      <li><b>1</b><h3>Campus1Cloud invites the principal</h3><p>We set up your school and send the principal a one-time link.</p></li>
      <li><b>2</b><h3>Principal invites teachers</h3><p>Add teachers, classes and the timetable. Cover leave with one click.</p></li>
      <li><b>3</b><h3>Teachers invite parents</h3><p>Teachers add their students and invite the parents to the app.</p></li>
      <li><b>4</b><h3>Everyone stays in the loop</h3><p>Attendance, marks, homework and fees reach the right person.</p></li>
    </ol>
  </div></section>

  <section id="secure" class="sec alt"><div class="wrap sec2">
    <div><p class="eyebrow">Security</p><h2>Built to keep children's data safe</h2>
      <p class="lead2">No public sign up and no shared passwords. Every school's data is walled off from every other school.</p></div>
    <ul class="ticks">
      <li>Invite-only accounts: each person sets their own password</li>
      <li>Short-lived secure sessions that renew quietly and end on logout</li>
      <li>Accounts lock after repeated wrong passwords</li>
      <li>Role-based access: teachers and parents only see what they should</li>
      <li>School suspended? Its access stops immediately</li>
    </ul>
  </div></section>

  <section class="final"><div class="wrap">
    <h2>Ready to see your school on Campus1Cloud?</h2>
    <div class="cta center">
      @if (auth.user()) { <a class="btn white big" [routerLink]="auth.home()">Open my dashboard</a> } @else { <a class="btn white big" routerLink="/login">Sign in</a> }
      <a class="btn line big" [href]="mail">Book a demo</a>
    </div>
  </div></section>
  </div>

  <footer class="foot"><div class="wrap footin">
    <img class="flogo" src="campus1cloud-logo.png" alt="Campus1Cloud: learn, manage, grow together"><span>© {{ year }} Campus1Cloud · campus1cloud.com</span>
  </div></footer>`,
  styles: [`
  :host{display:block;background:#fff;--blue:#0a8fd6;--blue2:#1e5fc6;--navy:#1d3160;--slate:#44546a;--ink:#16233b;--mut:#5b6b82;--line:#dbe5f0;--soft:#f3f8fd;
    font-family:"Figtree",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:#fff;line-height:1.55}
  *{box-sizing:border-box}
  .wrap{max-width:1120px;margin:0 auto;padding:0 20px}
  h1,h2,h3{font-family:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;line-height:1.12;margin:0;color:var(--navy)}
  h1{font-size:clamp(2.2rem,5.4vw,3.7rem);letter-spacing:-.02em}
  h2{font-size:clamp(1.7rem,3.4vw,2.4rem);letter-spacing:-.015em;margin-bottom:28px}
  h3{font-size:1.1rem}
  p{margin:0}
  a{color:inherit}
  .eyebrow{font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;font-weight:600;color:var(--blue);margin-bottom:12px}
  .nav{position:sticky;top:0;z-index:5;background:rgb(255 255 255/.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
  .navin{display:flex;align-items:center;gap:20px;height:64px}
  .brand{display:flex;align-items:center;gap:9px;text-decoration:none;font-family:"Bricolage Grotesque",ui-sans-serif,sans-serif;font-weight:700;font-size:1.25rem;color:var(--slate);letter-spacing:-.01em}
  .brand b{font-weight:700}.brand span{color:var(--blue)}
  .brand i{font-style:normal;display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--blue),var(--blue2));color:#fff;font-size:1.05rem}
  .links{display:flex;gap:22px;margin-left:auto;font-size:.95rem}
  .links a{text-decoration:none;color:var(--slate)}.links a:hover{color:var(--blue2)}
  .btn{display:inline-flex;align-items:center;justify-content:center;padding:9px 18px;border-radius:10px;font-weight:600;text-decoration:none;border:1.5px solid transparent;cursor:pointer;font-size:.95rem;transition:transform .15s,box-shadow .15s}
  .btn:hover{transform:translateY(-1px)}
  .btn:focus-visible{outline:3px solid #9ccbf3;outline-offset:2px}
  .btn.solid{background:linear-gradient(120deg,var(--blue),var(--blue2));color:#fff;box-shadow:0 6px 16px rgb(30 95 198/.28)}
  .btn.ghost{border-color:var(--line);color:var(--navy);background:#fff}
  .btn.white{background:#fff;color:var(--blue2)}
  .btn.line{background:transparent;border-color:rgb(255 255 255/.75);color:#fff}.btn.line:hover{background:rgb(255 255 255/.12)}
  .btn.big{padding:13px 26px;font-size:1.02rem}
  .hero{background:radial-gradient(900px 420px at 85% -10%,#d6ecfb 0,transparent 70%),linear-gradient(#fff,var(--soft));padding:64px 0 56px}
  .herogrid{display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center}
  .lead{font-size:1.15rem;color:var(--mut);margin:18px 0 26px;max-width:34em}
  .cta{display:flex;gap:12px;flex-wrap:wrap}.cta.center{justify-content:center}
  .small{font-size:.88rem;color:var(--mut);margin-top:16px}
  .mock{position:relative;min-height:340px}
  .card{position:absolute;display:flex;gap:12px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;box-shadow:0 14px 34px rgb(29 49 96/.12);max-width:330px}
  .card b{display:block;font-size:.95rem;color:var(--navy)}.card small{display:block;color:var(--mut);font-size:.8rem;line-height:1.35}
  .c1{top:0;left:0}.c2{top:92px;right:0}.c3{top:196px;left:20px}.c4{top:290px;right:14px;max-width:270px}
  .dot{width:12px;height:12px;border-radius:99px;flex:none}.red{background:#e0503f}.amber{background:#e8a020}.green{background:#2fa36b}
  .bars{display:flex;align-items:flex-end;gap:4px;height:44px;width:70px;flex:none}
  .bars i{flex:1;height:var(--h);background:linear-gradient(var(--blue),var(--blue2));border-radius:3px 3px 0 0}
  .strip{background:var(--navy);color:#fff}.stripin{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding-top:22px;padding-bottom:22px}
  .stripin b{display:block;font-family:"Bricolage Grotesque",sans-serif;font-size:1.05rem}.stripin span{font-size:.85rem;color:#b9c8e6}
  .sec{padding:76px 0;scroll-margin-top:64px}.sec.alt{background:var(--soft)}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
  .feat{background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px;transition:box-shadow .2s,transform .2s}
  .feat:hover{box-shadow:0 14px 30px rgb(29 49 96/.1);transform:translateY(-2px)}
  .feat h3{margin:14px 0 6px}.feat p{color:var(--mut);font-size:.95rem}
  .ico{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;color:#fff;font-size:1.25rem}
  .roles{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
  .rcard{background:#fff;border:1px solid var(--line);border-top:4px solid var(--c);border-radius:14px;padding:20px}
  .rcard ul{margin:12px 0 0;padding-left:18px;color:var(--mut);font-size:.93rem}.rcard li{margin:5px 0}
  .steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
  .steps li{padding:20px;border:1px solid var(--line);border-radius:16px;background:#fff}
  .steps b{display:grid;place-items:center;width:34px;height:34px;border-radius:99px;background:linear-gradient(120deg,var(--blue),var(--blue2));color:#fff;margin-bottom:12px}
  .steps p{color:var(--mut);font-size:.93rem;margin-top:6px}
  .sec2{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}.sec2 h2{margin-bottom:12px}
  .lead2{color:var(--mut);font-size:1.05rem}
  .ticks{list-style:none;margin:0;padding:0}.ticks li{padding:11px 0 11px 34px;position:relative;border-bottom:1px solid var(--line)}
  .ticks li::before{content:"✓";position:absolute;left:0;top:10px;width:22px;height:22px;border-radius:99px;background:#dff1e8;color:#1f8a58;display:grid;place-items:center;font-size:.8rem;font-weight:700}
  .final{background:linear-gradient(120deg,var(--blue),var(--blue2) 60%,var(--navy));color:#fff;text-align:center;padding:64px 0}
  .final h2{color:#fff;margin-bottom:24px}
  .flogo{height:64px;width:auto;border-radius:10px;background:#fff}
  .foot{background:#0f1c3a;color:#aab9d8;font-size:.88rem}.footin{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-top:22px;padding-bottom:22px}
  @media (max-width:900px){
    .herogrid,.sec2{grid-template-columns:1fr}.grid,.roles,.steps{grid-template-columns:1fr 1fr}.stripin{grid-template-columns:1fr 1fr}.links{display:none}.navin{justify-content:space-between}
    .mock{min-height:0;display:grid;gap:12px}.card{position:static;max-width:none}
  }
  @media (max-width:560px){.grid,.roles,.steps{grid-template-columns:1fr}.hero{padding-top:40px}.sec{padding:56px 0}.btn.big{width:100%}.cta{flex-direction:column}}
  @media (prefers-reduced-motion:reduce){*{transition:none!important}}
  `],
})
export class LandingComponent {
  auth = inject(Auth);
  year = new Date().getFullYear();
  // Change this address to the one you want demo requests sent to.
  mail = 'mailto:hello@campus1cloud.com?subject=Campus1Cloud%20demo';
  features = [
    { i: '✓', c: '#0a8fd6', t: 'Attendance with parent alerts', d: 'Mark a class in seconds. Parents of absent children are alerted once, with a correction if you change it.' },
    { i: '⇄', c: '#1e5fc6', t: 'Substitute teachers in one click', d: 'When a teacher is on leave, free teachers are ranked per period: same subject first, then lightest load.' },
    { i: '▦', c: '#6a4fc9', t: 'Clash-free timetables', d: 'A class timetable that never double-books a teacher, with substitutes shown on the day.' },
    { i: '₹', c: '#e2603f', t: 'Fees and receipts', d: 'See dues by class, send reminders and let parents pay online with a receipt.' },
    { i: '✎', c: '#2fa36b', t: 'Marks and homework', d: 'Teachers enter marks and homework. Parents see them, and low marks trigger an alert.' },
    { i: '▣', c: '#d98f22', t: 'Stationery store', d: 'Track stock, get low-stock warnings and issue items to students.' },
    { i: '★', c: '#0a8fd6', t: 'Events and sports', d: 'A school calendar with photos, teams, fixtures and results.' },
    { i: '⛟', c: '#1e5fc6', t: 'Transport', d: 'Bus routes and stops, so parents know where the bus is meant to be.' },
    { i: '⌕', c: '#44546a', t: 'Search across every school', d: 'The platform owner can search and filter any school\'s data from one place.' },
  ];
  roles = [
    { t: 'Platform owner', c: '#1e5fc6', items: ['Add and suspend schools', 'Plans and renewals', 'Search every school', 'View as any school'] },
    { t: 'Principal', c: '#0a8fd6', items: ['School dashboard', 'Classes, teachers, students', 'Leave and substitutes', 'Fees, store, events'] },
    { t: 'Teacher', c: '#2fa36b', items: ['Mark attendance', 'Marks and homework', 'Own timetable and leave', 'Invite parents'] },
    { t: 'Parent', c: '#e2603f', items: ['Absence and marks alerts', 'Fees and receipts', 'Timetable and homework', 'Events and school bus'] },
  ];
}
