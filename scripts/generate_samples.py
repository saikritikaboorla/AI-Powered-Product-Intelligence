import os
from fpdf import FPDF

def create_sample_pdf(filepath: str, title: str, sku: str, specs: dict, description: str, notice: str = "SYNTHETIC DEMO DATA - FOR HACKATHON DEMO ONLY"):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    pdf = FPDF()
    pdf.add_page()
    
    # Header
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(15, 23, 32)
    pdf.cell(0, 10, title, ln=True)
    
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(62, 124, 177)
    pdf.cell(0, 8, f"SKU / Model Number: {sku}", ln=True)
    pdf.ln(4)
    
    # Description
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(50, 50, 50)
    pdf.multi_cell(0, 6, description)
    pdf.ln(6)
    
    # Spec Table Header
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_fill_color(240, 244, 248)
    pdf.set_text_color(15, 23, 32)
    pdf.cell(90, 8, "Specification Parameter", 1, 0, "L", True)
    pdf.cell(90, 8, "Value", 1, 1, "L", True)
    
    # Spec Table Rows
    pdf.set_font("Helvetica", "", 10)
    for key, val in specs.items():
        pdf.cell(90, 7, str(key), 1, 0, "L")
        pdf.cell(90, 7, str(val), 1, 1, "L")
        
    pdf.ln(10)
    
    # Footer Notice
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(180, 50, 50)
    pdf.multi_cell(0, 5, notice)
    
    pdf.output(filepath)

def generate_all_samples():
    base_dir = os.path.abspath("data/samples")
    os.makedirs(base_dir, exist_ok=True)
    
    samples = [
        {
            "filename": "aeroflow_af220_pump.pdf",
            "title": "AeroFlow Heavy-Duty Centrifugal Pump",
            "sku": "AF-220-XP",
            "description": "High-efficiency industrial centrifugal pump designed for liquid transfer in municipal and manufacturing water systems.",
            "specs": {
                "Flow Rate": "150 GPM",
                "Body Material": "Cast Iron",
                "Power Rating": "7.5 HP",
                "Port Diameter": "2.5 in NPT",
                "Operating Voltage": "460 V"
            }
        },
        {
            "filename": "grade8_screw.pdf",
            "title": "Grade 8 Heavy Hex Cap Screw",
            "sku": "SCR-G8-3816",
            "description": "High tensile strength alloy steel fastener engineered for heavy structural assembly and high vibration environments.",
            "specs": {
                "Thread Size": "3/8-16 UNC",
                "Material": "Medium Carbon Alloy Steel",
                "Tensile Strength": "150000 psi",
                "Length": "2.0 in",
                "Finish": "Yellow Zinc Plated"
            }
        },
        {
            "filename": "baldor_motor.pdf",
            "title": "Baldor-Reliance Industrial Electric Motor",
            "sku": "VM3613T",
            "description": "General purpose three-phase industrial motor designed for continuous duty drive applications.",
            "specs": {
                "Power Rating": "5 HP",
                "Voltage": "230 V / 460 V",
                "Full Load Current": "14.0 A",
                "Speed": "1750 RPM",
                "Frame Size": "184T"
            }
        },
        {
            "filename": "parker_valve.pdf",
            "title": "Parker Series 50 Safety Relief Valve",
            "sku": "PRV-50-SS",
            "description": "Precision spring-loaded safety pressure relief valve for industrial gas and liquid process lines.",
            "specs": {
                "Set Pressure": "150 psi",
                "Flow Rate": "45 GPM",
                "Material": "316 Stainless Steel",
                "Max Operating Temp": "400 °F",
                "Connection": "1 in NPT Female"
            }
        },
        {
            "filename": "milacron_fan.pdf",
            "title": "Cincinnati Milacron Industrial Blower Fan",
            "sku": "CF-400-IND",
            "description": "High-output direct-drive radial blade exhaust fan for industrial ventilation and dust extraction.",
            "specs": {
                "Airflow Capacity": "4500 CFM",
                "Motor Power": "10 HP",
                "Noise Level": "78 dBA",
                "Impeller Diameter": "24 in",
                "Material": "Heavy Gauge Carbon Steel"
            }
        },
        {
            "filename": "teflon_ball_valve_sparse.pdf",
            "title": "Teflon-Lined Compact Ball Valve",
            "sku": "TBV-200-SPARSE",
            "description": "Compact general utility ball valve with PTFE lining. Datasheet provided with limited preliminary technical attributes.",
            "specs": {
                "Nominal Size": "2.0 in NPT",
                "Handle Type": "Lever Handle"
                # Intentionally missing material grade, temp ratings, pressure limits
            }
        }
    ]
    
    for s in samples:
        path = os.path.join(base_dir, s["filename"])
        create_sample_pdf(path, s["title"], s["sku"], s["specs"], s["description"])
        print(f"Generated sample: {path}")

if __name__ == "__main__":
    generate_all_samples()
