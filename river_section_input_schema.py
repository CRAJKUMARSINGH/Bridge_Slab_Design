"""
RIVER SECTION INPUT SCHEMA
=========================

Comprehensive input schema for river cross-section and longitudinal section data
Wire directly to main app for professional hydraulic calculations

Based on CHITTOR PWD & UIT BRIDGES Excel repository standards
"""

import streamlit as st
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
import math
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime

@dataclass
class RiverCrossSectionPoint:
    """Single point in river cross-section"""
    chainage: float  # Distance from left bank (m)
    elevation: float  # Elevation (m)
    description: str = ""  # Point description (e.g., "Left Bank", "Thalweg", "Right Bank")

@dataclass
class WaterLevelData:
    """Water level parameters"""
    hfl: float  # High Flood Level (m)
    lwl: float  # Low Water Level (m)
    nwl: float  # Normal Water Level (m)
    design_discharge: float  # Design discharge (cumecs)
    return_period: int = 100  # Return period (years)
    velocity_at_hfl: float = 0.0  # Velocity at HFL (m/s)
    velocity_at_lwl: float = 0.0  # Velocity at LWL (m/s)

@dataclass
class BedMaterialData:
    """River bed material properties"""
    material_type: str  # "Sand", "Gravel", "Rock", "Clay", etc.
    d50_size: float  # Median grain size (mm)
    d90_size: float  # 90% passing size (mm)
    manning_n: float  # Manning's roughness coefficient
    angle_of_repose: float  # Angle of repose (degrees)
    unit_weight: float  # Unit weight (kN/m³)
    silt_factor: float = 1.5  # Silt factor for Lacey's formula

@dataclass
class FlowData:
    """River flow characteristics"""
    discharge_100yr: float  # 100-year discharge (cumecs)
    discharge_50yr: float  # 50-year discharge (cumecs)
    discharge_25yr: float  # 25-year discharge (cumecs)
    normal_discharge: float  # Normal discharge (cumecs)
    velocity_coefficient: float = 1.0  # Velocity coefficient
    energy_slope: float = 0.001  # Energy slope (m/m)
    froude_number: float = 0.0  # Froude number (calculated)

@dataclass
class LongitudinalSectionData:
    """Longitudinal section parameters"""
    upstream_chainage: float  # Upstream section chainage (m)
    downstream_chainage: float  # Downstream section chainage (m)
    bridge_chainage: float  # Bridge centerline chainage (m)
    upstream_bed_level: float  # Upstream bed level (m)
    downstream_bed_level: float  # Downstream bed level (m)
    bridge_bed_level: float  # Bed level at bridge (m)
    river_slope: float  # River bed slope (m/m)
    meander_coefficient: float = 1.3  # Meander coefficient

@dataclass
class BridgeGeometryRelativeToRiver:
    """Bridge geometry relative to river"""
    bridge_length: float  # Total bridge length (m)
    waterway_provided: float  # Waterway provided (m)
    vertical_clearance: float  # Vertical clearance above HFL (m)
    pier_width: float  # Pier width perpendicular to flow (m)
    number_of_piers: int  # Number of piers in waterway
    skew_angle: float = 0.0  # Skew angle (degrees)
    pier_nose_type: str = "Rectangular"  # "Rectangular", "Circular", "Streamlined"

@dataclass
class RiverSectionInputSchema:
    """Complete river section input schema"""
    # Basic Information
    project_name: str = ""
    river_name: str = ""
    location: str = ""
    survey_date: str = ""
    
    # Cross-section data
    cross_section_points: List[RiverCrossSectionPoint] = field(default_factory=list)
    water_levels: WaterLevelData = field(default_factory=lambda: WaterLevelData(0, 0, 0, 0))
    bed_material: BedMaterialData = field(default_factory=lambda: BedMaterialData("Sand", 0.5, 2.0, 0.03, 30, 18))
    flow_data: FlowData = field(default_factory=lambda: FlowData(0, 0, 0, 0))
    
    # Longitudinal section
    l_section: LongitudinalSectionData = field(default_factory=lambda: LongitudinalSectionData(0, 0, 0, 0, 0, 0, 0.001))
    
    # Bridge geometry
    bridge_geometry: BridgeGeometryRelativeToRiver = field(default_factory=lambda: BridgeGeometryRelativeToRiver(0, 0, 0, 0, 0, 0))

