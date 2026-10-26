import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, errText } from '../../core/api.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe } from '../../core/format';
import { copyText } from '../../core/clipboard';

/** A teacher adds students of the classes they teach and invites their parents. */
@Component({
  selector: 'app-my-students', standalone: true, imports: [FormsModule, ClassPipe, RouterLink],
  template: `
  <div class="head"><div><h1>My students</h1><p class="sub">Add a student and invite their parent to the app. You can add to the classes you teach.</p></div></div>
  <div class="stack">
    <section class="panel"><div class="ph"><h2>Invite a student's parent</h2></div>
      <form class="form" (ngSubmit)="add()">
        <label>Student name<input type="text" name="name" [(ngModel)]="f.name" required></label>
        <label>Class<select name="classCode" [(ngModel)]="f.classCode">@for (c of classes(); track c) { <option [value]="c">{{ c | cls }}</option> }</select></label>
        <label>Parent name<input type="text" name="parentName" [(ngModel)]="f.parentName" required></label>
        <label>Parent phone<input type="text" name="phone" [(ngModel)]="f.phone" required></label>
        <label>Parent email (their login)<input type="email" name="login" [(ngModel)]="f.login" required></label>
        <div><button class="btn pri" type="submit" [disabled]="classes().length === 0">Add & create invite</button></div></form>
      @if (classes().length === 0) { <div class="note" style="margin-top:10px">You have no classes yet. Ask the principal to give you periods.</div> }
      @if (error()) { <div class="err" style="margin-top:10px">{{ error() }}</div> }
      @if (link()) { <div class="note" style="margin-top:12px">Send this link to the parent. It works once. @if (emailOn()) { <b>We also emailed it.</b> } @else { Email is not set up yet, so send the link yourself. }
        <div class="cred" style="margin-top:8px;word-break:break-all">{{ link() }}</div>
        <div class="bar" style="margin:8px 0 0"><button class="btn sm" type="button" (click)="copy()">Copy link</button> <a class="btn sm" routerLink="/invites">See all my invites</a></div></div> }
    </section>
    <section class="panel"><div class="ph"><h2>Students in my classes</h2></div>
      <div class="tw"><table><thead><tr><th>Class</th><th class="n">Roll</th><th>Name</th><th>Parent</th><th>Parent phone</th></tr></thead><tbody>
        @for (s of students(); track s.id) { <tr><td>{{ s.classCode | cls }}</td><td class="n">{{ s.roll }}</td><td><b>{{ s.name }}</b></td><td>{{ s.parentName }}</td><td class="mono">{{ s.phone }}</td></tr> }
      </tbody></table></div></section>
  </div>`,
})
export class MyStudentsComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast);
  classes = signal<string[]>([]); students = signal<any[]>([]); error = signal(''); link = signal(''); emailOn = signal(false);
  f: any = { name: '', classCode: '', parentName: '', phone: '+91 ', login: '' };
  ngOnInit() {
    this.api.get<any>('/portal/teacher').subscribe(d => {
      const mine = [...new Set<string>([...(d.myClasses ?? []), ...(d.classTeacherOf ?? []).map((c: any) => c.classCode)])].sort();
      this.classes.set(mine); this.f.classCode = mine[0] ?? '';
      this.api.get<any[]>('/school/students').subscribe(all => this.students.set(all.filter(s => mine.includes(s.classCode))));
    });
  }
  add() {
    this.error.set(''); this.link.set('');
    this.api.post<any>('/invites/student', this.f).subscribe({
      next: r => { this.link.set(r.link); this.emailOn.set(!!r.emailEnabled); this.toast.show(this.f.name + ' added'); this.f = { ...this.f, name: '', parentName: '', phone: '+91 ', login: '' }; this.ngOnInit(); },
      error: e => this.error.set(errText(e)) });
  }
  copy() { copyText(this.link()).then(ok => this.toast.show(ok ? 'Link copied' : 'Select the link and copy it')); }
}
