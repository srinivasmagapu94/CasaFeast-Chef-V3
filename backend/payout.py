"""Monthly payout statement generation (PDF via reportlab, and CSV)."""
import io
import csv
from datetime import datetime, timezone

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

BLUE = colors.HexColor("#1D4ED8")
GREEN = colors.HexColor("#15803D")
SLATE = colors.HexColor("#0F172A")


def _rows(data: dict):
    return [
        ["Metric", "Amount"],
        ["Gross Revenue", f"Rs. {data['grossRevenue']:.2f}"],
        ["Platform Commission (20%)", f"- Rs. {data['commission']:.2f}"],
        ["GST on Commission (18%)", f"- Rs. {data['gst']:.2f}"],
        ["Net Payout", f"Rs. {data['netPayout']:.2f}"],
        ["Completed Orders", str(data["completedOrders"])],
        ["Total Orders", str(data["totalOrders"])],
    ]


def generate_pdf(chef: dict, data: dict, month_label: str) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20 * mm, bottomMargin=18 * mm)
    styles = getSampleStyleSheet()
    title = ParagraphStyle("t", parent=styles["Title"], textColor=GREEN, fontSize=22)
    sub = ParagraphStyle("s", parent=styles["Normal"], textColor=SLATE, fontSize=10)
    small = ParagraphStyle("sm", parent=styles["Normal"], textColor=colors.HexColor("#64748B"), fontSize=8)

    el = []
    el.append(Paragraph("Casafeast", title))
    el.append(Paragraph("Monthly Earnings Statement", ParagraphStyle("h", parent=styles["Heading2"], textColor=BLUE)))
    el.append(Spacer(1, 6))
    el.append(Paragraph(f"Chef: <b>{chef.get('firstName','')} {chef.get('lastName','')}</b>", sub))
    el.append(Paragraph(f"Email: {chef.get('email','')} &nbsp;&nbsp; Phone: +91 {chef.get('mobileNumber','')}", sub))
    el.append(Paragraph(f"Statement Period: <b>{month_label}</b>", sub))
    el.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%d %b %Y, %H:%M UTC')}", small))
    el.append(Spacer(1, 16))

    t = Table(_rows(data), colWidths=[100 * mm, 60 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("BACKGROUND", (0, 4), (-1, 4), colors.HexColor("#F0FDF4")),
        ("TEXTCOLOR", (0, 4), (-1, 4), GREEN),
        ("FONTNAME", (0, 4), (-1, 4), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
    ]))
    el.append(t)
    el.append(Spacer(1, 24))
    el.append(Paragraph("Commission model: 20% marketplace fee on order payout value + 18% GST on the commission.", small))
    el.append(Spacer(1, 30))
    el.append(Paragraph("Created by SystemNex Techsolutions LLP. All rights reserved. TM Number: 7810892.", small))

    doc.build(el)
    buf.seek(0)
    return buf.read()


def generate_csv(chef: dict, data: dict, month_label: str) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Casafeast — Monthly Earnings Statement"])
    w.writerow(["Chef", f"{chef.get('firstName','')} {chef.get('lastName','')}"])
    w.writerow(["Email", chef.get("email", "")])
    w.writerow(["Phone", f"+91 {chef.get('mobileNumber','')}"])
    w.writerow(["Statement Period", month_label])
    w.writerow(["Generated", datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")])
    w.writerow([])
    for row in _rows(data):
        w.writerow(row)
    w.writerow([])
    w.writerow(["Commission model", "20% marketplace fee + 18% GST on commission"])
    w.writerow(["Created by SystemNex Techsolutions LLP. TM Number: 7810892"])
    return buf.getvalue()