class HydraulicCalculationEngine:
    """Hydraulic calculation engine for bridge design"""
    
    def __init__(self, river_data: RiverSectionInputSchema):
        self.river_data = river_data
        self.calculation_results: Dict[str, Any] = {}
    
    def calculate_afflux(self) -> Dict[str, float]:
        """
        Calculate afflux using standard methods
        Based on CHITTOR PWD & UIT Excel formulas
        """
        # Extract data
        Q = self.river_data.water_levels.design_discharge
        L = self.river_data.bridge_geometry.waterway_provided
        pier_width = self.river_data.bridge_geometry.pier_width
        n_piers = self.river_data.bridge_geometry.number_of_piers
        
        # Calculate effective waterway
        effective_waterway = L - (n_piers * pier_width)
        
        # Afflux calculation methods
        results = {}
        
        # Method 1: Yarnell's Formula
        pier_shape_factor = 1.25  # For rectangular piers
        skew_factor = 1.0 + 0.6 * (math.sin(math.radians(self.river_data.bridge_geometry.skew_angle)))**2
        contraction_ratio = pier_width * n_piers / L
        
        if contraction_ratio < 0.9:
            yarnell_afflux = pier_shape_factor * skew_factor * (contraction_ratio**2) / (1 - contraction_ratio)
        else:
            yarnell_afflux = 0.5  # Conservative value for high contraction
        
        results['yarnell_afflux'] = yarnell_afflux
        
        # Method 2: IRC:5 Formula  
        velocity_head = (self.river_data.water_levels.velocity_at_hfl**2) / (2 * 9.81)
        irc_afflux = 0.3 * velocity_head * contraction_ratio
        results['irc_afflux'] = irc_afflux
        
        # Method 3: Simplified formula
        if effective_waterway > 0:
            simple_afflux = 0.1 * (Q / effective_waterway)**0.5
        else:
            simple_afflux = 0.5
        results['simple_afflux'] = simple_afflux
        
        # Design afflux (conservative)
        results['design_afflux'] = max(yarnell_afflux, irc_afflux, 0.083)  # Minimum 83mm
        
        return results
    
    def calculate_waterway_adequacy(self) -> Dict[str, Any]:
        """
        Calculate waterway adequacy using Lacey's and other methods
        """
        Q = self.river_data.water_levels.design_discharge
        f = self.river_data.bed_material.silt_factor
        
        results = {}
        
        # Lacey's Regime Width
        regime_width = 4.8 * math.sqrt(Q)
        results['lacey_regime_width'] = regime_width
        
        # Regime Depth (Lacey)
        regime_depth = 1.34 * ((Q**2 / f)**(1/3))
        results['lacey_regime_depth'] = regime_depth
        
        # Regime Velocity
        regime_velocity = (1/f**0.5) * (Q**(1/6))
        results['lacey_regime_velocity'] = regime_velocity
        
        # Waterway provided
        waterway_provided = self.river_data.bridge_geometry.waterway_provided
        results['waterway_provided'] = waterway_provided
        
        # Adequacy check
        adequacy_ratio = waterway_provided / regime_width
        results['waterway_adequacy_ratio'] = adequacy_ratio
        
        if adequacy_ratio >= 1.0:
            results['waterway_status'] = "ADEQUATE"
        elif adequacy_ratio >= 0.9:
            results['waterway_status'] = "MARGINALLY ADEQUATE"
        else:
            results['waterway_status'] = "INADEQUATE"
        
        return results
    
    def calculate_scour_depth(self) -> Dict[str, float]:
        """
        Calculate scour depth using multiple methods
        """
        Q = self.river_data.water_levels.design_discharge
        V = self.river_data.water_levels.velocity_at_hfl
        f = self.river_data.bed_material.silt_factor
        pier_width = self.river_data.bridge_geometry.pier_width
        
        results = {}
        
        # Normal Scour (Lacey's Formula)
        normal_scour = 1.34 * ((Q**2 / f)**(1/3))
        results['normal_scour_lacey'] = normal_scour
        
        # Design Scour Depth
        design_scour = 1.5 * normal_scour  # Factor of safety
        results['design_scour_depth'] = design_scour
        
        # Local Scour at Piers (HEC-RAS method)
        if pier_width > 0 and V > 0:
            local_scour_depth = 2.0 * pier_width * ((V / math.sqrt(9.81 * pier_width))**0.65)
            results['local_scour_at_piers'] = local_scour_depth
        else:
            results['local_scour_at_piers'] = 0.0
        
        # Total Scour
        total_scour = design_scour + results['local_scour_at_piers']
        results['total_scour_depth'] = total_scour
        
        # Scour protection stone size (Neill's formula)
        if V > 0:
            stone_size = (V**2) / (5.75 * 9.81)
            results['stone_size_d50'] = stone_size
        else:
            results['stone_size_d50'] = 0.1  # Minimum 100mm
        
        return results
    
    def calculate_hydraulic_analysis(self) -> Dict[str, Any]:
        """
        Comprehensive hydraulic analysis
        """
        # Perform all calculations
        afflux_results = self.calculate_afflux()
        waterway_results = self.calculate_waterway_adequacy()
        scour_results = self.calculate_scour_depth()
        
        # Combine results
        all_results = {
            'afflux': afflux_results,
            'waterway': waterway_results,
            'scour': scour_results,
            'summary': {
                'design_afflux': afflux_results['design_afflux'],
                'waterway_status': waterway_results['waterway_status'],
                'total_scour_depth': scour_results['total_scour_depth'],
                'foundation_depth_required': scour_results['total_scour_depth'] + 2.0  # 2m below scour
            }
        }
        
        self.calculation_results = all_results
        return all_results

