import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe } from '../../core/format';

@Component({
  selector: 'app-classes', standalone: true, imports: [ClassPipe, FormsModule],
  template: `
  <div class="head"><div><h1>Classes</h1><p class="sub">{{ rows().length }} {{ rows().length === 1 ? 'class' : 'classes' }}. Add each class, then invite teachers and students.</p></div>
    <button class="btn acc" (click)="showForm.set(!showForm())">{{ showForm() ? 'Close form' : '+ Add class' }}</button></div>
  <div class="stack">
  @if (showForm()) {
    <section class="panel"><div class="ph"><h2>Add a class</h2></div>
      <form class="form" (ngSubmit)="add()">
        <label>Class<select name="grade" [(ngModel)]="f.grade">@for (g of grades; track g) { <option [ngValue]="g">{{ g }}</option> }</select></label>
        <label>Section<input type="text" name="section" [(ngModel)]="f.section" maxlength="2" required placeholder="A"></label>
        <label>Room<input type="text" name="room" [(ngModel)]="f.room" placeholder="Optional, e.g. Room 12"></label>
        <label>Class teacher<select name="classTeacherId" [(ngModel)]="f.classTeacherId"><option [ngValue]="null">Decide later</option>@for (t of teachers(); track t.id) { <option [ngValue]="t.id">{{ t.name }} ({{ t.subject }})</option> }</select></label>
        <div><button class="btn pri" type="submit">Add class</button></div></form>
      @if (error()) { <div class="err" style="margin-top:10px">{{ error() }}</div> }
    </section> }
  @if (rows().length === 0) {
    <section class="panel"><div class="empty">No classes yet. Click <b>+ Add class</b> to create your first one, for example Class 8, Section A.</div></section>
  } @else {
    <div class="note">Timetable: invite at least as many teachers as classes, then generate a clash-free weekly timetable. It replaces the current one.
      <div class="bar" style="margin:8px 0 0">@if (confirmGen()) { <button class="btn sm danger" (click)="generate()">Yes, replace the timetable</button> <button class="btn sm" (click)="confirmGen.set(false)">Cancel</button> } @else { <button class="btn sm" (click)="confirmGen.set(true)">Generate timetable</button> }</div></div>
  <section class="panel"><div class="tw"><table><thead><tr><th>Class</th><th>Room</th><th class="n">Strength</th><th class="n">Present</th><th class="n">Absent</th><th>Attendance</th><th></th></tr></thead><tbody>
    @for (c of rows(); track c.code) {
      <tr><td><b>{{ c.code | cls }}</b></td><td class="mono">{{ roomOf(c.code) }}</td><td class="n">{{ c.strength }}</td><td class="n">{{ c.submitted ? c.present : '–' }}</td><td class="n">{{ c.submitted ? c.absent : '–' }}</td>
        <td><span class="pill" [class.good]="c.submitted" [class.warn]="!c.submitted">{{ c.submitted ? 'Submitted' : 'Pending' }}</span></td>
        <td><button class="btn sm" (click)="go('/students', c.code)">Students</button> <button class="btn sm" (click)="go('/timetable', c.code)">Timetable</button>
          @if (c.strength === 0) { <button class="btn sm" (click)="remove(c.code)">Remove</button> }</td></tr> }
  </tbody></table></div></section> }
  </div>`,
})
export class ClassesComponent implements OnInit {
  private api = inject(Api); private router = inject(Router); private toast = inject(Toast);
  rows = signal<any[]>([]); rooms = signal<any[]>([]); teachers = signal<any[]>([]); showForm = signal(false); error = signal(''); confirmGen = signal(false);
  grades = Array.from({ length: 12 }, (_, i) => i + 1);
  f: any = { grade: 8, section: 'A', room: '', classTeacherId: null };
  roomOf = (code: string) => this.rooms().find(r => r.code === code)?.room ?? '';
  ngOnInit() { this.load(); this.api.get<any[]>('/school/teachers').subscribe(t => this.teachers.set(t)); }
  load() { this.api.get('/school/dashboard').subscribe(d => this.rows.set(d.classes)); this.api.get<any[]>('/school/classes').subscribe(c => this.rooms.set(c)); }
  add() {
    this.error.set('');
    this.api.post('/school/classes', this.f).subscribe({ next: () => { this.toast.show('Class ' + this.f.grade + this.f.section.toUpperCase() + ' added'); this.f = { ...this.f, section: '', room: '', classTeacherId: null }; this.load(); }, error: e => this.error.set(errText(e)) });
  }
  remove(code: string) { this.api.delete('/school/classes/' + code).subscribe({ next: () => { this.toast.show('Class removed'); this.load(); }, error: e => this.toast.show(errText(e)) }); }
  generate() {
    this.confirmGen.set(false);
    this.api.post<any>('/school/timetable/generate').subscribe({ next: r => this.toast.show('Timetable built for ' + r.classes + ' classes'), error: e => this.toast.show(errText(e)) });
  }
  go(path: string, code: string) { this.router.navigate([path], { queryParams: { classCode: code } }); }
}
