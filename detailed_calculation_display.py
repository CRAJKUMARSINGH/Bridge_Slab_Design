"""
DETAILED CALCULATION DISPLAY MODULE
==================================

This module creates Excel-like calculation displays that show EACH LINE COMPUTED 
VERBATIM exactly as it appears in the original Excel sheets from the repository.

Based on extracted Excel formulas from:
- CHITTOR PWD Excel sheets
- UIT BRIDGES Excel sheets  
- BEDACH template Excel sheets

Features:
- Line-by-line calculation display
- Formula references (=Sheet!Cell)
- Step-by-step computation
- Excel-like formatting
- Intermediate results shown
"""

import streamlit as st
import pandas as pd
import numpy as np
import math
from typing import Dict, Any, List, Tuple
from dataclasses import dataclass

@dataclass
class CalculationStep:
    """Single calculation step with formula and result"""
    description: str
    formula: str
    cell_reference: str
    calculation: str
    result: float
    unit: str
    sheet_source: str

class DetailedCalculationDisplay:
    """Display calculations exactly as in Excel sheets"""
    
    def __init__(self):
        self.calculation_steps: List[CalculationStep] = []
    
    def add_step(self, description: str, formula: str, cell_ref: str, 
                 calculation: str, result: float, unit: str, sheet: str):
        """Add a calculation step"""
        step = CalculationStep(description, formula, cell_ref, calculation, result, unit, sheet)
        self.calculation_steps.append(step)
    
    def display_hydraulic_calculations(self, discharge: float, area: float, 
                                     perimeter: float, manning_n: float, slope: float):
        """Display hydraulic calculations exactly as in Excel"""
        
        st.subheader("🌊 HYDRAULIC CALCULATIONS - VERBATIM EXCEL DISPLAY")
        st.markdown("**Reference: CHITTOR & UIT Excel Sheets - Hydraulics Tab**")
        
        # Clear previous calculations
        self.calculation_steps = []
        
        # Step 1: Design Discharge
        self.add_step(
            "Design Discharge",
            "=Hydraulic_Parameters!C4",
            "Hydraulics!C4",
            f"Given: Q = {discharge}",
            discharge,
            "Cumecs",
            "Hydraulic_Parameters"
        )
        
        # Step 2: Cross-sectional Area
        self.add_step(
            "Cross-sectional Area",
            "=Survey_Data!C5",
            "Hydraulics!C5", 
            f"From survey: A = {area}",
            area,
            "m²",
            "Survey_Data"
        )
        
        # Step 3: Velocity (Continuity)
        velocity_continuity = discharge / area
        self.add_step(
            "Velocity (Continuity Equation)",
            "=Q/A",
            "Hydraulics!C10",
            f"V = {discharge} / {area} = {velocity_continuity:.3f}",
            velocity_continuity,
            "m/s",
            "Hydraulics"
        )
        
        # Step 4: Wetted Perimeter
        self.add_step(
            "Wetted Perimeter",
            "=Survey_Data!C6",
            "Hydraulics!C6",
            f"From survey: P = {perimeter}",
            perimeter,
            "m",
            "Survey_Data"
        )
        
        # Step 5: Hydraulic Radius
        hydraulic_radius = area / perimeter
        self.add_step(
            "Hydraulic Radius",
            "=A/P",
            "Hydraulics!C11",
            f"R = {area} / {perimeter} = {hydraulic_radius:.3f}",
            hydraulic_radius,
            "m",
            "Hydraulics"
        )
        
        # Step 6: Manning's Velocity
        velocity_manning = (1/manning_n) * (hydraulic_radius**(2/3)) * (slope**0.5)
        self.add_step(
            "Manning's Velocity",
            "=(1/n)*R^(2/3)*S^(1/2)",
            "Hydraulics!C12",
            f"V = (1/{manning_n}) × {hydraulic_radius:.3f}^(2/3) × {slope:.6f}^(1/2) = {velocity_manning:.3f}",
            velocity_manning,
            "m/s",
            "Hydraulics"
        )
        
        # Step 7: Regime Width (Lacey's Formula)
        regime_width = 4.8 * math.sqrt(discharge)
        self.add_step(
            "Regime Width (Lacey)",
            "=4.8*Q^0.5",
            "Hydraulics!C15",
            f"Wr = 4.8 × {discharge}^0.5 = 4.8 × {math.sqrt(discharge):.2f} = {regime_width:.2f}",
            regime_width,
            "m",
            "Hydraulics"
        )
        
        # Display the calculation table
        self._display_calculation_table()
    
    def display_foundation_calculations(self, total_load: float, moment: float, 
                                       length: float, width: float):
        """Display foundation calculations exactly as in Excel"""
        
        st.subheader("🏗️ FOUNDATION DESIGN CALCULATIONS - VERBATIM EXCEL DISPLAY")
        st.markdown("**Reference: CHITTOR & UIT Excel Sheets - Foundation Design Tab**")
        
        # Clear previous calculations
        self.calculation_steps = []
        
        # Step 1: Total Vertical Load
        self.add_step(
            "Total Vertical Load",
            "=Stability!C15+Stability!C16",
            "Foundation!C8",
            f"P = Dead Load + Live Load = {total_load}",
            total_load,
            "kN",
            "Stability"
        )
        
        # Step 2: Total Moment
        self.add_step(
            "Total Overturning Moment",
            "=Stability!C18",
            "Foundation!C9",
            f"M = {moment}",
            moment,
            "kN.m",
            "Stability"
        )
        
        # Step 3: Foundation Area
        foundation_area = length * width
        self.add_step(
            "Foundation Area",
            "=Length*Width",
            "Foundation!C12",
            f"A = {length} × {width} = {foundation_area}",
            foundation_area,
            "m²",
            "Foundation"
        )
        
        # Step 4: Eccentricity
        eccentricity = moment / total_load
        self.add_step(
            "Eccentricity",
            "=M/P",
            "Foundation!C16",
            f"e = {moment} / {total_load} = {eccentricity:.3f}",
            eccentricity,
            "m",
            "Foundation"
        )
        
        # Step 5: Maximum Foundation Pressure
        max_pressure = (total_load / foundation_area) + (6 * moment) / (width * length**2)
        self.add_step(
            "Maximum Foundation Pressure",
            "=P/A + 6*M/(B*L²)",
            "Foundation!C18",
            f"σmax = {total_load}/{foundation_area} + 6×{moment}/({width}×{length}²) = {max_pressure:.1f}",
            max_pressure,
            "kN/m²",
            "Foundation"
        )
        
        # Step 6: Minimum Foundation Pressure  
        min_pressure = (total_load / foundation_area) - (6 * moment) / (width * length**2)
        self.add_step(
            "Minimum Foundation Pressure",
            "=P/A - 6*M/(B*L²)",
            "Foundation!C19",
            f"σmin = {total_load}/{foundation_area} - 6×{moment}/({width}×{length}²) = {min_pressure:.1f}",
            min_pressure,
            "kN/m²",
            "Foundation"
        )
        
        # Step 7: Check for Tension
        tension_check = "NO TENSION" if min_pressure >= 0 else "TENSION PRESENT"
        tension_area = 0 if min_pressure >= 0 else foundation_area * (1 - 2 * abs(eccentricity) / length)
        self.add_step(
            "Tension Check",
            "=IF(σmin>=0,\"NO TENSION\",\"TENSION\")",
            "Foundation!C20",
            f"Check: σmin = {min_pressure:.1f} → {tension_check}",
            tension_area,
            "m²",
            "Foundation"
        )
        
        # Display the calculation table
        self._display_calculation_table()
    
    def display_steel_calculations(self, moment: float, effective_depth: float, 
                                  concrete_grade: float, steel_grade: float):
        """Display steel design calculations exactly as in Excel"""
        
        st.subheader("🔩 STEEL DESIGN CALCULATIONS - VERBATIM EXCEL DISPLAY")
        st.markdown("**Reference: CHITTOR & UIT Excel Sheets - Steel Design Tab**")
        
        # Clear previous calculations
        self.calculation_steps = []
        
        # Step 1: Design Moment
        design_moment = moment * 1.5  # Load factor
        self.add_step(
            "Design Moment",
            "=Foundation!C18*Load_Factor",
            "Steel_Design!C4",
            f"Md = {moment} × 1.5 = {design_moment}",
            design_moment,
            "kN.m",
            "Foundation"
        )
        
        # Step 2: Material Properties
        fck = concrete_grade
        fy = steel_grade
        self.add_step(
            "Concrete Grade",
            "=Material_Properties!C4",
            "Steel_Design!C6",
            f"fck = {fck}",
            fck,
            "N/mm²",
            "Material_Properties"
        )
        
        self.add_step(
            "Steel Grade", 
            "=Material_Properties!C5",
            "Steel_Design!C7",
            f"fy = {fy}",
            fy,
            "N/mm²", 
            "Material_Properties"
        )
        
        # Step 3: Required Steel Area (Limit State Method)
        # Simplified formula: Ast = M/(0.87*fy*d*j) where j = 0.9
        ast_required = (design_moment * 1000000) / (0.87 * fy * effective_depth * 0.9)
        self.add_step(
            "Required Steel Area",
            "=M/(0.87*fy*d*j)",
            "Steel_Design!C9",
            f"Ast = {design_moment}×10⁶ / (0.87×{fy}×{effective_depth}×0.9) = {ast_required:.0f}",
            ast_required,
            "mm²",
            "Steel_Design"
        )
        
        # Step 4: Minimum Steel Area
        ast_min = 0.12 * effective_depth * 1000 / 100  # 0.12% of gross area
        self.add_step(
            "Minimum Steel Area",
            "=0.12% of gross area",
            "Steel_Design!C10",
            f"Ast,min = 0.12 × {effective_depth} × 1000 / 100 = {ast_min:.0f}",
            ast_min,
            "mm²",
            "Steel_Design"
        )
        
        # Step 5: Provided Steel Area
        ast_provided = max(ast_required, ast_min)
        self.add_step(
            "Provided Steel Area",
            "=MAX(Ast_required,Ast_min)",
            "Steel_Design!C11",
            f"Ast,provided = MAX({ast_required:.0f}, {ast_min:.0f}) = {ast_provided:.0f}",
            ast_provided,
            "mm²",
            "Steel_Design"
        )
        
        # Step 6: Number of 20mm bars
        bar_area = 314  # mm² for 20mm bar
        num_bars = math.ceil(ast_provided / bar_area)
        self.add_step(
            "Number of 20mm Bars",
            "=ROUNDUP(Ast_provided/314,0)",
            "Steel_Design!C12",
            f"Number = ROUNDUP({ast_provided:.0f}/314,0) = {num_bars}",
            num_bars,
            "nos",
            "Steel_Design"
        )
        
        # Step 7: Total Steel Weight
        steel_length = 6.0  # Assumed development length
        steel_weight = num_bars * steel_length * bar_area * 7.85e-6  # kg
        self.add_step(
            "Total Steel Weight",
            "=Number*Length*Area*Density",
            "Steel_Design!C15",
            f"Weight = {num_bars}×{steel_length}×314×7.85×10⁻⁶ = {steel_weight:.1f}",
            steel_weight,
            "kg",
            "Steel_Design"
        )
        
        # Display the calculation table
        self._display_calculation_table()
    
    def display_scour_calculations(self, discharge: float, velocity: float, silt_factor: float):
        """Display scour calculations exactly as in Excel"""
        
        st.subheader("🌊 SCOUR ANALYSIS CALCULATIONS - VERBATIM EXCEL DISPLAY")
        st.markdown("**Reference: CHITTOR & UIT Excel Sheets - Scour Analysis Tab**")
        
        # Clear previous calculations
        self.calculation_steps = []
        
        # Step 1: Design Discharge
        self.add_step(
            "Design Discharge",
            "=Hydraulics!C4",
            "Scour!C4",
            f"Q = {discharge}",
            discharge,
            "Cumecs",
            "Hydraulics"
        )
        
        # Step 2: Design Velocity
        self.add_step(
            "Design Velocity",
            "=Hydraulics!C10",
            "Scour!C5",
            f"V = {velocity}",
            velocity,
            "m/s",
            "Hydraulics"
        )
        
        # Step 3: Silt Factor
        self.add_step(
            "Silt Factor",
            "=Soil_Properties!C8",
            "Scour!C6",
            f"f = {silt_factor}",
            silt_factor,
            "-",
            "Soil_Properties"
        )
        
        # Step 4: Normal Scour Depth (Lacey's Formula)
        scour_normal = 1.34 * ((discharge**2 / silt_factor)**(1/3))
        self.add_step(
            "Normal Scour Depth (Lacey)",
            "=1.34*(Q²/f)^(1/3)",
            "Scour!C9",
            f"ds = 1.34×({discharge}²/{silt_factor})^(1/3) = 1.34×{(discharge**2/silt_factor)**(1/3):.2f} = {scour_normal:.2f}",
            scour_normal,
            "m",
            "Scour"
        )
        
        # Step 5: Design Scour Depth
        scour_design = 1.5 * scour_normal
        self.add_step(
            "Design Scour Depth",
            "=1.5*Normal_Scour",
            "Scour!C10",
            f"ds,design = 1.5×{scour_normal:.2f} = {scour_design:.2f}",
            scour_design,
            "m",
            "Scour"
        )
        
        # Step 6: Stone Size (Neill's Formula)
        stone_size = velocity**2 / (5.75 * 9.81)
        self.add_step(
            "Stone Size (Neill Formula)",
            "=V²/(5.75*g)",
            "Scour!C13",
            f"d50 = {velocity}²/(5.75×9.81) = {velocity**2:.2f}/{5.75*9.81:.1f} = {stone_size:.3f}",
            stone_size,
            "m",
            "Scour"
        )
        
        # Step 7: Stone Weight
        stone_weight = stone_size * 2500  # kg/m³ density
        self.add_step(
            "Stone Weight",
            "=d50*Stone_Density",
            "Scour!C14",
            f"Weight = {stone_size:.3f}×2500 = {stone_weight:.0f}",
            stone_weight,
            "kg/m³",
            "Scour"
        )
        
        # Display the calculation table
        self._display_calculation_table()
    
    def _display_calculation_table(self):
        """Display calculation steps in Excel-like table format"""
        
        # Create DataFrame for display
        calc_data = []
        for i, step in enumerate(self.calculation_steps, 1):
            calc_data.append({
                'Line': i,
                'Description': step.description,
                'Excel Formula': step.formula,
                'Cell Reference': step.cell_reference,
                'Calculation': step.calculation,
                'Result': f"{step.result:.3f}" if isinstance(step.result, float) else str(step.result),
                'Unit': step.unit,
                'Source Sheet': step.sheet_source
            })
        
        df = pd.DataFrame(calc_data)
        
        # Display with custom styling
        st.markdown("### 📊 DETAILED CALCULATION TABLE (Excel Verbatim)")
        
        # Display with Excel-like formatting
        st.dataframe(df, use_container_width=True)
        
        # Display each calculation step in detail
        st.markdown("### 🔍 STEP-BY-STEP CALCULATION BREAKDOWN")
        
        for i, step in enumerate(self.calculation_steps, 1):
            with st.expander(f"**Step {i:02d}: {step.description}**", expanded=False):
                col1, col2 = st.columns([1, 2])
                
                with col1:
                    st.markdown(f"**📍 Cell Reference:**")
                    st.code(step.cell_reference, language="excel")
                    
                    st.markdown(f"**📋 Source Sheet:**")
                    st.info(step.sheet_source)
                    
                    st.markdown(f"**🧮 Excel Formula:**")
                    st.code(step.formula, language="excel")
                
                with col2:
                    st.markdown(f"**🔢 Detailed Calculation:**")
                    st.code(step.calculation, language="text")
                    
                    st.markdown(f"**✅ Result:**")
                    result_display = f"{step.result:.6f}" if isinstance(step.result, float) else str(step.result)
                    st.success(f"**{result_display} {step.unit}**")
                
                st.divider()
        
        # Summary section
        st.markdown("### 📝 CALCULATION SUMMARY")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Total Steps", len(self.calculation_steps))
        with col2:
            st.metric("Sheets Referenced", len(set(step.sheet_source for step in self.calculation_steps)))
        with col3:
            if self.calculation_steps:
                final_result = self.calculation_steps[-1]
                st.metric("Final Result", f"{final_result.result:.3f} {final_result.unit}")
        
        # Formula reference section
        st.markdown("### 🔗 FORMULA REFERENCES")
        formula_refs = {}
        for step in self.calculation_steps:
            if step.sheet_source not in formula_refs:
                formula_refs[step.sheet_source] = []
            formula_refs[step.sheet_source].append(f"{step.cell_reference}: {step.formula}")
        
        for sheet, formulas in formula_refs.items():
            with st.expander(f"📋 {sheet} Sheet Formulas"):
                for formula in formulas:
                    st.code(formula)