class RiverSectionInputUI:
    """UI components for river section input"""
    
    def __init__(self):
        self.river_data = RiverSectionInputSchema()
    
    def render_basic_information_form(self) -> Dict[str, str]:
        """Render basic project information form"""
        
        st.markdown("""
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
            <h3 style="margin: 0;">🌊 River Section & Hydraulic Input Schema</h3>
            <p style="margin: 0; opacity: 0.9;">Comprehensive hydraulic parameters for bridge design</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("### 📋 Basic Project Information")
        
        col1, col2 = st.columns(2)
        
        with col1:
            project_name = st.text_input("Project Name", 
                                       value="Bridge Hydraulic Design",
                                       help="Name of the bridge project")
            
            river_name = st.text_input("River Name", 
                                     value="Main River",
                                     help="Name of the river being crossed")
        
        with col2:
            location = st.text_input("Location", 
                                   value="Bridge Location",
                                   help="Geographic location of the bridge")
            
            survey_date = st.date_input("Survey Date", 
                                      value=datetime.now().date(),
                                      help="Date of river survey")
        
        return {
            'project_name': project_name,
            'river_name': river_name,
            'location': location,
            'survey_date': str(survey_date)
        }
    
    def render_cross_section_input(self) -> List[RiverCrossSectionPoint]:
        """Render river cross-section input form"""
        
        st.markdown("### 📏 River Cross-Section Data")
        
        # Input method selection
        input_method = st.radio(
            "Cross-Section Input Method",
            ["Manual Entry", "CSV Upload", "Use Sample Data"],
            help="Choose how to input cross-section data"
        )
        
        cross_section_points = []
        
        if input_method == "Use Sample Data":
            # Sample cross-section data
            sample_points = [
                RiverCrossSectionPoint(0.0, 295.5, "Left Bank"),
                RiverCrossSectionPoint(20.0, 294.8, "Flood Plain"),
                RiverCrossSectionPoint(40.0, 294.2, "Channel Edge"),
                RiverCrossSectionPoint(60.0, 293.5, "Thalweg"),
                RiverCrossSectionPoint(80.0, 294.1, "Channel Edge"),
                RiverCrossSectionPoint(100.0, 294.7, "Flood Plain"),
                RiverCrossSectionPoint(120.0, 295.4, "Right Bank")
            ]
            
            st.success("✅ Using sample cross-section data (7 points)")
            
            # Display sample data
            df_sample = pd.DataFrame([
                {"Chainage (m)": p.chainage, "Elevation (m)": p.elevation, "Description": p.description}
                for p in sample_points
            ])
            st.dataframe(df_sample, use_container_width=True)
            
            cross_section_points = sample_points
        
        elif input_method == "Manual Entry":
            st.info("📝 Enter cross-section points manually")
            
            num_points = st.number_input("Number of Points", min_value=3, max_value=20, value=7)
            
            for i in range(int(num_points)):
                col1, col2, col3 = st.columns([1, 1, 2])
                
                with col1:
                    chainage = st.number_input(f"Chainage {i+1} (m)", 
                                             value=float(i * 20), 
                                             key=f"chainage_{i}")
                
                with col2:
                    elevation = st.number_input(f"Elevation {i+1} (m)", 
                                              value=295.0 - i * 0.2, 
                                              step=0.1, 
                                              key=f"elevation_{i}")
                
                with col3:
                    description = st.text_input(f"Description {i+1}", 
                                              value=f"Point {i+1}", 
                                              key=f"desc_{i}")
                
                cross_section_points.append(RiverCrossSectionPoint(chainage, elevation, description))
        
        elif input_method == "CSV Upload":
            st.info("📂 Upload CSV file with columns: Chainage, Elevation, Description")
            
            uploaded_file = st.file_uploader("Choose CSV file", type="csv")
            
            if uploaded_file is not None:
                try:
                    df = pd.read_csv(uploaded_file)
                    
                    for _, row in df.iterrows():
                        cross_section_points.append(
                            RiverCrossSectionPoint(
                                float(row['Chainage']), 
                                float(row['Elevation']), 
                                str(row.get('Description', ''))
                            )
                        )
                    
                    st.success(f"✅ Loaded {len(cross_section_points)} points from CSV")
                    st.dataframe(df, use_container_width=True)
                    
                except Exception as e:
                    st.error(f"Error reading CSV: {str(e)}")
                    cross_section_points = []
        
        return cross_section_points
    
    def render_water_levels_input(self) -> WaterLevelData:
        """Render water levels input form"""
        
        st.markdown("### 🌊 Water Level Data")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            hfl = st.number_input("High Flood Level (HFL) (m)", 
                                value=298.50, 
                                step=0.01,
                                help="Highest flood level recorded")
            
            design_discharge = st.number_input("Design Discharge (Cumecs)", 
                                             value=1265.76, 
                                             step=0.01,
                                             help="100-year return period discharge")
        
        with col2:
            lwl = st.number_input("Low Water Level (LWL) (m)", 
                                value=295.00, 
                                step=0.01,
                                help="Lowest water level recorded")
            
            velocity_at_hfl = st.number_input("Velocity at HFL (m/s)", 
                                            value=3.5, 
                                            step=0.1,
                                            help="Flow velocity at HFL")
        
        with col3:
            nwl = st.number_input("Normal Water Level (NWL) (m)", 
                                value=296.50, 
                                step=0.01,
                                help="Normal water level")
            
            velocity_at_lwl = st.number_input("Velocity at LWL (m/s)", 
                                            value=2.0, 
                                            step=0.1,
                                            help="Flow velocity at LWL")
        
        return_period = st.selectbox("Return Period (years)", 
                                   [25, 50, 100, 200], 
                                   index=2,
                                   help="Design return period")
        
        return WaterLevelData(hfl, lwl, nwl, design_discharge, return_period, velocity_at_hfl, velocity_at_lwl)
    
    def render_bed_material_input(self) -> BedMaterialData:
        """Render bed material input form"""
        
        st.markdown("### 🏔️ Bed Material Properties")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            material_type = st.selectbox("Material Type", 
                                       ["Sand", "Gravel", "Rock", "Clay", "Silt", "Mixed"],
                                       help="Primary bed material type")
            
            d50_size = st.number_input("D50 Size (mm)", 
                                     value=0.5, 
                                     step=0.1,
                                     help="Median grain size")
        
        with col2:
            d90_size = st.number_input("D90 Size (mm)", 
                                     value=2.0, 
                                     step=0.1,
                                     help="90% passing grain size")
            
            manning_n = st.number_input("Manning's n", 
                                      value=0.033, 
                                      step=0.001,
                                      help="Manning's roughness coefficient")
        
        with col3:
            angle_of_repose = st.number_input("Angle of Repose (°)", 
                                            value=30.0, 
                                            step=1.0,
                                            help="Internal friction angle")
            
            unit_weight = st.number_input("Unit Weight (kN/m³)", 
                                        value=18.0, 
                                        step=0.5,
                                        help="Unit weight of bed material")
        
        silt_factor = st.number_input("Silt Factor (Lacey)", 
                                    value=1.5, 
                                    step=0.1,
                                    help="Silt factor for Lacey's formula")
        
        return BedMaterialData(material_type, d50_size, d90_size, manning_n, 
                             angle_of_repose, unit_weight, silt_factor)
    
    def render_longitudinal_section_input(self) -> LongitudinalSectionData:
        """Render longitudinal section input form"""
        
        st.markdown("### 📐 Longitudinal Section Data")
        
        col1, col2 = st.columns(2)
        
        with col1:
            upstream_chainage = st.number_input("Upstream Chainage (m)", 
                                              value=0.0, 
                                              help="Upstream section chainage")
            
            downstream_chainage = st.number_input("Downstream Chainage (m)", 
                                                value=200.0, 
                                                help="Downstream section chainage")
            
            bridge_chainage = st.number_input("Bridge Chainage (m)", 
                                            value=100.0, 
                                            help="Bridge centerline chainage")
        
        with col2:
            upstream_bed_level = st.number_input("Upstream Bed Level (m)", 
                                               value=294.5, 
                                               step=0.01,
                                               help="Bed level upstream of bridge")
            
            downstream_bed_level = st.number_input("Downstream Bed Level (m)", 
                                                 value=294.0, 
                                                 step=0.01,
                                                 help="Bed level downstream of bridge")
            
            bridge_bed_level = st.number_input("Bridge Bed Level (m)", 
                                             value=294.2, 
                                             step=0.01,
                                             help="Bed level at bridge location")
        
        # Calculate river slope
        if downstream_chainage != upstream_chainage:
            river_slope = (upstream_bed_level - downstream_bed_level) / (downstream_chainage - upstream_chainage)
        else:
            river_slope = 0.001
        
        st.info(f"📈 Calculated River Slope: {river_slope:.6f} (1 in {1/river_slope:.0f})")
        
        meander_coefficient = st.number_input("Meander Coefficient", 
                                            value=1.3, 
                                            step=0.1,
                                            help="Coefficient for meandering rivers")
        
        return LongitudinalSectionData(upstream_chainage, downstream_chainage, bridge_chainage,
                                     upstream_bed_level, downstream_bed_level, bridge_bed_level,
                                     river_slope, meander_coefficient)
    
    def render_bridge_geometry_input(self) -> BridgeGeometryRelativeToRiver:
        """Render bridge geometry input form"""
        
        st.markdown("### 🌉 Bridge Geometry Relative to River")
        
        col1, col2 = st.columns(2)
        
        with col1:
            bridge_length = st.number_input("Total Bridge Length (m)", 
                                          value=120.0, 
                                          step=0.5,
                                          help="Total length of bridge")
            
            waterway_provided = st.number_input("Waterway Provided (m)", 
                                               value=100.0, 
                                               step=0.5,
                                               help="Clear waterway provided")
            
            skew_angle = st.number_input("Skew Angle (°)", 
                                       value=0.0, 
                                       step=1.0,
                                       help="Skew angle of bridge")
            
            vertical_clearance = st.number_input("Vertical Clearance above HFL (m)", 
                                                value=2.0, 
                                                step=0.1,
                                                help="Clearance above high flood level")
        
        with col2:
            number_of_piers = st.number_input("Number of Piers in Waterway", 
                                            value=2, 
                                            step=1,
                                            help="Piers obstructing waterway")
            
            pier_width = st.number_input("Pier Width (m)", 
                                       value=2.0, 
                                       step=0.1,
                                       help="Width perpendicular to flow")
            
            pier_nose_type = st.selectbox("Pier Nose Type", 
                                        ["Rectangular", "Circular", "Streamlined"],
                                        help="Shape of pier nose")
        
        return BridgeGeometryRelativeToRiver(bridge_length, waterway_provided, vertical_clearance,
                                           pier_width, int(number_of_piers), skew_angle, pier_nose_type)
    
    def create_cross_section_plot(self, points: List[RiverCrossSectionPoint], 
                                water_levels: WaterLevelData) -> Optional[go.Figure]:
        """Create cross-section visualization"""
        
        if not points:
            return None
        
        # Extract data for plotting
        chainages = [p.chainage for p in points]
        elevations = [p.elevation for p in points]
        descriptions = [p.description for p in points]
        
        # Create figure
        fig = go.Figure()
        
        # Add cross-section line
        fig.add_trace(go.Scatter(
            x=chainages,
            y=elevations,
            mode='lines+markers',
            name='River Cross-Section',
            line=dict(color='brown', width=3),
            marker=dict(size=8, color='darkbrown'),
            text=descriptions,
            hovertemplate='<b>%{text}</b><br>Chainage: %{x:.1f} m<br>Elevation: %{y:.2f} m<extra></extra>'
        ))
        
        # Add water levels
        fig.add_hline(y=water_levels.hfl, line_dash="dash", line_color="red", 
                     annotation_text="HFL", annotation_position="right")
        fig.add_hline(y=water_levels.nwl, line_dash="dash", line_color="blue", 
                     annotation_text="NWL", annotation_position="right")
        fig.add_hline(y=water_levels.lwl, line_dash="dash", line_color="green", 
                     annotation_text="LWL", annotation_position="right")
        
        # Fill area below HFL
        fig.add_trace(go.Scatter(
            x=chainages + chainages[::-1],
            y=[water_levels.hfl] * len(chainages) + elevations[::-1],
            fill='toself',
            fillcolor='rgba(65, 105, 225, 0.3)',
            line=dict(width=0),
            name='Water Area at HFL',
            showlegend=True
        ))
        
        # Update layout
        fig.update_layout(
            title='River Cross-Section with Water Levels',
            xaxis_title='Chainage (m)',
            yaxis_title='Elevation (m)',
            hovermode='x unified',
            template='plotly_white',
            height=500
        )
        
        return fig
    
    def create_longitudinal_profile_plot(self, l_section: LongitudinalSectionData) -> go.Figure:
        """Create longitudinal profile visualization"""
        
        # Create sample profile points
        chainages = np.linspace(l_section.upstream_chainage, l_section.downstream_chainage, 20)
        
        # Interpolate bed levels
        bed_levels = np.interp(chainages, 
                              [l_section.upstream_chainage, l_section.bridge_chainage, l_section.downstream_chainage],
                              [l_section.upstream_bed_level, l_section.bridge_bed_level, l_section.downstream_bed_level])
        
        # Create figure
        fig = go.Figure()
        
        # Add bed profile
        fig.add_trace(go.Scatter(
            x=chainages,
            y=bed_levels,
            mode='lines+markers',
            name='River Bed Profile',
            line=dict(color='saddlebrown', width=3),
            marker=dict(size=6)
        ))
        
        # Mark bridge location
        fig.add_vline(x=l_section.bridge_chainage, line_dash="dash", line_color="red",
                     annotation_text="Bridge CL", annotation_position="top")
        
        # Update layout
        fig.update_layout(
            title='Longitudinal River Profile',
            xaxis_title='Chainage (m)',
            yaxis_title='Elevation (m)',
            template='plotly_white',
            height=400
        )
        
        return fig
    
    def render_complete_form(self) -> RiverSectionInputSchema:
        """Render complete river section input form"""
        
        # Basic information
        basic_info = self.render_basic_information_form()
        
        # Create tabs for different input sections
        tab1, tab2, tab3, tab4, tab5 = st.tabs([
            "🏞️ Cross-Section", 
            "🌊 Water Levels", 
            "🏔️ Bed Material", 
            "📐 L-Section", 
            "🌉 Bridge Geometry"
        ])
        
        with tab1:
            cross_section_points = self.render_cross_section_input()
        
        with tab2:
            water_levels = self.render_water_levels_input()
        
        with tab3:
            bed_material = self.render_bed_material_input()
        
        with tab4:
            l_section = self.render_longitudinal_section_input()
        
        with tab5:
            bridge_geometry = self.render_bridge_geometry_input()
        
        # Create flow data with defaults
        flow_data = FlowData(
            discharge_100yr=water_levels.design_discharge,
            discharge_50yr=water_levels.design_discharge * 0.8,
            discharge_25yr=water_levels.design_discharge * 0.6,
            normal_discharge=water_levels.design_discharge * 0.3
        )
        
        # Update river data
        self.river_data = RiverSectionInputSchema(
            project_name=basic_info['project_name'],
            river_name=basic_info['river_name'],
            location=basic_info['location'],
            survey_date=basic_info['survey_date'],
            cross_section_points=cross_section_points,
            water_levels=water_levels,
            bed_material=bed_material,
            flow_data=flow_data,
            l_section=l_section,
            bridge_geometry=bridge_geometry
        )
        
        return self.river_data
    
    def render_visualization_tab(self, river_data: RiverSectionInputSchema):
        """Render visualization tab with plots"""
        
        st.markdown("### 📊 River Section Visualization")
        
        if river_data.cross_section_points:
            # Cross-section plot
            fig_cross = self.create_cross_section_plot(river_data.cross_section_points, river_data.water_levels)
            if fig_cross:
                st.plotly_chart(fig_cross, use_container_width=True)
        
        # Longitudinal profile plot
        fig_long = self.create_longitudinal_profile_plot(river_data.l_section)
        st.plotly_chart(fig_long, use_container_width=True)
        
        # Summary statistics
        st.markdown("### 📈 Section Statistics")
        
        if river_data.cross_section_points:
            chainages = [p.chainage for p in river_data.cross_section_points]
            elevations = [p.elevation for p in river_data.cross_section_points]
            
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.metric("River Width", f"{max(chainages) - min(chainages):.1f} m")
            with col2:
                st.metric("Max Elevation", f"{max(elevations):.2f} m")
            with col3:
                st.metric("Min Elevation", f"{min(elevations):.2f} m")
            with col4:
                st.metric("Relief", f"{max(elevations) - min(elevations):.2f} m")
    
    def render_hydraulic_calculations_tab(self, river_data: RiverSectionInputSchema):
        """Render hydraulic calculations tab"""
        
        st.markdown("### 🧮 Hydraulic Calculations")
        
        if st.button("🚀 Perform Hydraulic Analysis", type="primary", use_container_width=True):
            
            # Create calculation engine
            calc_engine = HydraulicCalculationEngine(river_data)
            
            # Perform calculations
            with st.spinner("Performing hydraulic calculations..."):
                results = calc_engine.calculate_hydraulic_analysis()
            
            # Display results
            st.success("✅ Hydraulic analysis completed!")
            
            # Afflux results
            st.markdown("#### 🌊 Afflux Analysis")
            afflux_data = results['afflux']
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Yarnell Afflux", f"{afflux_data['yarnell_afflux']:.3f} m")
            with col2:
                st.metric("IRC:5 Afflux", f"{afflux_data['irc_afflux']:.3f} m")
            with col3:
                st.metric("Design Afflux", f"{afflux_data['design_afflux']:.3f} m", 
                         delta=f"{afflux_data['design_afflux'] - 0.083:.3f} m")
            
            # Waterway adequacy
            st.markdown("#### 🌉 Waterway Adequacy")
            waterway_data = results['waterway']
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Lacey Regime Width", f"{waterway_data['lacey_regime_width']:.1f} m")
            with col2:
                st.metric("Waterway Provided", f"{waterway_data['waterway_provided']:.1f} m")
            with col3:
                adequacy_ratio = waterway_data['waterway_adequacy_ratio']
                st.metric("Adequacy Ratio", f"{adequacy_ratio:.2f}", 
                         delta=f"{adequacy_ratio - 1.0:.2f}")
            
            # Status indication
            status = waterway_data['waterway_status']
            if status == "ADEQUATE":
                st.success(f"✅ Waterway Status: {status}")
            elif status == "MARGINALLY ADEQUATE":
                st.warning(f"⚠️ Waterway Status: {status}")
            else:
                st.error(f"❌ Waterway Status: {status}")
            
            # Scour analysis
            st.markdown("#### 🕳️ Scour Analysis")
            scour_data = results['scour']
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Normal Scour (Lacey)", f"{scour_data['normal_scour_lacey']:.2f} m")
            with col2:
                st.metric("Design Scour Depth", f"{scour_data['design_scour_depth']:.2f} m")
            with col3:
                st.metric("Total Scour Depth", f"{scour_data['total_scour_depth']:.2f} m")
            
            # Foundation requirements
            st.markdown("#### 🏗️ Foundation Requirements")
            foundation_depth = results['summary']['foundation_depth_required']
            stone_size = scour_data['stone_size_d50']
            
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Required Foundation Depth", f"{foundation_depth:.2f} m")
            with col2:
                st.metric("Stone Size (D50)", f"{stone_size:.3f} m")
            
            # Store results in session state
            st.session_state['hydraulic_results'] = results
            
            return results
        
        return None
