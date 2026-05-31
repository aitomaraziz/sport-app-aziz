# -*- coding: utf-8 -*-
"""
شركة عزيز التقنية للبرامج الادارية - برنامج تسيير النادي الرياضي
"""

import os
import sqlite3
import datetime
import webbrowser
import base64
import tkinter as tk
from tkinter import messagebox, filedialog, ttk

# --- DATABASE SETUP ---
DB_FILE = "gym_database.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS sports (id TEXT PRIMARY KEY, name_ar TEXT, name_en TEXT, monthly_fee REAL)")
    cursor.execute("CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, full_name TEXT, phone TEXT, email TEXT, sport_id TEXT, join_date TEXT, subscription_day INTEGER, monthly_fee REAL, photo_base64 TEXT, is_active INTEGER, trainer_id TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, member_id TEXT, sport_id TEXT, amount REAL, payment_month TEXT, payment_year TEXT, payment_date TEXT, receipt_no TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)")
    
    # Seed initial data if empty
    cursor.execute("SELECT COUNT(*) FROM sports")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("INSERT INTO sports VALUES (?, ?, ?, ?)", [("s1", "كمال الأجسام", "Bodybuilding", 250.0)])
        cursor.execute("INSERT INTO settings VALUES ('admin_passcode', '1234')")
        cursor.execute("INSERT INTO settings VALUES ('club_name_ar', 'نادي أيت عمر للياقة البدنية')")
        cursor.execute("INSERT INTO settings VALUES ('club_name_en', 'Ait Omar Fitness Gym')")
    conn.commit()
    conn.close()

init_db()

class DesktopGymApp:
    def __init__(self, root):
        self.root = root
        self.lang = "ar"
        self.load_settings()
        self.root.title(f"Gym System - {self.club_name}")
        self.root.geometry("1024x720")
        self.build_ui()

    def load_settings(self):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key='admin_passcode'")
        self.passcode = cursor.fetchone()[0]
        cursor.execute("SELECT value FROM settings WHERE key='club_name_ar'")
        self.club_name = cursor.fetchone()[0]
        conn.close()

    def generate_financial_report(self):
        """الدالة المدمجة لتوليد التقرير المالي برمجياً"""
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.receipt_no, m.full_name, s.name_ar, p.payment_month, p.payment_year, p.amount, p.payment_date 
            FROM payments p
            JOIN members m ON p.member_id = m.id
            JOIN sports s ON p.sport_id = s.id
        """)
        rows = cursor.fetchall()
        cursor.execute("SELECT SUM(amount) FROM payments")
        total = cursor.fetchone()[0] or 0.0
        conn.close()

        # إنشاء المحتوى برمجياً بالكامل
        html_content = f"""
        <html>
        <head><meta charset="UTF-8"><style>
            body {{ font-family: 'Cairo', sans-serif; direction: rtl; padding: 40px; }}
            h2 {{ color: #0d9488; text-align: center; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th, td {{ border: 1px solid #cbd5e1; padding: 12px; text-align: center; }}
            th {{ background: #0d9488; color: white; }}
        </style></head>
        <body>
            <h2>التقرير المالي السنوي والشهري للمداخيل</h2>
            <div style="padding:15px; background:#f0fdfa; text-align:right; font-weight:bold; color:#0d9488;">
                إجمالي المداخيل والمتحصلات: {total} درهم
            </div>
            <table>
                <tr><th>رقم الوصل</th><th>اسم المتدرب</th><th>الرياضة</th><th>الشهر/السنة</th><th>التاريخ</th><th>القيمة</th></tr>
                {"".join([f"<tr><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}/{r[4]}</td><td>{r[6]}</td><td>{r[5]} درهم</td></tr>" for r in rows])}
            </table>
            <script>window.print();</script>
        </body>
        </html>
        """
        file_path = "Financial_Report_Ait_Omar.html"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        webbrowser.open("file://" + os.path.abspath(file_path))

    def build_ui(self):
        # زر تجريبي لاستدعاء التقرير المدمج
        btn = tk.Button(self.root, text="استخراج التقرير المالي المدمج", command=self.generate_financial_report)
        btn.pack(pady=50)

if __name__ == "__main__":
    root = tk.Tk()
    app = DesktopGymApp(root)
    root.mainloop()
