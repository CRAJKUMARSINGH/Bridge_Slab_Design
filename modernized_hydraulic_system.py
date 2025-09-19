#!/usr/bin/env python3
"""
MODERNIZED BRIDGE HYDRAULIC DESIGN SYSTEM
Enhanced hydraulic analysis with modern UI patterns from BridgeSlabDesigner

Incorporates:
- Excel data integration (5 sheets: Afflux, Hydraulics, Deck Anchorage, Cross Section, Bed Slope)
- DOC file content analysis across all bridge projects
- Detailed parameter explanations
- Modern UI components and session management
- Professional styling and live previews

Author: Modernized Hydraulic System
Version: 4.0.0 - Updated with BridgeSlabDesigner patterns
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import json
from datetime import datetime, date
from typing import Dict, List, Any, Optional
import os
import sys

# Configure page with modern settings
st.set_page_config(
    page_title="Modernized Bridge Hydraulic System",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="expanded"
)

class HydraulicSessionManager:
    """Enhanced session management for hydraulic system"""
    
    def __init__(self):
        self.default_values = self._get_default_values()
        self.session_keys = list(self.default_values.keys())
    
    def _get_default_values(self) -> Dict[str, Any]:
        """Define default values for hydraulic parameters"""
        return {
            # Navigation
            'current_page': 'project_setup',
            
            # Project Information
            'project_name': 'Bundan River Bridge',
            'location': 'Katumbi Chandrod Road',
            'engineer_name': '',
            'design_date': datetime.now().date(),
            
            # Hydraulic Parameters (from Excel data)
            'discharge': 1265.76,
            'design_velocity': 3.5,
            'hfl': 101.2,
            'normal_water_level': 100.5,
            'afflux_value': 2.02,
            'cross_sectional_area': 436.65,
            'wetted_perimeter': 175.43,
            'bed_slope_percentage': 0.87,
            'manning_coefficient': 0.033,
            'uplift_pressure': 20.2,
            'total_uplift_force': 3272.4,
            'bridge_length': 10.8,
            'bridge_width': 15.0,
            'bed_level': 95.0,
            'water_table': 92.0,
            
            # Calculation Results
            'hydraulic_results': None,
            'detailed_explanations': None,
            'doc_analysis': None,
            
            # Application State
            'data_loaded': False,
            'calculations_complete': False,
            'explanations_generated': False,
            
            # Export Settings
            'excel_exported': False,
            'pdf_exported': False
        }
    
    def initialize_session(self):
        """Initialize session state with default values"""
        for key, default_value in self.default_values.items():
            if key not in st.session_state:
                st.session_state[key] = default_value
        
        if 'app_initialized' not in st.session_state:
            st.session_state['app_initialized'] = True
            st.session_state['session_start_time'] = datetime.now()

class HydraulicUIComponents:
    """Modern UI components for hydraulic system"""
    
    def __init__(self):
        self.component_cache = {}
    
    def render_header(self):
        """Render professional application header"""
        st.markdown("""
        <div style='text-align: center; padding: 1.5rem; background: linear-gradient(90deg, #1f4e79 0%, #2c5aa0 100%); border-radius: 10px; margin-bottom: 2rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);'>
            <h1 style='color: white; margin: 0; font-size: 2.8rem; font-weight: 700;'>🌊 Bridge Hydraulic Design System</h1>
            <p style='color: #e8f4f8; margin: 0.5rem 0 0 0; font-size: 1.3rem; font-weight: 400;'>Excel Integration • DOC Analysis • Detailed Explanations • Professional Export</p>
        </div>
        """, unsafe_allow_html=True)
    
    def render_metric_cards(self, metrics: Dict):
        """Render metrics in professional card format"""
        cols = st.columns(len(metrics))
        
        for i, (label, data) in enumerate(metrics.items()):
            with cols[i]:
                if isinstance(data, dict):
                    value = data.get('value', 'N/A')
                    delta = data.get('delta', None)
                    help_text = data.get('help', '')
                else:
                    value = data
                    delta = None
                    help_text = ''
                
                st.metric(
                    label=label,
                    value=value,
                    delta=delta,
                    help=help_text
                )
    
    def render_status_indicator(self, status: str, message: str = ""):
        """Render status indicator with appropriate styling"""
        if status.upper() in ["COMPLETED", "SUCCESS", "PASS"]:
            st.success(f"✅ {message}")
        elif status.upper() in ["FAILED", "ERROR", "FAIL"]:
            st.error(f"❌ {message}")
        elif status.upper() in ["RUNNING", "PROCESSING", "IN_PROGRESS"]:
            st.info(f"🔄 {message}")
        elif status.upper() == "WARNING":
            st.warning(f"⚠️ {message}")
        else:
            st.write(f"ℹ️ {message}")
    
    def render_progress_indicator(self, current_step: int, total_steps: int, step_name: str):
        """Render progress indicator"""
        progress = current_step / total_steps
        
        st.markdown(f"#### Step {current_step} of {total_steps}: {step_name}")
        st.progress(progress)
        
        # Step indicators
        cols = st.columns(total_steps)
        for i in range(total_steps):
            with cols[i]:
                if i < current_step:
                    st.success(f"✅ Step {i+1}")
                elif i == current_step - 1:
                    st.info(f"🔄 Step {i+1}")
                else:
                    st.write(f"⏳ Step {i+1}")

class HydraulicDataManager:
    """Manages hydraulic data from Excel and DOC files"""
    
    def __init__(self):
        self.hydraulic_data = {}
        self.doc_data = {}
        self.loaded_status = {'excel': False, 'doc': False}
    
    def load_excel_data(self):
        """Load hydraulic data from Excel files"""
        try:
            with open('extracted_bridge_hydraulic_data.json', 'r', encoding='utf-8') as f:
                self.hydraulic_data = json.load(f)
                self.loaded_status['excel'] = True
                return True
        except FileNotFoundError:
            st.warning("⚠️ Excel hydraulic data file not found. Please run excel_data_extractor.py first.")
            return False
    
    def load_doc_data(self):
        """Load DOC content analysis"""
        try:
            with open('extracted_doc_content.json', 'r', encoding='utf-8') as f:
                self.doc_data = json.load(f)
                self.loaded_status['doc'] = True
                return True
        except FileNotFoundError:
            st.warning("⚠️ DOC content file not found. Please run doc_content_extractor.py first.")
            return False
    
    def get_data_summary(self):
        """Get summary of loaded data"""
        summary = {
            'excel_loaded': self.loaded_status['excel'],
            'doc_loaded': self.loaded_status['doc'],
            'excel_sheets': len(self.hydraulic_data.get('sheets', {})) if self.loaded_status['excel'] else 0,
            'doc_projects': self.doc_data.get('overview', {}).get('projects_covered', 0) if self.loaded_status['doc'] else 0,
            'doc_files': self.doc_data.get('overview', {}).get('total_doc_files', 0) if self.loaded_status['doc'] else 0
        }
        return summary

class ModernizedHydraulicSystem:
    """Main hydraulic system application with modern patterns"""
    
    def __init__(self):
        self.session_manager = HydraulicSessionManager()
        self.ui_components = HydraulicUIComponents()
        self.data_manager = HydraulicDataManager()
        
        # Initialize session
        self.session_manager.initialize_session()
    
    def run(self):
        """Main application entry point"""
        try:
            # Header
            self.ui_components.render_header()
            
            # Sidebar navigation
            self.render_sidebar()
            
            # Main content based on navigation
            page = st.session_state.get('current_page', 'project_setup')
            
            if page == 'project_setup':
                self.render_project_setup()
            elif page == 'data_loading':
                self.render_data_loading()
            elif page == 'hydraulic_analysis':
                self.render_hydraulic_analysis()
            elif page == 'detailed_explanations':
                self.render_detailed_explanations()
            elif page == 'doc_analysis':
                self.render_doc_analysis()
            elif page == 'export_reports':
                self.render_export_reports()
            
        except Exception as e:
            st.error(f"Application error: {str(e)}")
            st.error("Please check your inputs and try again.")
    
    def render_sidebar(self):
        """Render sidebar navigation"""
        with st.sidebar:
            st.title("🌊 Navigation")
            
            # Data status
            self.render_data_status()
            
            st.divider()
            
            # Navigation menu
            st.subheader("📋 Hydraulic Workflow")
            
            pages = [
                ("project_setup", "🏗️ Project Setup"),
                ("data_loading", "📁 Data Loading"),
                ("hydraulic_analysis", "🌊 Hydraulic Analysis"),
                ("detailed_explanations", "📖 Detailed Explanations"),
                ("doc_analysis", "📄 Document Analysis"),
                ("export_reports", "📊 Export Reports")
            ]
            
            for page_key, page_name in pages:
                if st.button(page_name, key=f"nav_{page_key}"):
                    st.session_state.current_page = page_key
                    st.rerun()
    
    def render_data_status(self):
        """Render data loading status in sidebar"""
        st.subheader("📊 Data Status")
        
        summary = self.data_manager.get_data_summary()
        
        # Excel data status
        if summary['excel_loaded']:
            st.success(f"✅ Excel Data ({summary['excel_sheets']} sheets)")
        else:
            st.error("❌ Excel Data")
        
        # DOC data status
        if summary['doc_loaded']:
            st.success(f"✅ DOC Data ({summary['doc_files']} files)")
        else:
            st.error("❌ DOC Data")
    
    def render_project_setup(self):
        """Render project setup page"""
        st.title("🏗️ Project Setup")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Project Information")
            
            project_name = st.text_input(
                "Bridge Name",
                value=st.session_state.get('project_name', ''),
                help="Enter the name of the bridge project"
            )
            
            location = st.text_input(
                "Location",
                value=st.session_state.get('location', ''),
                help="Enter the project location"
            )
            
            engineer_name = st.text_input(
                "Design Engineer",
                value=st.session_state.get('engineer_name', ''),
                help="Enter the name of the design engineer"
            )
            
            design_date = st.date_input(
                "Design Date",
                value=st.session_state.get('design_date', datetime.now().date()),
                help="Select the design date"
            )
        
        with col2:
            st.subheader("Analysis Configuration")
            
            st.markdown("""
            **This hydraulic system provides:**
            
            🌊 **Comprehensive Hydraulic Analysis**
            - Excel data integration (5 sheets)
            - Discharge and velocity calculations
            - Afflux and scour analysis
            - Cross-sectional properties
            
            📄 **Document Integration**
            - Analysis of all project DOC files
            - Design notes and specifications
            - Cross-validation with calculations
            
            📖 **Detailed Explanations**
            - Line-by-line parameter explanations
            - Formula derivations and references
            - Interactive educational content
            
            📊 **Professional Export**
            - Excel reports with calculations
            - PDF reports with A4 layouts
            - Professional documentation
            """)
        
        # Save project setup
        if st.button("💾 Save Project Setup", type="primary"):
            st.session_state.update({
                'project_name': project_name,
                'location': location,
                'engineer_name': engineer_name,
                'design_date': design_date
            })
            st.success("Project setup saved successfully!")
            st.session_state.current_page = 'data_loading'
            st.rerun()
    
    def render_data_loading(self):
        """Render data loading page"""
        st.title("📁 Data Loading & Validation")
        
        # Data loading status
        summary = self.data_manager.get_data_summary()
        
        # Progress indicator
        loaded_count = sum([summary['excel_loaded'], summary['doc_loaded']])
        self.ui_components.render_progress_indicator(loaded_count, 2, "Data Loading")
        
        st.divider()
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📈 Excel Data Loading")
            
            if st.button("🔄 Load Excel Hydraulic Data", type="primary"):
                with st.spinner("Loading Excel data..."):
                    success = self.data_manager.load_excel_data()
                    if success:
                        st.success("✅ Excel data loaded successfully!")
                        # Show data summary
                        if self.data_manager.hydraulic_data:
                            sheets = self.data_manager.hydraulic_data.get('sheets', {})
                            st.write(f"**Loaded {len(sheets)} sheets:**")
                            for sheet_name in sheets.keys():
                                st.write(f"• {sheet_name}")
                        st.rerun()
            
            if summary['excel_loaded']:
                self.ui_components.render_status_indicator("SUCCESS", f"Excel data loaded ({summary['excel_sheets']} sheets)")
        
        with col2:
            st.subheader("📄 DOC Content Loading")
            
            if st.button("🔄 Load DOC Analysis", type="primary"):
                with st.spinner("Loading DOC content..."):
                    success = self.data_manager.load_doc_data()
                    if success:
                        st.success("✅ DOC data loaded successfully!")
                        # Show data summary
                        if self.data_manager.doc_data:
                            overview = self.data_manager.doc_data.get('overview', {})
                            st.write(f"**Loaded:**")
                            st.write(f"• {overview.get('total_doc_files', 0)} DOC files")
                            st.write(f"• {overview.get('projects_covered', 0)} projects")
                            st.write(f"• {overview.get('total_size_mb', 0):.1f} MB total")
                        st.rerun()
            
            if summary['doc_loaded']:
                self.ui_components.render_status_indicator("SUCCESS", f"DOC data loaded ({summary['doc_files']} files)")
        
        # Navigation
        if summary['excel_loaded'] and summary['doc_loaded']:
            st.divider()
            st.success("🎉 All data loaded successfully!")
            
            if st.button("➡️ Proceed to Hydraulic Analysis", type="primary"):
                st.session_state.current_page = 'hydraulic_analysis'
                st.rerun()
    
    def render_hydraulic_analysis(self):
        """Render hydraulic analysis page"""
        st.title("🌊 Hydraulic Analysis")
        
        # Check if data is loaded
        if not self.data_manager.loaded_status['excel']:
            st.warning("Please load Excel data first.")
            return
        
        # Key parameters from Excel
        hydraulic_data = self.data_manager.hydraulic_data.get('sheets', {})
        
        # Display key metrics
        st.subheader("📊 Key Hydraulic Parameters")
        
        # Extract parameters from different sheets
        afflux_data = hydraulic_data.get('Afflux Calculation', {})
        hydraulics_data = hydraulic_data.get('HYDRAULICS', {})
        cross_section_data = hydraulic_data.get('CROSS SECTION', {})
        
        # Create metrics
        metrics = {
            'Discharge': {
                'value': f"{st.session_state.get('discharge', 1265.76)} cumecs",
                'help': 'Design discharge for hydraulic analysis'
            },
            'HFL': {
                'value': f"{st.session_state.get('hfl', 101.2)} m",
                'help': 'High Flood Level above datum'
            },
            'Afflux': {
                'value': f"{st.session_state.get('afflux_value', 2.02)} m",
                'help': 'Rise in water level due to bridge obstruction'
            },
            'Cross Area': {
                'value': f"{st.session_state.get('cross_sectional_area', 436.65)} m²",
                'help': 'Cross-sectional area of waterway'
            }
        }
        
        self.ui_components.render_metric_cards(metrics)
        
        st.divider()
        
        # Hydraulic calculations
        st.subheader("🧮 Hydraulic Calculations")
        
        tabs = st.tabs(["💧 Flow Analysis", "🌊 Afflux Calculation", "📐 Cross Section", "⛰️ Bed Slope"])
        
        with tabs[0]:  # Flow Analysis
            self.render_flow_analysis()
        
        with tabs[1]:  # Afflux Calculation
            self.render_afflux_analysis()
        
        with tabs[2]:  # Cross Section
            self.render_cross_section_analysis()
        
        with tabs[3]:  # Bed Slope
            self.render_bed_slope_analysis()
        
        # Navigation
        col1, col2 = st.columns(2)
        with col1:
            if st.button("📖 View Detailed Explanations"):
                st.session_state.current_page = 'detailed_explanations'
                st.rerun()
        
        with col2:
            if st.button("📄 Analyze Documents"):
                st.session_state.current_page = 'doc_analysis'
                st.rerun()
    
    def render_flow_analysis(self):
        """Render flow analysis section"""
        st.markdown("### 💧 Flow Analysis")
        
        # Parameters
        discharge = st.session_state.get('discharge', 1265.76)
        velocity = st.session_state.get('design_velocity', 3.5)
        area = st.session_state.get('cross_sectional_area', 436.65)
        
        # Live calculations
        calculated_velocity = discharge / area if area > 0 else 0
        froude_number = velocity / np.sqrt(9.81 * (area / st.session_state.get('wetted_perimeter', 175.43)))
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Design Velocity", f"{velocity:.2f} m/s")
            st.metric("Calculated Velocity", f"{calculated_velocity:.2f} m/s")
        
        with col2:
            st.metric("Froude Number", f"{froude_number:.3f}")
            flow_type = "Supercritical" if froude_number > 1 else "Subcritical"
            st.metric("Flow Type", flow_type)
        
        with col3:
            st.metric("Manning's n", f"{st.session_state.get('manning_coefficient', 0.033):.3f}")
            st.metric("Bed Slope", f"{st.session_state.get('bed_slope_percentage', 0.87):.2f}%")
        
        # Velocity distribution chart
        fig = go.Figure()
        
        # Simulate velocity profile
        depths = np.linspace(0, 6, 20)
        velocities = velocity * (1 - (depths / 6)**0.2)  # Power law approximation
        
        fig.add_trace(go.Scatter(
            x=velocities,
            y=depths,
            mode='lines+markers',
            name='Velocity Profile',
            line=dict(color='blue', width=3),
            marker=dict(size=6)
        ))
        
        fig.update_layout(
            title="Velocity Distribution Profile",
            xaxis_title="Velocity (m/s)",
            yaxis_title="Depth from Surface (m)",
            template='plotly_white',
            height=400
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    def render_afflux_analysis(self):
        """Render afflux analysis section"""
        st.markdown("### 🌊 Afflux Analysis")
        
        # Afflux parameters
        afflux = st.session_state.get('afflux_value', 2.02)
        normal_wl = st.session_state.get('normal_water_level', 100.5)
        hfl = st.session_state.get('hfl', 101.2)
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### 📊 Afflux Parameters")
            
            st.metric("Normal Water Level", f"{normal_wl} m")
            st.metric("Afflux Value", f"{afflux} m")
            st.metric("High Flood Level", f"{hfl} m")
            st.metric("Total Rise", f"{hfl - normal_wl:.2f} m")
        
        with col2:
            # Afflux visualization
            fig = go.Figure()
            
            # Water levels
            levels = ['Normal WL', 'With Afflux', 'HFL']
            elevations = [normal_wl, normal_wl + afflux, hfl]
            colors = ['blue', 'orange', 'red']
            
            fig.add_trace(go.Bar(
                x=levels,
                y=elevations,
                marker_color=colors,
                text=[f"{el:.2f} m" for el in elevations],
                textposition='auto'
            ))
            
            fig.update_layout(
                title="Water Level Analysis",
                yaxis_title="Elevation (m)",
                template='plotly_white',
                height=400
            )
            
            st.plotly_chart(fig, use_container_width=True)
    
    def render_cross_section_analysis(self):
        """Render cross section analysis section"""
        st.markdown("### 📐 Cross Section Analysis")
        
        # Cross section parameters
        area = st.session_state.get('cross_sectional_area', 436.65)
        perimeter = st.session_state.get('wetted_perimeter', 175.43)
        bridge_width = st.session_state.get('bridge_width', 15.0)
        bridge_length = st.session_state.get('bridge_length', 10.8)
        
        # Hydraulic radius
        hydraulic_radius = area / perimeter if perimeter > 0 else 0
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### 📊 Section Properties")
            
            st.metric("Cross-sectional Area", f"{area:.2f} m²")
            st.metric("Wetted Perimeter", f"{perimeter:.2f} m")
            st.metric("Hydraulic Radius", f"{hydraulic_radius:.3f} m")
            st.metric("Bridge Waterway", f"{bridge_width:.1f} m × {bridge_length:.1f} m")
        
        with col2:
            # Cross section visualization (simplified)
            fig = go.Figure()
            
            # River cross section (trapezoidal approximation)
            x_coords = [-bridge_width/2, -bridge_width/4, bridge_width/4, bridge_width/2]
            y_coords = [0, -3, -3, 0]  # Simplified profile
            
            fig.add_trace(go.Scatter(
                x=x_coords + [x_coords[0]],  # Close the shape
                y=y_coords + [y_coords[0]],
                fill='toself',
                fillcolor='lightblue',
                line=dict(color='blue', width=2),
                name='River Cross Section'
            ))
            
            # Bridge deck
            bridge_x = [-bridge_width/2, bridge_width/2]
            bridge_y = [2, 2]
            
            fig.add_trace(go.Scatter(
                x=bridge_x,
                y=bridge_y,
                mode='lines',
                line=dict(color='black', width=8),
                name='Bridge Deck'
            ))
            
            fig.update_layout(
                title="River Cross Section with Bridge",
                xaxis_title="Width (m)",
                yaxis_title="Elevation (m)",
                template='plotly_white',
                height=400,
                showlegend=True
            )
            
            st.plotly_chart(fig, use_container_width=True)
    
    def render_bed_slope_analysis(self):
        """Render bed slope analysis section"""
        st.markdown("### ⛰️ Bed Slope Analysis")
        
        # Bed slope parameters
        bed_slope = st.session_state.get('bed_slope_percentage', 0.87)
        bed_level = st.session_state.get('bed_level', 95.0)
        bridge_length = st.session_state.get('bridge_length', 10.8)
        
        # Calculate longitudinal profile
        upstream_level = bed_level + (bridge_length / 2) * (bed_slope / 100)
        downstream_level = bed_level - (bridge_length / 2) * (bed_slope / 100)
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### 📊 Slope Parameters")
            
            st.metric("Bed Slope", f"{bed_slope:.2f}%")
            st.metric("Bed Level at Bridge", f"{bed_level:.2f} m")
            st.metric("Upstream Bed Level", f"{upstream_level:.2f} m")
            st.metric("Downstream Bed Level", f"{downstream_level:.2f} m")
            st.metric("Total Drop", f"{upstream_level - downstream_level:.3f} m")
        
        with col2:
            # Longitudinal profile
            fig = go.Figure()
            
            # Bed profile
            chainage = np.linspace(-50, 50, 100)  # 100m total
            bed_profile = bed_level + chainage * (bed_slope / 100)
            
            fig.add_trace(go.Scatter(
                x=chainage,
                y=bed_profile,
                mode='lines',
                line=dict(color='brown', width=3),
                name='Bed Profile'
            ))
            
            # Bridge location
            fig.add_vline(x=0, line_dash="dash", line_color="red", 
                         annotation_text="Bridge Location")
            
            fig.update_layout(
                title="Longitudinal Bed Profile",
                xaxis_title="Chainage (m)",
                yaxis_title="Bed Level (m)",
                template='plotly_white',
                height=400
            )
            
            st.plotly_chart(fig, use_container_width=True)
    
    def render_detailed_explanations(self):
        """Render detailed parameter explanations page"""
        st.title("📖 Detailed Hydraulic Explanations")
        
        # Import and use detailed explanations module
        try:
            from detailed_hydraulic_explanations import DetailedHydraulicExplanations
            
            explanations = DetailedHydraulicExplanations()
            
            st.markdown("""
            ### 🎓 Educational Content
            
            This section provides comprehensive line-by-line explanations of all hydraulic parameters,
            exactly as calculated in the Excel sheets, with formula derivations and IRC references.
            """)
            
            # Explanation categories
            explanation_tabs = st.tabs([
                "💧 Discharge Calculation", 
                "🌊 Afflux Analysis", 
                "🌊 Waterway Calculation", 
                "⛏️ Scour Analysis",
                "⚓ Deck Anchorage"
            ])
            
            with explanation_tabs[0]:
                explanations.create_discharge_calculation_explanation()
            
            with explanation_tabs[1]:
                explanations.create_afflux_calculation_explanation()
            
            with explanation_tabs[2]:
                explanations.create_waterway_calculation_explanation()
            
            with explanation_tabs[3]:
                explanations.create_scour_calculation_explanation()
            
            with explanation_tabs[4]:
                explanations.create_deck_anchorage_explanation()
                
        except ImportError:
            st.warning("⚠️ Detailed explanations module not found. Please ensure detailed_hydraulic_explanations.py is available.")
            
            # Fallback basic explanations
            st.markdown("""
            #### Basic Hydraulic Formulas
            
            **Discharge Calculation:**
            ```
            Q = A × V
            where:
            Q = Discharge (cumecs)
            A = Cross-sectional area (m²)
            V = Average velocity (m/s)
            ```
            
            **Manning's Formula:**
            ```
            V = (1/n) × R^(2/3) × S^(1/2)
            where:
            V = Velocity (m/s)
            n = Manning's roughness coefficient
            R = Hydraulic radius (m)
            S = Bed slope
            ```
            
            **Afflux Calculation:**
            ```
            Afflux = (V²)/(2g) × Coefficient
            where:
            V = Design velocity
            g = Acceleration due to gravity (9.81 m/s²)
            ```
            """)
        
        # Navigation
        if st.button("📄 Analyze Documents"):
            st.session_state.current_page = 'doc_analysis'
            st.rerun()
    
    def render_doc_analysis(self):
        """Render document analysis page"""
        st.title("📄 Document Analysis")
        
        if not self.data_manager.loaded_status['doc']:
            st.warning("Please load DOC data first.")
            return
        
        doc_data = self.data_manager.doc_data
        
        # Overview metrics
        st.subheader("📊 Document Overview")
        
        overview = doc_data.get('overview', {})
        
        metrics = {
            'Total Documents': {
                'value': overview.get('total_doc_files', 0),
                'help': 'Total DOC files analyzed across all projects'
            },
            'Projects Covered': {
                'value': overview.get('projects_covered', 0),
                'help': 'Number of bridge projects included'
            },
            'Total Size': {
                'value': f"{overview.get('total_size_mb', 0):.1f} MB",
                'help': 'Combined size of all analyzed documents'
            },
            'Document Types': {
                'value': overview.get('document_types', 0),
                'help': 'Different types of documents found'
            }
        }
        
        self.ui_components.render_metric_cards(metrics)
        
        st.divider()
        
        # Document analysis tabs
        doc_tabs = st.tabs(["📊 Project Breakdown", "📄 Document Types", "🔍 Content Analysis"])
        
        with doc_tabs[0]:  # Project Breakdown
            self.render_project_breakdown()
        
        with doc_tabs[1]:  # Document Types
            self.render_document_types()
        
        with doc_tabs[2]:  # Content Analysis
            self.render_content_analysis()
        
        # Navigation
        if st.button("📊 Generate Reports"):
            st.session_state.current_page = 'export_reports'
            st.rerun()
    
    def render_project_breakdown(self):
        """Render project breakdown analysis"""
        st.markdown("### 📊 Project Breakdown")
        
        project_data = self.data_manager.doc_data.get('project_breakdown', {})
        
        if not project_data:
            st.warning("No project breakdown data available.")
            return
        
        # Create visualization
        projects = list(project_data.keys())
        file_counts = [data['file_count'] for data in project_data.values()]
        sizes_kb = [data['total_size_kb'] for data in project_data.values()]
        
        # Project distribution chart
        fig = make_subplots(
            rows=2, cols=1,
            subplot_titles=('Document Count by Project', 'Document Size by Project (KB)'),
            vertical_spacing=0.15
        )
        
        # File count chart
        fig.add_trace(
            go.Bar(
                x=projects,
                y=file_counts,
                name='File Count',
                marker_color='lightblue',
                text=file_counts,
                textposition='auto'
            ),
            row=1, col=1
        )
        
        # Size chart
        fig.add_trace(
            go.Bar(
                x=projects,
                y=sizes_kb,
                name='Size (KB)',
                marker_color='lightcoral',
                text=[f"{size:.0f}" for size in sizes_kb],
                textposition='auto'
            ),
            row=2, col=1
        )
        
        fig.update_layout(
            title="Document Distribution Across Bridge Projects",
            height=600,
            showlegend=False,
            template='plotly_white'
        )
        
        fig.update_xaxes(tickangle=45)
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Project details table
        st.markdown("#### 📋 Project Details")
        
        project_details = []
        for project, data in project_data.items():
            project_details.append({
                'Project': project,
                'File Count': data['file_count'],
                'Total Size (KB)': f"{data['total_size_kb']:.1f}",
                'Avg Size (KB)': f"{data['total_size_kb']/data['file_count']:.1f}" if data['file_count'] > 0 else "0"
            })
        
        df = pd.DataFrame(project_details)
        st.dataframe(df, use_container_width=True)
    
    def render_document_types(self):
        """Render document types analysis"""
        st.markdown("### 📄 Document Types Analysis")
        
        content_types = self.data_manager.doc_data.get('content_types', {})
        
        if not content_types:
            st.warning("No document type data available.")
            return
        
        # Document type distribution
        doc_types = list(content_types.keys())
        counts = [data['count'] for data in content_types.values()]
        
        # Pie chart
        fig = go.Figure(data=[
            go.Pie(
                labels=doc_types,
                values=counts,
                hole=0.3,
                textinfo='label+percent+value',
                hovertemplate='%{label}<br>Count: %{value}<br>Percentage: %{percent}<extra></extra>'
            )
        ])
        
        fig.update_layout(
            title="Distribution of Document Types",
            height=500,
            template='plotly_white'
        )
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Document type details
        st.markdown("#### 📋 Document Type Details")
        
        type_details = []
        for doc_type, data in content_types.items():
            type_details.append({
                'Document Type': doc_type,
                'Count': data['count'],
                'Percentage': f"{(data['count']/sum(counts)*100):.1f}%"
            })
        
        df = pd.DataFrame(type_details)
        st.dataframe(df, use_container_width=True)
    
    def render_content_analysis(self):
        """Render content analysis section"""
        st.markdown("### 🔍 Content Analysis")
        
        detailed_content = self.data_manager.doc_data.get('detailed_content', {})
        
        if not detailed_content:
            st.warning("No detailed content data available.")
            return
        
        # Project selection for detailed view
        by_project = detailed_content.get('by_project', {})
        
        if by_project:
            selected_project = st.selectbox(
                "Select Project for Detailed Analysis",
                list(by_project.keys())
            )
            
            if selected_project:
                project_docs = by_project[selected_project]
                
                st.markdown(f"#### 📁 Documents for {selected_project}")
                
                # Create DataFrame for better display
                doc_details = []
                for doc in project_docs:
                    doc_details.append({
                        'Filename': doc['filename'],
                        'Type': doc['file_type'],
                        'Size (KB)': f"{doc['size_kb']:.1f}",
                        'Content Preview': doc.get('content_preview', 'N/A')[:100] + '...' if doc.get('content_preview') else 'N/A'
                    })
                
                df = pd.DataFrame(doc_details)
                st.dataframe(df, use_container_width=True)
                
                # Content analysis for selected project
                if st.button(f"📖 Analyze Content for {selected_project}"):
                    with st.expander("📄 Document Content Details", expanded=True):
                        for doc in project_docs:
                            st.markdown(f"**{doc['filename']}**")
                            st.write(f"Type: {doc['file_type']} | Size: {doc['size_kb']:.1f} KB")
                            
                            if doc.get('content_preview'):
                                st.markdown("*Content Preview:*")
                                st.text(doc['content_preview'][:500] + "..." if len(doc['content_preview']) > 500 else doc['content_preview'])
                            
                            st.divider()
    
    def render_export_reports(self):
        """Render export reports page"""
        st.title("📊 Export Reports")
        
        # Check if calculations are complete
        if not self.data_manager.loaded_status['excel']:
            st.warning("Please complete hydraulic analysis first.")
            return
        
        st.markdown("""
        ### 🎯 Report Generation Options
        
        Generate comprehensive reports with:
        - Complete hydraulic calculations
        - Document analysis integration
        - Professional A4 layouts
        - Excel and PDF formats
        """)
        
        # Report configuration
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📈 Excel Report")
            
            excel_options = {
                'include_calculations': st.checkbox("Include Detailed Calculations", value=True),
                'include_charts': st.checkbox("Include Charts and Graphs", value=True),
                'include_doc_analysis': st.checkbox("Include Document Analysis", value=True),
                'include_explanations': st.checkbox("Include Parameter Explanations", value=True)
            }
            
            if st.button("📈 Generate Excel Report", type="primary"):
                with st.spinner("Generating Excel report..."):
                    # Generate Excel report
                    try:
                        report_data = self._prepare_report_data()
                        excel_file = self._generate_excel_report(report_data, excel_options)
                        
                        if excel_file:
                            st.success("✅ Excel report generated successfully!")
                            
                            # Download button
                            with open(excel_file, 'rb') as f:
                                st.download_button(
                                    label="💾 Download Excel Report",
                                    data=f.read(),
                                    file_name=f"Hydraulic_Analysis_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
                                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                )
                    except Exception as e:
                        st.error(f"Error generating Excel report: {str(e)}")
        
        with col2:
            st.subheader("📄 PDF Report")
            
            pdf_options = {
                'orientation': st.selectbox("Page Orientation", ["Portrait", "Landscape", "Mixed"], index=2),
                'include_cover': st.checkbox("Include Cover Page", value=True),
                'include_summary': st.checkbox("Include Executive Summary", value=True),
                'include_detailed': st.checkbox("Include Detailed Analysis", value=True)
            }
            
            if st.button("📄 Generate PDF Report", type="primary"):
                with st.spinner("Generating PDF report..."):
                    # Generate PDF report
                    try:
                        report_data = self._prepare_report_data()
                        pdf_file = self._generate_pdf_report(report_data, pdf_options)
                        
                        if pdf_file:
                            st.success("✅ PDF report generated successfully!")
                            
                            # Download button
                            with open(pdf_file, 'rb') as f:
                                st.download_button(
                                    label="💾 Download PDF Report",
                                    data=f.read(),
                                    file_name=f"Hydraulic_Analysis_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                                    mime="application/pdf"
                                )
                    except Exception as e:
                        st.error(f"Error generating PDF report: {str(e)}")
        
        # Report summary
        st.divider()
        
        st.subheader("📋 Report Content Summary")
        
        summary_data = {
            'Section': [
                'Project Information',
                'Hydraulic Analysis', 
                'Excel Data Integration',
                'Document Analysis',
                'Detailed Explanations',
                'Charts and Visualizations'
            ],
            'Excel': ['✅', '✅', '✅', '✅', '✅', '✅'],
            'PDF': ['✅', '✅', '✅', '✅', '✅', '✅'],
            'Description': [
                'Project details and configuration',
                'Complete hydraulic calculations and results',
                'All 5 Excel sheets (Afflux, Hydraulics, etc.)',
                'DOC file content analysis across projects',
                'Line-by-line parameter explanations',
                'Professional charts, graphs, and diagrams'
            ]
        }
        
        df = pd.DataFrame(summary_data)
        st.dataframe(df, use_container_width=True)
    
    def _prepare_report_data(self):
        """Prepare data for report generation"""
        return {
            'project_info': {
                'name': st.session_state.get('project_name', ''),
                'location': st.session_state.get('location', ''),
                'engineer': st.session_state.get('engineer_name', ''),
                'date': st.session_state.get('design_date', datetime.now().date())
            },
            'hydraulic_data': self.data_manager.hydraulic_data,
            'doc_data': self.data_manager.doc_data,
            'parameters': {
                'discharge': st.session_state.get('discharge'),
                'hfl': st.session_state.get('hfl'),
                'afflux': st.session_state.get('afflux_value'),
                'area': st.session_state.get('cross_sectional_area'),
                'velocity': st.session_state.get('design_velocity')
            }
        }
    
    def _generate_excel_report(self, data: Dict, options: Dict) -> Optional[str]:
        """Generate Excel report (placeholder)"""
        # This would integrate with existing Excel generation logic
        st.info("Excel report generation would be implemented here using existing Excel generator.")
        return None
    
    def _generate_pdf_report(self, data: Dict, options: Dict) -> Optional[str]:
        """Generate PDF report (placeholder)"""
        # This would integrate with existing PDF generation logic
        st.info("PDF report generation would be implemented here using existing PDF generator.")
        return None

def main():
    """Main application entry point"""
    app = ModernizedHydraulicSystem()
    app.run()

if __name__ == "__main__":
    main()