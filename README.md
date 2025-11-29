# Attendance-Behavior-Detention

Small, client-side demo app to record students, attendance, behavior, and detentions.

Live demo
- https://nabeelbashir635-max.github.io/Attendance-Behavior-system/

Notable features:
- Add students and optional photos
- Log attendance and behavior
- Inline edit for students and behavior entries (added)
- CSV and PDF exports

Quick Start (Local)
1. Open `index.html` in your browser or run a local static server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```

2. Login with demo credentials (this is a client-side demo):
- teacher / teacher123
- admin / admin123
- parent / parent123

Notes
- This demo stores data in browser localStorage and is not intended for production.
- For production, create a backend API and replace localStorage with server-side persistence and secure authentication.

License
- MIT License — see `LICENSE` for details.

