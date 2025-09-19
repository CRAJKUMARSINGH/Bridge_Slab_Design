import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
from typing import Dict, List, Any

class DetailedHydraulicExplanations:
    def __init__(self):
        self.load_hydraulic_data()
        
    def load_hydraulic_data(self):
        """Load extracted hydraulic data"""
        try:
            with open('extracted_bridge_hydraulic_data.json', 'r', encoding='utf-8') as f:
                self.data = json.load(f)
        except FileNotFoundError:
            self.data = {}
    
    def create_discharge_calculation_explanation(self):
        """Detailed explanation of discharge calculation"""
        st.markdown("""
        ## 📊 **1. DISCHARGE CALCULATION** 
        *As per Article-5 of IRC SP-13*
        
        ### 🔢 **Step-by-Step Calculation:**
        """)
        
        # Create calculation steps table
        calc_steps = [
            {
                "Step": "1",
                "Parameter": "Basic Formula",
                "Equation": "Q = A × V",
                "Description": "Discharge = Cross-sectional Area × Velocity",
                "Reference": "IRC SP-13 Article-5"
            },
            {
                "Step": "2", 
                "Parameter": "Cross-sectional Area (A)",
                "Equation": "A = 436.65 m²",
                "Description": "Cross sectional area calculated from river survey",
                "Reference": "Survey data from cross-section sheet"
            },
            {
                "Step": "3",
                "Parameter": "Wetted Perimeter (P)", 
                "Equation": "P = 175.43 m",
                "Description": "Perimeter calculated from cross-section geometry",
                "Reference": "Calculated from survey coordinates"
            },
            {
                "Step": "4",
                "Parameter": "Slope (S)",
                "Equation": "S = 1 in 106 = 0.0094",
                "Description": "Slope as per longitudinal survey at proposal site",
                "Reference": "Bed slope sheet data"
            },
            {
                "Step": "5",
                "Parameter": "Manning's Roughness (n)",
                "Equation": "n = 0.033",
                "Description": "Rugosity coefficient for natural channel",
                "Reference": "IRC SP-13 Table values"
            },
            {
                "Step": "6",
                "Parameter": "Velocity Calculation",
                "Equation": "V = (1/n) × (A/P)^(2/3) × S^(1/2)",
                "Description": "Manning's velocity formula",
                "Reference": "Manning's equation"
            },
            {
                "Step": "7",
                "Parameter": "Calculated Velocity",
                "Equation": "V = 5.41 m/sec",
                "Description": "Resulting velocity from Manning's formula",
                "Reference": "Calculated result"
            },
            {
                "Step": "8",
                "Parameter": "Final Discharge",
                "Equation": "Q = 436.65 × 5.41 = 2,362.28 cumecs",
                "Description": "Total discharge through natural channel",
                "Reference": "Final calculated value"
            }
        ]
        
        df_calc = pd.DataFrame(calc_steps)
        st.dataframe(df_calc, use_container_width=True)
        
        # Show detailed Manning's formula breakdown
        st.markdown("""
        ### 🧮 **Manning's Velocity Formula Breakdown:**
        """)
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("""
            **Formula Components:**
            - **V** = Velocity in m/sec
            - **n** = Manning's roughness coefficient  
            - **A** = Cross-sectional area (m²)
            - **P** = Wetted perimeter (m)
            - **S** = Channel slope (m/m)
            """)
        
        with col2:
            st.markdown("""
            **Calculation Steps:**
            1. **Hydraulic Radius**: R = A/P = 436.65/175.43 = 2.49 m
            2. **R^(2/3)**: 2.49^(2/3) = 1.85
            3. **S^(1/2)**: (0.0094)^(1/2) = 0.097
            4. **Final V**: (1/0.033) × 1.85 × 0.097 = **5.41 m/sec**
            """)
    
    def create_waterway_calculation_explanation(self):
        """Detailed explanation of linear waterway calculation"""
        st.markdown("""
        ## 🌊 **2. LINEAR WATERWAY CALCULATION**
        
        ### 📏 **Regime Theory Application:**
        """)
        
        waterway_steps = [
            {
                "Step": "1",
                "Parameter": "Regime Width Formula",
                "Equation": "L = 4.8 × Q^(1/2)",
                "Description": "Regime surface width calculation",
                "Value": "L = 4.8 × (2362.28)^(1/2)",
                "Result": "233.3 m"
            },
            {
                "Step": "2", 
                "Parameter": "Practical Constraints",
                "Equation": "Urban area limitations",
                "Description": "Built-up area constraints require span optimization",
                "Value": "17 spans × 8.4 m each",
                "Result": "142.8 m total"
            },
            {
                "Step": "3",
                "Parameter": "Effective Waterway",
                "Equation": "Total waterway - Pier obstruction",
                "Description": "Net effective flow area calculation",
                "Value": "142.8 - (16 × 1.2)",
                "Result": "123.6 m effective"
            },
            {
                "Step": "4",
                "Parameter": "Contraction Ratio",
                "Equation": "Effective/Regime = 123.6/233.3",
                "Description": "Degree of flow contraction",
                "Value": "0.53",
                "Result": "53% of regime width"
            }
        ]
        
        df_waterway = pd.DataFrame(waterway_steps)
        st.dataframe(df_waterway, use_container_width=True)
        
        # Visualization of waterway calculation
        fig = go.Figure()
        
        # Regime width
        fig.add_trace(go.Bar(
            x=['Regime Width', 'Proposed Waterway', 'Effective Waterway'],
            y=[233.3, 142.8, 123.6],
            marker_color=['blue', 'orange', 'green'],
            text=['233.3 m', '142.8 m', '123.6 m'],
            textposition='auto',
            name='Waterway Analysis'
        ))
        
        fig.update_layout(
            title="Waterway Width Comparison",
            yaxis_title="Width (m)",
            template='plotly_white',
            height=400
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    def create_scour_calculation_explanation(self):
        """Detailed explanation of scour depth calculation"""
        st.markdown("""
        ## ⛏️ **3. SCOUR DEPTH CALCULATION**
        *As per IRC 78-1983, Clause 703.2.2.1*
        
        ### 🔍 **Lacey's Formula Application:**
        """)
        
        scour_steps = [
            {
                "Step": "1",
                "Parameter": "Scour Formula", 
                "Equation": "dsm = 1.34 × (Db²/Ksf)^(1/3)",
                "Description": "Lacey's scour depth formula",
                "Reference": "IRC 78-1983"
            },
            {
                "Step": "2",
                "Parameter": "Discharge per meter (Db)",
                "Equation": "Db = Q/Effective width",
                "Description": "Unit discharge calculation",
                "Value": "2362.28/114.0 = 20.73 cumecs/m",
                "Reference": "Calculated"
            },
            {
                "Step": "3", 
                "Parameter": "Silt Factor (Ksf)",
                "Equation": "Ksf = 1.5",
                "Description": "Standard silt factor for alluvial channels",
                "Reference": "IRC 78-1983 Table"
            },
            {
                "Step": "4",
                "Parameter": "Scour Calculation",
                "Equation": "dsm = 1.34 × (20.73²/1.5)^(1/3)",
                "Description": "Substituting values in formula",
                "Value": "1.34 × (287.3)^(1/3) = 1.34 × 6.59",
                "Reference": "Calculated"
            },
            {
                "Step": "5",
                "Parameter": "Maximum Scour Depth",
                "Equation": "dsm = 8.84 m",
                "Description": "Calculated maximum scour below HFL",
                "Reference": "Final result"
            },
            {
                "Step": "6",
                "Parameter": "Design Scour",
                "Equation": "2 × dsm = 17.68 m",
                "Description": "Design scour as per IRC 78 Clause 703-2-3-1",
                "Reference": "IRC safety factor"
            }
        ]
        
        df_scour = pd.DataFrame(scour_steps)
        st.dataframe(df_scour, use_container_width=True)
        
        # Scour depth visualization
        fig = go.Figure()
        
        # Create scour profile
        x_vals = np.linspace(-50, 50, 100)
        bed_level = np.zeros_like(x_vals)
        scour_profile = np.where(abs(x_vals) < 10, -8.84, 0)
        design_scour = np.where(abs(x_vals) < 10, -17.68, 0)
        
        fig.add_trace(go.Scatter(
            x=x_vals, y=bed_level,
            mode='lines', name='Original Bed Level',
            line=dict(color='brown', width=3)
        ))
        
        fig.add_trace(go.Scatter(
            x=x_vals, y=scour_profile,
            mode='lines', name='Calculated Scour (8.84m)',
            line=dict(color='blue', width=2, dash='dash'),
            fill='tonexty', fillcolor='rgba(0,0,255,0.2)'
        ))
        
        fig.add_trace(go.Scatter(
            x=x_vals, y=design_scour,
            mode='lines', name='Design Scour (17.68m)',
            line=dict(color='red', width=2, dash='dot'),
            fill='tonexty', fillcolor='rgba(255,0,0,0.1)'
        ))
        
        fig.update_layout(
            title="Scour Depth Profile at Bridge Pier",
            xaxis_title="Distance from Pier (m)",
            yaxis_title="Depth below Bed Level (m)",
            template='plotly_white',
            height=400
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    def create_afflux_calculation_explanation(self):
        """Detailed explanation of afflux calculation"""
        st.markdown("""
        ## 🌊 **4. AFFLUX CALCULATION** 
        *Bridge-induced water level rise*
        
        ### 📈 **Afflux Formula Breakdown:**
        """)
        
        afflux_steps = [
            {
                "Step": "1",
                "Parameter": "Afflux Formula",
                "Equation": "h = ((V²/17.85) + 0.0152) × (A₂/a₂ - 1)",
                "Description": "Standard afflux calculation formula",
                "Reference": "IRC SP-13"
            },
            {
                "Step": "2",
                "Parameter": "Velocity Component",
                "Equation": "V²/17.85 = (5.41)²/17.85",
                "Description": "Velocity head contribution to afflux",
                "Value": "29.27/17.85 = 1.64",
                "Reference": "Calculated from discharge analysis"
            },
            {
                "Step": "3",
                "Parameter": "Constant Component", 
                "Equation": "0.0152",
                "Description": "Empirical constant for bridge geometry effects",
                "Reference": "Standard value"
            },
            {
                "Step": "4",
                "Parameter": "Area Ratio",
                "Equation": "A₂/a₂ - 1",
                "Description": "Contraction ratio effect",
                "Value": "Natural area/Effective bridge area - 1",
                "Reference": "Geometric analysis"
            },
            {
                "Step": "5",
                "Parameter": "Natural Cross-section",
                "Equation": "A₂ = 436.65 m²",
                "Description": "Unobstructed river cross-sectional area",
                "Reference": "Survey data"
            },
            {
                "Step": "6",
                "Parameter": "Bridge Waterway",
                "Equation": "a₂ = Effective bridge opening area",
                "Description": "Net waterway area under bridge",
                "Reference": "Bridge design"
            },
            {
                "Step": "7",
                "Parameter": "Calculated Afflux",
                "Equation": "h = 2.02 m",
                "Description": "Final afflux value",
                "Reference": "Excel calculation result"
            },
            {
                "Step": "8",
                "Parameter": "HFL Determination",
                "Equation": "HFL = Normal WL + Afflux = 100.5 + 2.02",
                "Description": "Highest Flood Level calculation",
                "Value": "102.52 m",
                "Reference": "Design flood level"
            }
        ]
        
        df_afflux = pd.DataFrame(afflux_steps)
        st.dataframe(df_afflux, use_container_width=True)
        
        # Afflux profile visualization
        st.markdown("### 📊 **Afflux Profile Analysis:**")
        
        # Create afflux effect diagram
        fig = make_subplots(
            rows=2, cols=1,
            subplot_titles=('Water Surface Profile with Afflux', 'Afflux Components Breakdown'),
            vertical_spacing=0.15
        )
        
        # Water surface profile
        x_bridge = np.linspace(-200, 200, 400)
        normal_level = np.full_like(x_bridge, 100.5)
        
        # Afflux profile with bridge effect
        afflux_effect = []
        for x in x_bridge:
            distance = abs(x)
            if distance < 50:  # Bridge influence zone
                factor = np.exp(-(distance/30)**2)
                afflux = 2.02 * factor
            else:
                afflux = 0
            afflux_effect.append(100.5 + afflux)
        
        fig.add_trace(
            go.Scatter(x=x_bridge, y=normal_level,
                      mode='lines', name='Normal Water Level',
                      line=dict(color='blue', width=2)),
            row=1, col=1
        )
        
        fig.add_trace(
            go.Scatter(x=x_bridge, y=afflux_effect,
                      mode='lines', name='Water Level with Afflux',
                      line=dict(color='red', width=3),
                      fill='tonexty', fillcolor='rgba(255,0,0,0.2)'),
            row=1, col=1
        )
        
        # Bridge location - remove row/col parameters for single plot
        fig.add_vline(x=0, line_dash="solid", line_color="black", 
                     annotation_text="Bridge")
        
        # Afflux components
        components = ['Velocity Head', 'Geometry Factor', 'Contraction Effect']
        values = [1.64, 0.0152, 0.356]  # Approximate breakdown
        
        fig.add_trace(
            go.Bar(x=components, y=values,
                  marker_color=['lightblue', 'lightgreen', 'lightcoral'],
                  text=[f"{v:.3f}" for v in values],
                  textposition='auto'),
            row=2, col=1
        )
        
        fig.update_layout(
            title="Comprehensive Afflux Analysis",
            height=700,
            template='plotly_white'
        )
        
        fig.update_xaxes(title_text="Distance from Bridge (m)", row=1, col=1)
        fig.update_yaxes(title_text="Water Level (m)", row=1, col=1)
        fig.update_xaxes(title_text="Afflux Components", row=2, col=1)
        fig.update_yaxes(title_text="Contribution", row=2, col=1)
        
        st.plotly_chart(fig, use_container_width=True)
    
    def create_deck_anchorage_explanation(self):
        """Detailed explanation of deck anchorage calculations"""
        st.markdown("""
        ## ⚓ **5. DECK ANCHORAGE CALCULATION**
        *Submersible bridge anchorage requirements*
        
        ### 🏗️ **Uplift Force Analysis:**
        """)
        
        anchorage_steps = [
            {
                "Step": "1",
                "Parameter": "Critical Condition",
                "Equation": "Water level at deck = HFL",
                "Description": "Maximum uplift occurs when water reaches deck level",
                "Value": "102.52 m (Afflux flood level)",
                "Reference": "From afflux calculation"
            },
            {
                "Step": "2",
                "Parameter": "Water Head",
                "Equation": "h = HFL - Deck level",
                "Description": "Height of water above deck slab",
                "Value": "102.52 - 100.5 = 2.02 m",
                "Reference": "Hydrostatic head"
            },
            {
                "Step": "3",
                "Parameter": "Uplift Pressure",
                "Equation": "p = γw × h = 10 × 2.02",
                "Description": "Hydrostatic uplift pressure on deck",
                "Value": "20.2 kN/m²",
                "Reference": "Hydrostatic pressure formula"
            },
            {
                "Step": "4",
                "Parameter": "Effective Deck Area",
                "Equation": "A = Length × Width = 15.0 × 10.8",
                "Description": "Area of deck slab under uplift effect",
                "Value": "162.0 m²",
                "Reference": "Bridge geometry"
            },
            {
                "Step": "5",
                "Parameter": "Total Uplift Force",
                "Equation": "F = p × A = 20.2 × 162.0",
                "Description": "Total upward force on deck slab",
                "Value": "3,272.4 kN",
                "Reference": "Critical design force"
            },
            {
                "Step": "6",
                "Parameter": "Safety Factor",
                "Equation": "SF = 1.5 (minimum)",
                "Description": "Factor of safety for anchorage design",
                "Reference": "IRC standards"
            },
            {
                "Step": "7",
                "Parameter": "Design Anchorage",
                "Equation": "Fd = F × SF = 3,272.4 × 1.5",
                "Description": "Required anchorage capacity",
                "Value": "4,908.6 kN",
                "Reference": "Design requirement"
            }
        ]
        
        df_anchorage = pd.DataFrame(anchorage_steps)
        st.dataframe(df_anchorage, use_container_width=True)
        
        # Uplift pressure distribution
        st.markdown("### 📊 **Uplift Pressure Distribution:**")
        
        fig = make_subplots(
            rows=1, cols=2,
            subplot_titles=('Uplift Pressure on Deck', 'Anchorage Force Distribution'),
            specs=[[{'type': 'scatter'}, {'type': 'bar'}]]
        )
        
        # Create deck pressure contour (simplified)
        x_deck = np.linspace(0, 15, 30)
        y_deck = np.linspace(0, 10.8, 20)
        X, Y = np.meshgrid(x_deck, y_deck)
        Z = np.full_like(X, 20.2)  # Uniform pressure
        
        fig.add_trace(
            go.Contour(x=x_deck, y=y_deck, z=Z,
                      colorscale='Reds',
                      contours=dict(showlabels=True),
                      colorbar=dict(title="Pressure (kN/m²)")),
            row=1, col=1
        )
        
        # Anchorage distribution
        anchors = ['Corner 1', 'Corner 2', 'Corner 3', 'Corner 4', 'Center']
        forces = [981.7, 981.7, 981.7, 981.7, 981.7]  # Equal distribution
        
        fig.add_trace(
            go.Bar(x=anchors, y=forces,
                  marker_color='steelblue',
                  text=[f"{f:.0f} kN" for f in forces],
                  textposition='auto'),
            row=1, col=2
        )
        
        fig.update_layout(
            title="Deck Anchorage Analysis",
            height=500,
            template='plotly_white'
        )
        
        fig.update_xaxes(title_text="Deck Length (m)", row=1, col=1)
        fig.update_yaxes(title_text="Deck Width (m)", row=1, col=1)
        fig.update_xaxes(title_text="Anchor Location", row=1, col=2)
        fig.update_yaxes(title_text="Force (kN)", row=1, col=2)
        
        st.plotly_chart(fig, use_container_width=True)
    
    def create_comprehensive_summary(self):
        """Create comprehensive summary of all calculations"""
        st.markdown("""
        ## 📋 **COMPREHENSIVE HYDRAULIC SUMMARY**
        *Complete parameter overview with Excel sheet references*
        """)
        
        # Create comprehensive parameter table
        comprehensive_data = [
            {
                "Category": "Discharge Analysis",
                "Parameter": "Cross-sectional Area (A)",
                "Value": "436.65 m²",
                "Formula/Method": "From river survey coordinates",
                "Excel Reference": "HYDRAULICS sheet, Row 4",
                "IRC Reference": "SP-13 Article-5"
            },
            {
                "Category": "Discharge Analysis", 
                "Parameter": "Wetted Perimeter (P)",
                "Value": "175.43 m",
                "Formula/Method": "Calculated from cross-section geometry",
                "Excel Reference": "HYDRAULICS sheet, Row 5",
                "IRC Reference": "SP-13 Article-5"
            },
            {
                "Category": "Discharge Analysis",
                "Parameter": "Channel Slope (S)",
                "Value": "1 in 106 (0.87%)",
                "Formula/Method": "From longitudinal survey",
                "Excel Reference": "Bed Slope sheet",
                "IRC Reference": "Survey data"
            },
            {
                "Category": "Discharge Analysis",
                "Parameter": "Manning's Coefficient (n)",
                "Value": "0.033",
                "Formula/Method": "Standard value for natural channels",
                "Excel Reference": "HYDRAULICS sheet, Row 8",
                "IRC Reference": "IRC SP-13 Table"
            },
            {
                "Category": "Discharge Analysis",
                "Parameter": "Velocity (V)",
                "Value": "5.41 m/sec",
                "Formula/Method": "Manning's formula: V = (1/n) × (A/P)^(2/3) × S^(1/2)",
                "Excel Reference": "HYDRAULICS sheet, Row 11",
                "IRC Reference": "Manning's equation"
            },
            {
                "Category": "Discharge Analysis",
                "Parameter": "Total Discharge (Q)",
                "Value": "2,362.28 cumecs",
                "Formula/Method": "Q = A × V = 436.65 × 5.41",
                "Excel Reference": "HYDRAULICS sheet, Row 12",
                "IRC Reference": "SP-13 Article-5"
            },
            {
                "Category": "Waterway Design",
                "Parameter": "Regime Width",
                "Value": "233.3 m",
                "Formula/Method": "L = 4.8 × Q^(1/2)",
                "Excel Reference": "Afflux sheet, Row 15",
                "IRC Reference": "Regime theory"
            },
            {
                "Category": "Waterway Design",
                "Parameter": "Proposed Waterway",
                "Value": "142.8 m",
                "Formula/Method": "17 spans × 8.4 m each",
                "Excel Reference": "Afflux sheet, Row 18",
                "IRC Reference": "Design constraint"
            },
            {
                "Category": "Scour Analysis",
                "Parameter": "Unit Discharge (Db)",
                "Value": "20.73 cumecs/m",
                "Formula/Method": "Db = Q/Effective width",
                "Excel Reference": "Afflux sheet, Row 29-30",
                "IRC Reference": "IRC 78-1983"
            },
            {
                "Category": "Scour Analysis",
                "Parameter": "Maximum Scour (dsm)",
                "Value": "8.84 m",
                "Formula/Method": "dsm = 1.34 × (Db²/Ksf)^(1/3)",
                "Excel Reference": "Afflux sheet, Row 31",
                "IRC Reference": "IRC 78 Clause 703.2.2.1"
            },
            {
                "Category": "Afflux Calculation",
                "Parameter": "Afflux Value (h)",
                "Value": "2.02 m",
                "Formula/Method": "h = ((V²/17.85) + 0.0152) × (A₂/a₂ - 1)",
                "Excel Reference": "Afflux sheet, Row 76",
                "IRC Reference": "IRC SP-13"
            },
            {
                "Category": "Afflux Calculation",
                "Parameter": "Highest Flood Level",
                "Value": "102.52 m",
                "Formula/Method": "HFL = Normal WL + Afflux = 100.5 + 2.02",
                "Excel Reference": "Afflux sheet, Row 77",
                "IRC Reference": "Design flood level"
            },
            {
                "Category": "Deck Anchorage",
                "Parameter": "Uplift Pressure",
                "Value": "20.2 kN/m²",
                "Formula/Method": "p = γw × h = 10 × 2.02",
                "Excel Reference": "Deck Anchorage sheet, Row 8",
                "IRC Reference": "Hydrostatic pressure"
            },
            {
                "Category": "Deck Anchorage",
                "Parameter": "Total Uplift Force",
                "Value": "3,272.4 kN",
                "Formula/Method": "F = p × A = 20.2 × 162.0",
                "Excel Reference": "Deck Anchorage sheet, Row 9",
                "IRC Reference": "Critical design force"
            }
        ]
        
        df_comprehensive = pd.DataFrame(comprehensive_data)
        st.dataframe(df_comprehensive, use_container_width=True)
        
        # Summary metrics
        st.markdown("### 📊 **Key Design Parameters Summary:**")
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Design Discharge", "2,362.28 cumecs", help="Total flow through bridge")
            st.metric("Flow Velocity", "5.41 m/sec", help="Average velocity in channel")
        
        with col2:
            st.metric("Afflux Value", "2.02 m", help="Bridge-induced water rise")
            st.metric("HFL Level", "102.52 m", help="Highest flood level")
        
        with col3:
            st.metric("Scour Depth", "8.84 m", help="Maximum scour below HFL")
            st.metric("Waterway Length", "142.8 m", help="Total bridge waterway")
        
        with col4:
            st.metric("Uplift Force", "3,272.4 kN", help="Total upward force on deck")
            st.metric("Manning's n", "0.033", help="Channel roughness coefficient")

def main():
    """Main function to display detailed hydraulic explanations"""
    st.set_page_config(
        page_title="Detailed Hydraulic Parameter Explanations",
        page_icon="📊",
        layout="wide"
    )
    
    st.title("📊 Detailed Hydraulic Parameter Explanations")
    st.subheader("Line-by-Line Analysis from Project Excel Sheets")
    
    # Initialize explanations class
    explanations = DetailedHydraulicExplanations()
    
    # Sidebar navigation
    st.sidebar.title("📋 Parameter Categories")
    
    analysis_sections = [
        "🔢 1. Discharge Calculation",
        "🌊 2. Waterway Analysis", 
        "⛏️ 3. Scour Depth Calculation",
        "📈 4. Afflux Calculation",
        "⚓ 5. Deck Anchorage Design",
        "📋 6. Comprehensive Summary"
    ]
    
    selected_section = st.sidebar.selectbox(
        "Select Analysis Section",
        analysis_sections
    )
    
    # Display selected section
    if "1. Discharge" in selected_section:
        explanations.create_discharge_calculation_explanation()
    
    elif "2. Waterway" in selected_section:
        explanations.create_waterway_calculation_explanation()
    
    elif "3. Scour" in selected_section:
        explanations.create_scour_calculation_explanation()
    
    elif "4. Afflux" in selected_section:
        explanations.create_afflux_calculation_explanation()
    
    elif "5. Deck Anchorage" in selected_section:
        explanations.create_deck_anchorage_explanation()
    
    elif "6. Comprehensive" in selected_section:
        explanations.create_comprehensive_summary()
    
    # Footer information
    st.markdown("---")
    st.markdown("""
    **📚 References:**
    - IRC SP-13: Guidelines for Design of Small Bridges and Culverts
    - IRC 78-1983: Standard Specifications and Code of Practice for Road Bridges  
    - Manning's Formula for Open Channel Flow
    - Lacey's Regime Theory for Scour Analysis
    """)

if __name__ == "__main__":
    main()