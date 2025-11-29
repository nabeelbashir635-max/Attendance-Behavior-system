// app.js — main JS for School Management System
document.addEventListener('DOMContentLoaded', () => {
  // Element references
  const loginCard = document.getElementById('loginCard');
  const roleSelect = document.getElementById('roleSelect');
  const passwordInput = document.getElementById('passwordInput');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const app = document.getElementById('app');
  const studentName = document.getElementById('studentName');
  const studentPhoto = document.getElementById('studentPhoto');
  const addStudentBtn = document.getElementById('addStudentBtn');
  const studentFormError = document.getElementById('studentFormError');
  const studentTable = document.getElementById('studentTable');
  const attendanceStudent = document.getElementById('attendanceStudent');
  const attendanceType = document.getElementById('attendanceType');
  const addAttendanceBtn = document.getElementById('addAttendanceBtn');
  const attendanceList = document.getElementById('attendanceList');
  const behaviorStudent = document.getElementById('behaviorStudent');
  const behaviorType = document.getElementById('behaviorType');
  const behaviorNote = document.getElementById('behaviorNote');
  const addBehaviorBtn = document.getElementById('addBehaviorBtn');
  const behaviorTable = document.getElementById('behaviorTable');
  const weeklyScoresList = document.getElementById('weeklyScoresList');
  const refreshScoresBtn = document.getElementById('refreshScoresBtn');
  const detentionList = document.getElementById('detentionList');
  const generatePDFBtn = document.getElementById('generatePDFBtn');
  const exportCSVBtn = document.getElementById('exportCSVBtn');
  const resetBtn = document.getElementById('resetBtn');

  // INITIAL DATA
  let data = JSON.parse(localStorage.getItem('SCHOOL_SYSTEM') || `{
  "users":[{"role":"teacher","password":"teacher123"},{"role":"admin","password":"admin123"},{"role":"parent","password":"parent123"}],
  "students":[], "attendance":[], "behavior":[], "detentions":[]
}`);

  // simple client-side edit state
  let editingStudentIndex = -1;
  let editingBehaviorIndex = -1;

  // Utility: escape HTML for attribute values
  function escapeHtml(text){ return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  // SAVE FUNCTION
  function save(){ localStorage.setItem('SCHOOL_SYSTEM', JSON.stringify(data)); render(); }

  // LOGIN
  function login(){
    const role = roleSelect.value;
    const pass = passwordInput.value;
    const user = data.users.find(u=>u.role===role && u.password===pass);
    if(user){ loginCard.classList.add('hidden'); app.classList.remove('hidden'); loginError.innerText=''; }
    else { loginError.innerText='Wrong password'; }
  }

  loginBtn.addEventListener('click', login);

  // STUDENTS
  function addStudent(){
    const nm = studentName.value.trim();
    const file = studentPhoto.files[0];
    studentFormError.innerText = '';
    if(!nm){ studentFormError.innerText = 'Enter a student name'; return; }
    if(data.students.some(s=>s.name.toLowerCase()===nm.toLowerCase())){ studentFormError.innerText = 'A student with this name already exists'; return; }
    if(file){
      const reader = new FileReader();
      reader.onload = e => { data.students.push({name: nm, photo: e.target.result}); save(); };
      reader.readAsDataURL(file);
    } else { data.students.push({name: nm, photo: null}); save(); }
    studentName.value=''; studentPhoto.value='';
  }

  addStudentBtn.addEventListener('click', addStudent);

  function deleteStudent(i){ if(!confirm('Delete student and related records?')) return; data.students.splice(i,1); if(editingStudentIndex===i) editingStudentIndex=-1; save(); }

  function editStudent(i){ editingStudentIndex = i; editingBehaviorIndex = -1; render(); setTimeout(()=>{ const el = document.getElementById(`editStudentName_${i}`); if(el){ el.focus(); el.select(); } },50); }

  function saveStudentEdit(i){ const el = document.getElementById(`editStudentName_${i}`); if(!el) return; const trimmed = el.value.trim(); if(!trimmed){ alert('Name cannot be empty'); return; } if(data.students.some((st,idx)=>idx!==i && st.name.toLowerCase()===trimmed.toLowerCase())){ alert('Another student has this name'); return; } data.students[i].name = trimmed; editingStudentIndex = -1; save(); }

  function cancelStudentEdit(){ editingStudentIndex = -1; render(); }

  // ATTENDANCE
  function addAttendance(){ const s = attendanceStudent.value; const t = attendanceType.value; data.attendance.push({student: s, type: t, time: new Date().toLocaleString()}); save(); }
  addAttendanceBtn.addEventListener('click', addAttendance);

  // BEHAVIOR
  function addBehavior(){ const s = behaviorStudent.value; const t = behaviorType.value; const n = behaviorNote.value.trim(); if(!s){ alert('Choose a student'); return; } if(!n){ if(!confirm('No note provided. Proceed?')) return; } data.behavior.push({student: s, type: t, note: n, time: new Date().toLocaleString()}); autoDetention(s); save(); behaviorNote.value=''; }
  addBehaviorBtn.addEventListener('click', addBehavior);

  function deleteBehavior(i){ if(!confirm('Delete this behavior entry?')) return; data.behavior.splice(i,1); if(editingBehaviorIndex===i) editingBehaviorIndex=-1; save(); }

  function editBehavior(i){ editingBehaviorIndex = i; editingStudentIndex = -1; render(); setTimeout(()=>{ const t = document.getElementById(`editBehaviorType_${i}`); const n = document.getElementById(`editBehaviorNote_${i}`); if(t) t.focus(); if(n) n.select(); },50); }

  function saveBehaviorEdit(i){ const typeEl = document.getElementById(`editBehaviorType_${i}`); const noteEl = document.getElementById(`editBehaviorNote_${i}`); if(!typeEl || !noteEl) return; const newType = typeEl.value; const newNote = noteEl.value.trim(); const types = ['Praise','Warning','Minor Incident','Major Incident']; if(!types.includes(newType)){ alert('Invalid type'); return; } data.behavior[i].type = newType; data.behavior[i].note = newNote; editingBehaviorIndex = -1; save(); }

  function cancelBehaviorEdit(){ editingBehaviorIndex = -1; render(); }

  // AUTOMATIC DETENTIONS
  function autoDetention(student){ const logs = data.behavior.filter(b=>b.student===student); const warn = logs.filter(b=>b.type=="Warning").length; const minor = logs.filter(b=>b.type=="Minor Incident").length; const major = logs.filter(b=>b.type=="Major Incident").length; let reason=null; if(major>=1) reason="Major Incident"; else if(minor>=2) reason="Two Minor Incidents"; else if(warn>=3) reason="Three Warnings"; if(reason){ if(!data.detentions.some(d=>d.student===student && d.reason===reason)){ data.detentions.push({student, reason, date: new Date().toLocaleDateString()}); } } }

  // WEEKLY SCORES
  function calculateWeeklyScores(){ const scores = {}; data.students.forEach(s=>scores[s.name]=0); data.behavior.forEach(b=>{ if(b.type=="Praise") scores[b.student]+=2; if(b.type=="Warning") scores[b.student]-=1; if(b.type=="Minor Incident") scores[b.student]-=2; if(b.type=="Major Incident") scores[b.student]-=3; }); weeklyScoresList.innerHTML = Object.entries(scores).map(s=>`<li>${s[0]}: <strong>${s[1]}</strong></li>`).join(""); }
  refreshScoresBtn.addEventListener('click', calculateWeeklyScores);

  // CSV EXPORT
  function exportCSV(){ let csv="Student,Type,Note,Time\n"; data.behavior.forEach(b=>{ csv+=`${b.student},${b.type},${b.note},${b.time}\n`; }); const blob=new Blob([csv],{type:"text/csv"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="behavior_data.csv"; a.click(); }
  exportCSVBtn.addEventListener('click', exportCSV);

  // PDF DETENTIONS
  function generatePDF(){ const { jsPDF } = window.jspdf; const doc = new jsPDF(); let y = 10; data.detentions.forEach((d,i)=>{ doc.setFontSize(14); doc.text(`Detention Slip #${i+1}`, 10, y); y+=10; doc.setFontSize(12); doc.text(`Student: ${d.student}`, 10, y); y+=8; doc.text(`Reason: ${d.reason}`, 10, y); y+=8; doc.text(`Date: ${d.date}`, 10, y); y+=12; if(y>270){ doc.addPage(); y=10; } }); doc.save("detention_slips.pdf"); }
  generatePDFBtn.addEventListener('click', generatePDF);

  // RENDER UI
  function render(){
    studentTable.innerHTML=`<tr><th>Photo</th><th>Name</th><th>Actions</th></tr>`+
      data.students.map((s,i)=> editingStudentIndex === i ?
        `<tr class='editing-row'><td>${s.photo?`<img class='photo' src='${s.photo}' alt='Photo of ${s.name}'>`:"No Photo"}</td><td><input id='editStudentName_${i}' aria-label='Edit name' value='${escapeHtml(s.name)}' onkeydown="if(event.key==='Enter'){saveStudentEdit(${i})}else if(event.key==='Escape'){cancelStudentEdit()}"/></td><td><button onclick='(function(){window.saveStudentEdit(${i})})()'>Save</button> <button onclick='(function(){window.cancelStudentEdit()})()'>Cancel</button></td></tr>`:
        `<tr><td>${s.photo?`<img class='photo' src='${s.photo}' alt='Photo of ${s.name}'>`:"No Photo"}</td><td>${s.name}</td><td><button onclick='(function(){window.editStudent(${i})})()'>Edit</button> <button onclick='(function(){window.deleteStudent(${i})})()'>Delete</button></td></tr>`
      ).join("");
    attendanceStudent.innerHTML=data.students.map(s=>`<option>${s.name}</option>`).join("");
    behaviorStudent.innerHTML=data.students.map(s=>`<option>${s.name}</option>`).join("");
    behaviorTable.innerHTML=`<tr><th>Student</th><th>Type</th><th>Note</th><th>Time</th><th>Actions</th></tr>`+
      data.behavior.map((b,i)=> editingBehaviorIndex === i ?
        `<tr class='editing-row'><td>${b.student}</td><td><select id='editBehaviorType_${i}' aria-label='Edit behavior type' onkeydown="if(event.key==='Enter'){saveBehaviorEdit(${i})}else if(event.key==='Escape'){cancelBehaviorEdit()}"><option${b.type==='Praise'?' selected':''}>Praise</option><option${b.type==='Warning'?' selected':''}>Warning</option><option${b.type==='Minor Incident'?' selected':''}>Minor Incident</option><option${b.type==='Major Incident'?' selected':''}>Major Incident</option></select></td><td><input id='editBehaviorNote_${i}' aria-label='Edit note' value='${escapeHtml(b.note || '')}' onkeydown="if(event.key==='Enter'){saveBehaviorEdit(${i})}else if(event.key==='Escape'){cancelBehaviorEdit()}"/></td><td>${b.time}</td><td><button onclick='(function(){window.saveBehaviorEdit(${i})})()'>Save</button> <button onclick='(function(){window.cancelBehaviorEdit()})()'>Cancel</button></td></tr>`:
        `<tr><td>${b.student}</td><td>${b.type}</td><td>${b.note}</td><td>${b.time}</td><td><button onclick='(function(){window.editBehavior(${i})})()'>Edit</button> <button onclick='(function(){window.deleteBehavior(${i})})()'>Delete</button></td></tr>`
      ).join("");
    detentionList.innerHTML=data.detentions.map(d=>`<li>${d.date} — ${d.student}: <strong>${d.reason}</strong></li>`).join("");
  }

  // expose certain functions to global scope for inline onclick handlers
  window.editStudent = editStudent; window.deleteStudent = deleteStudent; window.saveStudentEdit = saveStudentEdit; window.cancelStudentEdit = cancelStudentEdit;
  window.editBehavior = editBehavior; window.deleteBehavior = deleteBehavior; window.saveBehaviorEdit = saveBehaviorEdit; window.cancelBehaviorEdit = cancelBehaviorEdit;
  window.addAttendance = addAttendance; window.addBehavior = addBehavior; window.exportCSV = exportCSV; window.generatePDF = generatePDF;

  // RESET DATA
  function resetAll(){ if(!confirm("Delete ALL data?")) return; data={users:data.users,students:[],attendance:[],behavior:[],detentions:[]}; save(); }
  resetBtn.addEventListener('click', resetAll);

  // Simple keyboard support (Enter to submit forms)
  studentName.addEventListener('keypress', function(e){ if(e.key==='Enter'){ addStudent(); } });
  behaviorNote.addEventListener('keypress', function(e){ if(e.key==='Enter'){ addBehavior(); } });

  // Helpful accessibility: focus management after rendering
  function focusFirstStudentIfExists(){ const s = document.getElementById('studentName'); if(s){ s.focus(); } }

  render(); focusFirstStudentIfExists();
});
