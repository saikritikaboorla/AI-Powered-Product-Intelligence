import re
from typing import Dict, Any, Optional

def normalize_attribute_value(raw_val: Any, attr_name: str = "") -> Dict[str, Any]:
    """
    Parses a raw attribute value string/number and returns a normalized representation
    with original_value, normalized_value, and normalized_unit while preserving the original.
    """
    if raw_val is None or raw_val == "insufficient_data":
        return {
            "original_value": str(raw_val) if raw_val is not None else None,
            "normalized_value": raw_val,
            "normalized_unit": None
        }

    val_str = str(raw_val).strip()
    attr_lower = attr_name.lower()

    # 1. Temperature Normalization (°F / °C)
    temp_match = re.search(r'(-?\d+(?:\.\d+)?)\s*([°]?\s*[FCfc])\b', val_str)
    if temp_match or "temp" in attr_lower or "deg" in attr_lower:
        if temp_match:
            num = float(temp_match.group(1))
            unit = temp_match.group(2).upper().replace("°", "").strip()
            if unit == "F":
                celsius = round((num - 32) * 5 / 9, 1)
                return {
                    "original_value": val_str,
                    "normalized_value": f"{num:.1f} °F ({celsius} °C)",
                    "normalized_unit": "°F"
                }
            elif unit == "C":
                fahr = round((num * 9 / 5) + 32, 1)
                return {
                    "original_value": val_str,
                    "normalized_value": f"{num:.1f} °C ({fahr} °F)",
                    "normalized_unit": "°C"
                }

    # 2. Pressure Normalization (psi / bar)
    press_match = re.search(r'(\d+(?:\.\d+)?)\s*(psi|bar|kpa|mpa)\b', val_str, re.IGNORECASE)
    if press_match or "press" in attr_lower:
        if press_match:
            num = float(press_match.group(1))
            unit = press_match.group(2).lower()
            if unit == "psi":
                bar = round(num * 0.0689476, 2)
                return {
                    "original_value": val_str,
                    "normalized_value": f"{num:.1f} psi ({bar} bar)",
                    "normalized_unit": "psi"
                }
            elif unit == "bar":
                psi = round(num * 14.5038, 1)
                return {
                    "original_value": val_str,
                    "normalized_value": f"{num:.1f} bar ({psi} psi)",
                    "normalized_unit": "bar"
                }

    # 3. Power Normalization (HP / kW)
    power_match = re.search(r'(\d+(?:\.\d+)?)\s*(hp|kw)\b', val_str, re.IGNORECASE)
    if power_match or "power" in attr_lower or "hp" in val_str.lower():
        if power_match:
            num = float(power_match.group(1))
            unit = power_match.group(2).upper()
            if unit == "HP":
                kw = round(num * 0.7457, 2)
                return {
                    "original_value": val_str,
                    "normalized_value": f"{num} HP ({kw} kW)",
                    "normalized_unit": "HP"
                }
            elif unit == "KW":
                hp = round(num / 0.7457, 1)
                return {
                    "original_value": val_str,
                    "normalized_value": f"{num} kW ({hp} HP)",
                    "normalized_unit": "kW"
                }

    # 4. Weight / Mass Normalization (kg / g / lb)
    mass_match = re.search(r'(\d+(?:\.\d+)?)\s*(kg|g|lb|lbs)\b', val_str, re.IGNORECASE)
    if mass_match or "weight" in attr_lower or "mass" in attr_lower:
        if mass_match:
            num = float(mass_match.group(1))
            unit = mass_match.group(2).lower()
            if unit == "kg":
                lbs = round(num * 2.20462, 1)
                return {
                    "original_value": val_str,
                    "normalized_value": f"{num:.1f} kg ({lbs} lbs)",
                    "normalized_unit": "kg"
                }
            elif unit in ("lb", "lbs"):
                kg = round(num * 0.453592, 2)
                return {
                    "original_value": val_str,
                    "normalized_value": f"{num:.1f} lbs ({kg} kg)",
                    "normalized_unit": "lbs"
                }

    # 5. Dimensions / Length Normalization (in / mm / cm)
    dim_match = re.search(r'(\d+(?:\.\d+)?)\s*(in|inch|inches|mm|cm)\b', val_str, re.IGNORECASE)
    if dim_match:
        num = float(dim_match.group(1))
        unit = dim_match.group(2).lower()
        if unit in ("in", "inch", "inches"):
            mm = round(num * 25.4, 1)
            return {
                "original_value": val_str,
                "normalized_value": f'{num} in ({mm} mm)',
                "normalized_unit": "in"
            }
        elif unit == "mm":
            inches = round(num / 25.4, 2)
            return {
                "original_value": val_str,
                "normalized_value": f"{num} mm ({inches} in)",
                "normalized_unit": "mm"
            }

    # 6. Electrical Normalization (V / A / Hz / RPM)
    elec_match = re.search(r'(\d+(?:\.\d+)?)\s*(V|A|Hz|RPM|CFM|GPM|dBA)\b', val_str)
    if elec_match:
        num = float(elec_match.group(1))
        unit = elec_match.group(2)
        return {
            "original_value": val_str,
            "normalized_value": f"{num} {unit}",
            "normalized_unit": unit
        }

    # Default fallback
    return {
        "original_value": val_str,
        "normalized_value": val_str,
        "normalized_unit": None
    }