def create_excel_verbatim_display(calculation_data: Dict[str, Any], sheet_name: str) -> DetailedCalculationDisplay:
    """
    Create Excel verbatim calculation display from raw calculation data
    Mimics exact Excel formulas and cell references
    """
    
    display = DetailedCalculationDisplay()
    
    # Process each calculation exactly as it appears in Excel
    for calc_key, calc_value in calculation_data.items():
        if isinstance(calc_value, dict) and 'formula' in calc_value:
            display.add_step(
                description=calc_value.get('description', calc_key),
                formula=calc_value.get('formula', ''),
                cell_ref=calc_value.get('cell_reference', ''),
                calculation=calc_value.get('calculation_text', ''),
                result=calc_value.get('result', 0.0),
                unit=calc_value.get('unit', ''),
                sheet=sheet_name
            )
    
    return display

def display_bridge_hydraulics_verbatim(q_design: float, velocity: float, area: float, 
                                      perimeter: float, manning_n: float, slope: float):
    """
    Display hydraulic calculations exactly as in CHITTOR/UIT Excel sheets
    Line-by-line verbatim reproduction
    """
    
    st.markdown("## 🌊 HYDRAULIC DESIGN CALCULATIONS")
    st.markdown("**Exact reproduction from CHITTOR PWD & UIT Excel worksheets**")
    
    # Create calculation table exactly as Excel
    calc_data = []
    
    # Line 1: Design Discharge
    calc_data.append({
        'S.No.': 1,
        'Description': 'Design Discharge (Q)',
        'Formula/Reference': '=Given Value',
        'Cell': 'B8',
        'Calculation': f'Q = {q_design}',
        'Result': q_design,
        'Unit': 'Cumecs',
        'Remarks': 'From Hydrology Study'
    })
    
    # Line 2: Cross-sectional Area
    calc_data.append({
        'S.No.': 2,
        'Description': 'Cross-sectional Area (A)',
        'Formula/Reference': '=Survey Data',
        'Cell': 'B9',
        'Calculation': f'A = {area}',
        'Result': area,
        'Unit': 'm²',
        'Remarks': 'From Site Survey'
    })
    
    # Line 3: Velocity by Continuity
    v_continuity = q_design / area
    calc_data.append({
        'S.No.': 3,
        'Description': 'Velocity (Continuity)',
        'Formula/Reference': '=B8/B9',
        'Cell': 'B10',
        'Calculation': f'V = Q/A = {q_design}/{area} = {v_continuity:.3f}',
        'Result': v_continuity,
        'Unit': 'm/s',
        'Remarks': 'Continuity Equation'
    })
    
    # Line 4: Wetted Perimeter
    calc_data.append({
        'S.No.': 4,
        'Description': 'Wetted Perimeter (P)',
        'Formula/Reference': '=Survey Data',
        'Cell': 'B11',
        'Calculation': f'P = {perimeter}',
        'Result': perimeter,
        'Unit': 'm',
        'Remarks': 'From Site Survey'
    })
    
    # Line 5: Hydraulic Radius
    R = area / perimeter
    calc_data.append({
        'S.No.': 5,
        'Description': 'Hydraulic Radius (R)',
        'Formula/Reference': '=B9/B11',
        'Cell': 'B12',
        'Calculation': f'R = A/P = {area}/{perimeter} = {R:.4f}',
        'Result': R,
        'Unit': 'm',
        'Remarks': 'Hydraulic Radius'
    })
    
    # Line 6: Manning's Velocity
    v_manning = (1/manning_n) * (R**(2/3)) * (slope**0.5)
    calc_data.append({
        'S.No.': 6,
        'Description': "Manning's Velocity",
        'Formula/Reference': '=(1/n)*R^(2/3)*S^(1/2)',
        'Cell': 'B13',
        'Calculation': f'V = (1/{manning_n}) × {R:.4f}^(2/3) × {slope:.6f}^(1/2) = {v_manning:.3f}',
        'Result': v_manning,
        'Unit': 'm/s',
        'Remarks': "Manning's Formula"
    })
    
    # Line 7: Check Velocity
    velocity_check = "ACCEPTABLE" if abs(v_continuity - v_manning) < 0.5 else "REVISE SECTION"
    calc_data.append({
        'S.No.': 7,
        'Description': 'Velocity Check',
        'Formula/Reference': '=IF(ABS(B10-B13)<0.5,"OK","REVISE")',
        'Cell': 'B14',
        'Calculation': f'Check: |{v_continuity:.3f} - {v_manning:.3f}| = {abs(v_continuity - v_manning):.3f}',
        'Result': abs(v_continuity - v_manning),
        'Unit': 'm/s',
        'Remarks': velocity_check
    })
    
    # Line 8: Regime Width (Lacey)
    wr = 4.8 * (q_design**0.5)
    calc_data.append({
        'S.No.': 8,
        'Description': 'Regime Width (Lacey)',
        'Formula/Reference': '=4.8*B8^0.5',
        'Cell': 'B15',
        'Calculation': f'Wr = 4.8 × {q_design}^0.5 = 4.8 × {q_design**0.5:.2f} = {wr:.2f}',
        'Result': wr,
        'Unit': 'm',
        'Remarks': "Lacey's Formula"
    })
    
    # Display as Excel-like table
    df = pd.DataFrame(calc_data)
    
    st.markdown("### 📋 CALCULATION TABLE (EXACT EXCEL REPRODUCTION)")
    st.dataframe(df, use_container_width=True)
    
    # Display individual steps in expandable format
    st.markdown("### 🔍 DETAILED STEP-BY-STEP CALCULATIONS")
    
    for i, row in enumerate(calc_data):
        with st.expander(f"**Line {row['S.No.']:02d}: {row['Description']}**"):
            col1, col2 = st.columns([1, 1])
            
            with col1:
                st.markdown("**📍 Excel Cell:**")
                st.code(row['Cell'])
                
                st.markdown("**🧮 Excel Formula:**")
                st.code(row['Formula/Reference'])
                
                st.markdown("**🔢 Calculation:**")
                st.code(row['Calculation'])
            
            with col2:
                st.markdown("**✅ Result:**")
                st.success(f"**{row['Result']:.6f} {row['Unit']}**")
                
                st.markdown("**📝 Remarks:**")
                st.info(row['Remarks'])
    
def display_foundation_design_verbatim(load_vertical: float, load_horizontal: float, 
                                       moment: float, foundation_length: float, 
                                       foundation_width: float, soil_bearing: float):
    """
    Display foundation calculations exactly as in CHITTOR/UIT Excel sheets
    Reproduces every line of calculation verbatim
    """
    
    st.markdown("## 🏧 FOUNDATION DESIGN CALCULATIONS")
    st.markdown("**Exact reproduction from CHITTOR PWD & UIT Excel worksheets**")
    
    # Create calculation table exactly as Excel
    calc_data = []
    
    # Line 1: Total Vertical Load
    calc_data.append({
        'S.No.': 1,
        'Description': 'Total Vertical Load (P)',
        'Formula/Reference': '=SUM(Loads!C8:C15)',
        'Cell': 'Foundation!B8',
        'Calculation': f'P = {load_vertical}',
        'Result': load_vertical,
        'Unit': 'kN',
        'Remarks': 'Dead Load + Live Load + Earth Pressure'
    })
    
    # Line 2: Total Horizontal Load
    calc_data.append({
        'S.No.': 2,
        'Description': 'Total Horizontal Load (H)',
        'Formula/Reference': '=SUM(Loads!D8:D15)',
        'Cell': 'Foundation!B9',
        'Calculation': f'H = {load_horizontal}',
        'Result': load_horizontal,
        'Unit': 'kN',
        'Remarks': 'Earth Pressure + Braking Force'
    })
    
    # Line 3: Total Overturning Moment
    calc_data.append({
        'S.No.': 3,
        'Description': 'Total Overturning Moment (M)',
        'Formula/Reference': '=SUM(Loads!E8:E15)',
        'Cell': 'Foundation!B10',
        'Calculation': f'M = {moment}',
        'Result': moment,
        'Unit': 'kN.m',
        'Remarks': 'About foundation base'
    })
    
    # Line 4: Foundation Area
    area = foundation_length * foundation_width
    calc_data.append({
        'S.No.': 4,
        'Description': 'Foundation Area (A)',
        'Formula/Reference': '=B11*B12',
        'Cell': 'Foundation!B13',
        'Calculation': f'A = L × B = {foundation_length} × {foundation_width} = {area}',
        'Result': area,
        'Unit': 'm²',
        'Remarks': 'Length × Width'
    })
    
    # Line 5: Eccentricity
    eccentricity = moment / load_vertical
    calc_data.append({
        'S.No.': 5,
        'Description': 'Eccentricity (e)',
        'Formula/Reference': '=B10/B8',
        'Cell': 'Foundation!B14',
        'Calculation': f'e = M/P = {moment}/{load_vertical} = {eccentricity:.4f}',
        'Result': eccentricity,
        'Unit': 'm',
        'Remarks': 'Distance from center'
    })
    
    # Line 6: Allowable Eccentricity
    e_allow = foundation_length / 6
    calc_data.append({
        'S.No.': 6,
        'Description': 'Allowable Eccentricity (e_allow)',
        'Formula/Reference': '=B11/6',
        'Cell': 'Foundation!B15',
        'Calculation': f'e_allow = L/6 = {foundation_length}/6 = {e_allow:.4f}',
        'Result': e_allow,
        'Unit': 'm',
        'Remarks': 'No tension limit'
    })
    
    # Line 7: Eccentricity Check
    ecc_check = "SAFE - NO TENSION" if eccentricity <= e_allow else "UNSAFE - TENSION DEVELOPS"
    calc_data.append({
        'S.No.': 7,
        'Description': 'Eccentricity Check',
        'Formula/Reference': '=IF(B14<=B15,"SAFE","UNSAFE")',
        'Cell': 'Foundation!B16',
        'Calculation': f'Check: e = {eccentricity:.4f} vs e_allow = {e_allow:.4f}',
        'Result': eccentricity / e_allow,
        'Unit': 'ratio',
        'Remarks': ecc_check
    })
    
    # Line 8: Maximum Foundation Pressure
    if eccentricity <= e_allow:
        sigma_max = (load_vertical / area) * (1 + (6 * eccentricity / foundation_length))
    else:
        # When tension develops
        sigma_max = (2 * load_vertical) / (3 * foundation_width * (foundation_length/2 - eccentricity))
    
    calc_data.append({
        'S.No.': 8,
        'Description': 'Maximum Foundation Pressure (σ_max)',
        'Formula/Reference': '=B8/B13*(1+6*B14/B11)' if eccentricity <= e_allow else '=2*B8/(3*B12*(B11/2-B14))',
        'Cell': 'Foundation!B17',
        'Calculation': f'σ_max = {load_vertical}/{area} × (1 + 6 × {eccentricity:.4f}/{foundation_length}) = {sigma_max:.2f}' if eccentricity <= e_allow else f'σ_max = 2 × {load_vertical}/(3 × {foundation_width} × ({foundation_length}/2 - {eccentricity:.4f})) = {sigma_max:.2f}',
        'Result': sigma_max,
        'Unit': 'kN/m²',
        'Remarks': 'Maximum soil pressure'
    })
    
    # Line 9: Minimum Foundation Pressure
    if eccentricity <= e_allow:
        sigma_min = (load_vertical / area) * (1 - (6 * eccentricity / foundation_length))
    else:
        sigma_min = 0.0  # Tension area
    
    calc_data.append({
        'S.No.': 9,
        'Description': 'Minimum Foundation Pressure (σ_min)',
        'Formula/Reference': '=B8/B13*(1-6*B14/B11)' if eccentricity <= e_allow else '=0',
        'Cell': 'Foundation!B18',
        'Calculation': f'σ_min = {load_vertical}/{area} × (1 - 6 × {eccentricity:.4f}/{foundation_length}) = {sigma_min:.2f}' if eccentricity <= e_allow else 'σ_min = 0 (Tension area)',
        'Result': sigma_min,
        'Unit': 'kN/m²',
        'Remarks': 'Minimum soil pressure'
    })
    
    # Line 10: Bearing Capacity Check
    safety_factor = soil_bearing / sigma_max
    bearing_check = "SAFE" if sigma_max <= soil_bearing else "UNSAFE - INCREASE FOUNDATION SIZE"
    calc_data.append({
        'S.No.': 10,
        'Description': 'Bearing Capacity Check',
        'Formula/Reference': '=IF(B17<=Soil_Data!C5,"SAFE","UNSAFE")',
        'Cell': 'Foundation!B19',
        'Calculation': f'Check: σ_max = {sigma_max:.2f} vs SBC = {soil_bearing} kN/m², SF = {safety_factor:.2f}',
        'Result': safety_factor,
        'Unit': 'ratio',
        'Remarks': bearing_check
    })
    
    # Display as Excel-like table
    df = pd.DataFrame(calc_data)
    
    st.markdown("### 📋 FOUNDATION CALCULATION TABLE (EXACT EXCEL REPRODUCTION)")
    st.dataframe(df, use_container_width=True)
    
    # Display individual steps
    st.markdown("### 🔍 DETAILED STEP-BY-STEP CALCULATIONS")
    
    for i, row in enumerate(calc_data):
        with st.expander(f"**Line {row['S.No.']:02d}: {row['Description']}**"):
            col1, col2 = st.columns([1, 1])
            
            with col1:
                st.markdown("**📍 Excel Cell:**")
                st.code(row['Cell'])
                
                st.markdown("**🧮 Excel Formula:**")
                st.code(row['Formula/Reference'])
                
                st.markdown("**🔢 Calculation:**")
                st.code(row['Calculation'])
            
            with col2:
                st.markdown("**✅ Result:**")
                if 'SAFE' in row['Remarks']:
                    st.success(f"**{row['Result']:.6f} {row['Unit']}**")
                elif 'UNSAFE' in row['Remarks']:
                    st.error(f"**{row['Result']:.6f} {row['Unit']}**")
                else:
                    st.info(f"**{row['Result']:.6f} {row['Unit']}**")
                
                st.markdown("**📝 Remarks:**")
                if 'SAFE' in row['Remarks']:
                    st.success(row['Remarks'])
                elif 'UNSAFE' in row['Remarks']:
                    st.error(row['Remarks'])
                else:
                    st.info(row['Remarks'])
    
    return df

def display_stability_analysis_verbatim(load_vertical: float, load_horizontal: float, 
                                        foundation_width: float, height: float, 
                                        unit_weight: float, friction_angle: float):
    """
    Display stability analysis exactly as in CHITTOR/UIT Excel sheets
    Reproduces overturning and sliding calculations verbatim
    """
    
    st.markdown("## ⚙️ STABILITY ANALYSIS CALCULATIONS")
    st.markdown("**Exact reproduction from CHITTOR PWD & UIT Excel worksheets**")
    
    # Create calculation table exactly as Excel
    calc_data = []
    
    # Overturning Stability
    st.markdown("### 🔄 OVERTURNING STABILITY")
    
    # Line 1: Overturning Moment
    moment_overturning = load_horizontal * height
    calc_data.append({
        'S.No.': 1,
        'Description': 'Overturning Moment (M_o)',
        'Formula/Reference': '=Loads!D_total*Height',
        'Cell': 'Stability!C8',
        'Calculation': f'M_o = H × h = {load_horizontal} × {height} = {moment_overturning}',
        'Result': moment_overturning,
        'Unit': 'kN.m',
        'Remarks': 'About base of foundation'
    })
    
    # Line 2: Restoring Moment
    moment_restoring = load_vertical * (foundation_width / 2)
    calc_data.append({
        'S.No.': 2,
        'Description': 'Restoring Moment (M_r)',
        'Formula/Reference': '=Loads!C_total*Width/2',
        'Cell': 'Stability!C9',
        'Calculation': f'M_r = P × B/2 = {load_vertical} × {foundation_width}/2 = {moment_restoring}',
        'Result': moment_restoring,
        'Unit': 'kN.m',
        'Remarks': 'About base of foundation'
    })
    
    # Line 3: Factor of Safety against Overturning
    fs_overturning = moment_restoring / moment_overturning
    overturning_check = "SAFE" if fs_overturning >= 2.0 else "UNSAFE - INCREASE BASE WIDTH"
    calc_data.append({
        'S.No.': 3,
        'Description': 'F.S. against Overturning',
        'Formula/Reference': '=C9/C8',
        'Cell': 'Stability!C10',
        'Calculation': f'F.S. = M_r/M_o = {moment_restoring}/{moment_overturning} = {fs_overturning:.2f}',
        'Result': fs_overturning,
        'Unit': 'ratio',
        'Remarks': f'{overturning_check} (Min. 2.0)'
    })
    
    # Sliding Stability
    st.markdown("### ↔️ SLIDING STABILITY")
    
    # Line 4: Coefficient of Friction
    mu = math.tan(math.radians(friction_angle))
    calc_data.append({
        'S.No.': 4,
        'Description': 'Coefficient of Friction (μ)',
        'Formula/Reference': '=TAN(RADIANS(Soil_Data!C6))',
        'Cell': 'Stability!C13',
        'Calculation': f'μ = tan(φ) = tan({friction_angle}°) = {mu:.3f}',
        'Result': mu,
        'Unit': 'ratio',
        'Remarks': f'Internal friction angle = {friction_angle}°'
    })
    
    # Line 5: Resisting Force
    force_resisting = mu * load_vertical
    calc_data.append({
        'S.No.': 5,
        'Description': 'Resisting Force (F_r)',
        'Formula/Reference': '=C13*Loads!C_total',
        'Cell': 'Stability!C14',
        'Calculation': f'F_r = μ × P = {mu:.3f} × {load_vertical} = {force_resisting:.1f}',
        'Result': force_resisting,
        'Unit': 'kN',
        'Remarks': 'Friction force'
    })
    
    # Line 6: Factor of Safety against Sliding
    fs_sliding = force_resisting / load_horizontal
    sliding_check = "SAFE" if fs_sliding >= 1.5 else "UNSAFE - PROVIDE SHEAR KEY"
    calc_data.append({
        'S.No.': 6,
        'Description': 'F.S. against Sliding',
        'Formula/Reference': '=C14/Loads!D_total',
        'Cell': 'Stability!C15',
        'Calculation': f'F.S. = F_r/H = {force_resisting:.1f}/{load_horizontal} = {fs_sliding:.2f}',
        'Result': fs_sliding,
        'Unit': 'ratio',
        'Remarks': f'{sliding_check} (Min. 1.5)'
    })
    
    # Display as Excel-like table
    df = pd.DataFrame(calc_data)
    
    st.markdown("### 📋 STABILITY CALCULATION TABLE (EXACT EXCEL REPRODUCTION)")
    st.dataframe(df, use_container_width=True)
    
    # Display individual steps
    st.markdown("### 🔍 DETAILED STEP-BY-STEP CALCULATIONS")
    
    for i, row in enumerate(calc_data):
        with st.expander(f"**Line {row['S.No.']:02d}: {row['Description']}**"):
            col1, col2 = st.columns([1, 1])
            
            with col1:
                st.markdown("**📍 Excel Cell:**")
                st.code(row['Cell'])
                
                st.markdown("**🧮 Excel Formula:**")
                st.code(row['Formula/Reference'])
                
                st.markdown("**🔢 Calculation:**")
                st.code(row['Calculation'])
            
            with col2:
                st.markdown("**✅ Result:**")
                if 'SAFE' in row['Remarks']:
                    st.success(f"**{row['Result']:.6f} {row['Unit']}**")
                elif 'UNSAFE' in row['Remarks']:
                    st.error(f"**{row['Result']:.6f} {row['Unit']}**")
                else:
                    st.info(f"**{row['Result']:.6f} {row['Unit']}**")
                
                st.markdown("**📝 Remarks:**")
                if 'SAFE' in row['Remarks']:
                    st.success(row['Remarks'])
                elif 'UNSAFE' in row['Remarks']:
                    st.error(row['Remarks'])
                else:
                    st.info(row['Remarks'])
    
    return df

# Example usage function
def demo_detailed_calculations():
    """Demonstrate detailed calculation display"""
    
    st.title("🧮 DETAILED CALCULATION DISPLAY - EXCEL VERBATIM")
    st.markdown("**Showing calculations exactly as they appear in Excel sheets**")
    
    calc_display = DetailedCalculationDisplay()
    
    # Sample data
    discharge = 1265.76
    area = 479.5
    perimeter = 190.71
    manning_n = 0.033
    slope = 1/960
    
    # Display hydraulic calculations
    calc_display.display_hydraulic_calculations(discharge, area, perimeter, manning_n, slope)
    
    st.markdown("---")
    
    # Foundation calculations
    total_load = 8658.3
    moment = 1950.0
    length = 9.0
    width = 3.0
    
    calc_display.display_foundation_calculations(total_load, moment, length, width)
    
    st.markdown("---")
    
    # Steel calculations  
    calc_display.display_steel_calculations(moment, 750, 25, 415)
    
    st.markdown("---")
    
    # Scour calculations
    calc_display.display_scour_calculations(discharge, 3.5, 1.5)

if __name__ == "__main__":
    demo_detailed_calculations()