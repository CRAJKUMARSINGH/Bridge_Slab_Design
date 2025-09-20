#!/usr/bin/env python3
"""
BEAUTIFUL SLAB BRIDGE DESIGN APPLICATION
========================================

Complete professional bridge design application with:
- Beautiful modern UI using Streamlit
- 25+ comprehensive Excel sheets with all components
- One-click PDF generation (portrait/landscape A4)
- Type-1 (Battered) and Type-2 (Cantilever) abutment designs
- Integration of all existing repository components
- Professional formatting and user experience

Based ONLY on existing repository logic - NO external technical knowledge added
Maintains originality as specified in ORIGINALITY_TO_BE_MAINTAINED.MD

Author: Beautiful Bridge Design App
Version: 1.0.0 - Complete Integration
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import json
import math
import os
import tempfile
from datetime import datetime, date
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import io

# Import existing repository modules
from BridgeSlabDesigner.bridge_components import BridgeComponents
from BridgeSlabDesigner.calculation_engine import CalculationEngine
from BridgeSlabDesigner.parameter_validation import ParameterValidator
from BridgeSlabDesigner.pdf_generator import PDFGenerator
from BridgeSlabDesigner.excel_generator_75_sheets_working import ExcelGenerator75Sheets
from BridgeSlabDesigner.abutment_type_selector import AbutmentTypeSelector
from BridgeSlabDesigner.ui_components import UIComponents
from BridgeSlabDesigner.session_manager import SessionManager
from BridgeSlabDesigner.project_templates import ProjectTemplates

# Configure page
st.set_page_config(
    page_title="Beautiful Slab Bridge Design Application",
    page_icon="🌉",
    layout="wide",
    initial_sidebar_state="expanded"
)

class BeautifulSlabBridgeDesignApp:
    """
    Beautiful Slab Bridge Design Application
    Integrates all existing repository components into a cohesive, professional app
    """
    
    def __init__(self):
        # Initialize all existing repository modules
        self.session_manager = SessionManager()
        self.ui_components = UIComponents()
        self.validator = ParameterValidator()
        self.bridge_components = BridgeComponents()
        self.calculation_engine = CalculationEngine()
        self.excel_generator = ExcelGenerator75Sheets()
        self.pdf_generator = PDFGenerator()
        self.abutment_selector = AbutmentTypeSelector()
        self.project_templates = ProjectTemplates()
        
        # Initialize session state
        self.session_manager.initialize_session()
        
        # Custom styling
        self._setup_custom_styling()
    
    def _setup_custom_styling(self):
        """Setup beautiful custom styling"""
        st.markdown("""
        <style>
        /* Main app styling */
        .main-header {
            background: linear-gradient(90deg, #1f4e79 0%, #2c5aa0 50%, #365f91 100%);
            padding: 2rem;
            border-radius: 15px;
            margin-bottom: 2rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .main-title {
            color: white;
            font-size: 3rem;
            font-weight: bold;
            text-align: center;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .main-subtitle {
            color: #e8f4f8;
            font-size: 1.3rem;
            text-align: center;
            margin: 0.5rem 0 0 0;
        }
        
        /* Card styling */
        .design-card {
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 1rem;
            border-left: 5px solid #2c5aa0;
        }
        
        .metric-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #dee2e6;
        }
        
        /* Button styling */
        .stButton > button {
            background: linear-gradient(90deg, #2c5aa0 0%, #365f91 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0.5rem 1rem;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .stButton > button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(44, 90, 160, 0.3);
        }
        
        /* Progress bar styling */
        .progress-container {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 1rem;
            margin: 1rem 0;
        }
        
        /* Status indicators */
        .status-success {
            color: #28a745;
            font-weight: bold;
        }
        
        .status-warning {
            color: #ffc107;
            font-weight: bold;
        }
        
        .status-error {
            color: #dc3545;
            font-weight: bold;
        }
        </style>
        """, unsafe_allow_html=True)
    
    def run(self):
        """Main application entry point"""
        try:
            # Beautiful header
            self._render_beautiful_header()
            
            # Progress indicator
            self._render_progress_indicator()
            
            # Sidebar navigation
            self._render_sidebar()
            
            # Main content based on navigation
            page = st.session_state.get('current_page', 'project_setup')
            
            if page == 'project_setup':
                self._render_project_setup()
            elif page == 'parameters':
                self._render_parameters()
            elif page == 'abutment_design':
                self._render_abutment_design()
            elif page == 'calculations':
                self._render_calculations()
            elif page == 'results':
                self._render_results()
            elif page == 'excel_export':
                self._render_excel_export()
            elif page == 'pdf_export':
                self._render_pdf_export()
                
        except Exception as e:
            st.error(f"Application error: {str(e)}")
            st.error("Please check your inputs and try again.")
    
    def _render_beautiful_header(self):
        """Render beautiful application header"""
        st.markdown("""
        <div class="main-header">
            <h1 class="main-title">🌉 Beautiful Slab Bridge Design Application</h1>
            <p class="main-subtitle">Complete Professional Bridge Design with 25+ Excel Sheets & PDF Export</p>
        </div>
        """, unsafe_allow_html=True)
    
    def _render_progress_indicator(self):
        """Render beautiful progress indicator"""
        current_step = st.session_state.get('design_step', 1)
        total_steps = 7
        
        progress = current_step / total_steps
        
        st.markdown(f"""
        <div class="progress-container">
            <h4>Design Progress: Step {current_step} of {total_steps}</h4>
            <div style="background: #e9ecef; border-radius: 10px; height: 20px; margin: 10px 0;">
                <div style="background: linear-gradient(90deg, #2c5aa0 0%, #365f91 100%); 
                           height: 100%; width: {progress*100}%; border-radius: 10px; 
                           transition: width 0.3s ease;"></div>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    def _render_sidebar(self):
        """Render beautiful sidebar navigation"""
        with st.sidebar:
            st.markdown("### 🧭 Navigation")
            
            # Project templates section
            st.markdown("#### 📁 Reference Projects")
            if st.button("🏗️ UIT Bridges Template", use_container_width=True):
                self.project_templates.load_uit_template()
                st.success("✅ UIT Bridges template loaded!")
                st.rerun()
                
            if st.button("🌉 Chittorgarh Template", use_container_width=True):
                self.project_templates.load_chittorgarh_template()
                st.success("✅ Chittorgarh template loaded!")
                st.rerun()
                
            if st.button("🔗 Kherwara Template", use_container_width=True):
                self.project_templates.load_kherwara_template()
                st.success("✅ Kherwara template loaded!")
                st.rerun()
            
            st.divider()
            
            # Navigation menu
            st.markdown("#### 📋 Design Workflow")
            
            pages = [
                ("project_setup", "🏗️ Project Setup", "Define project information"),
                ("parameters", "⚙️ Parameters", "Input design parameters"),
                ("abutment_design", "🏛️ Abutment Design", "Select abutment type"),
                ("calculations", "🧮 Calculations", "Run design analysis"),
                ("results", "📊 Results", "View design results"),
                ("excel_export", "📈 Excel Export", "Generate 25+ sheet Excel"),
                ("pdf_export", "📄 PDF Export", "Generate PDF report")
            ]
            
            for page_key, page_name, page_desc in pages:
                if st.button(f"{page_name}\n{page_desc}", key=f"nav_{page_key}", use_container_width=True):
                    st.session_state.current_page = page_key
                    st.rerun()
            
            # Current status
            st.divider()
            st.markdown("#### 📊 Current Status")
            
            # Project info status
            project_complete = st.session_state.get('project_info_complete', False)
            status_icon = "✅" if project_complete else "⏳"
            st.write(f"{status_icon} Project Info")
            
            # Parameters status
            params_complete = st.session_state.get('parameters_validated', False)
            status_icon = "✅" if params_complete else "⏳"
            st.write(f"{status_icon} Parameters")
            
            # Abutment status
            abutment_complete = st.session_state.get('abutment_configured', False)
            status_icon = "✅" if abutment_complete else "⏳"
            st.write(f"{status_icon} Abutment Design")
            
            # Calculations status
            calc_complete = st.session_state.get('calculations_complete', False)
            status_icon = "✅" if calc_complete else "⏳"
            st.write(f"{status_icon} Calculations")
    
    def _render_project_setup(self):
        """Render beautiful project setup page"""
        st.markdown("## 🏗️ Project Setup")
        
        # Update progress
        st.session_state.design_step = 1
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("""
            <div class="design-card">
                <h3>📋 Project Information</h3>
            </div>
            """, unsafe_allow_html=True)
            
            project_name = st.text_input(
                "Bridge Name",
                value=st.session_state.get('project_name', ''),
                help="Enter the name of the bridge project",
                placeholder="e.g., UIT Police Chowki Bridge"
            )
            
            location = st.text_input(
                "Location",
                value=st.session_state.get('location', ''),
                help="Enter the project location",
                placeholder="e.g., UIT Development Area, Udaipur"
            )
            
            engineer_name = st.text_input(
                "Design Engineer",
                value=st.session_state.get('engineer_name', ''),
                help="Enter the name of the design engineer",
                placeholder="e.g., John Smith"
            )
            
            design_date = st.date_input(
                "Design Date",
                value=st.session_state.get('design_date', datetime.now().date()),
                help="Select the design date"
            )
        
        with col2:
            st.markdown("""
            <div class="design-card">
                <h3>🌉 Bridge Configuration</h3>
            </div>
            """, unsafe_allow_html=True)
            
            bridge_type = st.selectbox(
                "Bridge Type",
                ["RCC Slab Bridge", "RCC T-Beam Bridge", "PSC Bridge"],
                index=0,
                help="Select the type of bridge"
            )
            
            num_spans = st.number_input(
                "Number of Spans",
                min_value=1,
                max_value=10,
                value=st.session_state.get('num_spans', 3),
                help="Enter the number of spans"
            )
            
            effective_span = st.number_input(
                "Effective Span (m)",
                min_value=5.0,
                max_value=50.0,
                value=st.session_state.get('effective_span', 9.6),
                step=0.1,
                help="Enter the effective span in meters"
            )
            
            bridge_width = st.number_input(
                "Bridge Width (m)",
                min_value=5.0,
                max_value=30.0,
                value=st.session_state.get('bridge_width', 12.0),
                step=0.1,
                help="Enter the bridge width in meters"
            )
        
        # Save to session
        if st.button("💾 Save Project Setup", type="primary", use_container_width=True):
            st.session_state.update({
                'project_name': project_name,
                'location': location,
                'engineer_name': engineer_name,
                'design_date': design_date,
                'bridge_type': bridge_type,
                'num_spans': num_spans,
                'effective_span': effective_span,
                'bridge_width': bridge_width
            })
            st.session_state.project_info_complete = True
            st.success("✅ Project setup saved successfully!")
            st.session_state.current_page = 'parameters'
            st.rerun()
    
    def _render_parameters(self):
        """Render beautiful parameters input page"""
        st.markdown("## ⚙️ Design Parameters")
        
        # Update progress
        st.session_state.design_step = 2
        
        tabs = st.tabs(["🌊 Hydraulic", "🏗️ Structural", "🏔️ Geotechnical", "🧱 Materials"])
        
        with tabs[0]:  # Hydraulic
            self.ui_components.render_hydraulic_parameters()
            
        with tabs[1]:  # Structural
            self.ui_components.render_structural_parameters()
            
        with tabs[2]:  # Geotechnical
            self.ui_components.render_geotechnical_parameters()
            
        with tabs[3]:  # Materials
            self.ui_components.render_material_parameters()
        
        # Validation and save
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("🔍 Validate Parameters", use_container_width=True):
                validation_result = self.validator.validate_all_parameters()
                if validation_result['valid']:
                    st.success("✅ All parameters are valid!")
                else:
                    st.error("❌ Parameter validation failed:")
                    for error in validation_result['errors']:
                        st.error(f"• {error}")
        
        with col2:
            if st.button("💾 Save Parameters", type="primary", use_container_width=True):
                st.session_state.parameters_validated = True
                st.success("✅ Parameters saved successfully!")
        
        with col3:
            if st.button("➡️ Next: Abutment Design", use_container_width=True):
                st.session_state.current_page = 'abutment_design'
                st.rerun()
    
    def _render_abutment_design(self):
        """Render beautiful abutment design selection page"""
        st.markdown("## 🏛️ Abutment Design")
        
        # Update progress
        st.session_state.design_step = 3
        
        # Abutment type selection
        abutment_type = self.abutment_selector.render_type_selector()
        
        if abutment_type:
            st.session_state.abutment_type = abutment_type
            
            # Show selected abutment details
            self.abutment_selector.render_abutment_details(abutment_type)
            
            # Navigation
            col1, col2 = st.columns(2)
            with col1:
                if st.button("⬅️ Back to Parameters", use_container_width=True):
                    st.session_state.current_page = 'parameters'
                    st.rerun()
            
            with col2:
                if st.button("➡️ Next: Calculations", type="primary", use_container_width=True):
                    st.session_state.abutment_configured = True
                    st.session_state.current_page = 'calculations'
                    st.rerun()
    
    def _render_calculations(self):
        """Render beautiful calculations page"""
        st.markdown("## 🧮 Design Calculations")
        
        # Update progress
        st.session_state.design_step = 4
        
        if st.button("🚀 Run Complete Design Analysis", type="primary", use_container_width=True):
            with st.spinner("Running comprehensive bridge design analysis..."):
                try:
                    # Run calculations using existing repository logic
                    results = self.calculation_engine.run_complete_analysis()
                    
                    st.session_state.calculation_results = results
                    st.session_state.calculations_complete = True
                    st.success("✅ Design analysis completed successfully!")
                    
                    # Show summary
                    self.ui_components.render_calculation_summary(results)
                    
                except Exception as e:
                    st.error(f"Calculation error: {str(e)}")
        
        # Navigation
        if st.session_state.get('calculation_results'):
            if st.button("➡️ View Detailed Results", type="primary", use_container_width=True):
                st.session_state.current_page = 'results'
                st.rerun()
    
    def _render_results(self):
        """Render beautiful detailed results page"""
        st.markdown("## 📊 Design Results")
        
        # Update progress
        st.session_state.design_step = 5
        
        if not st.session_state.get('calculation_results'):
            st.warning("No calculation results available. Please run calculations first.")
            if st.button("⬅️ Back to Calculations", use_container_width=True):
                st.session_state.current_page = 'calculations'
                st.rerun()
            return
        
        results = st.session_state.calculation_results
        
        # Results tabs
        tabs = st.tabs(["📋 Summary", "🌊 Hydraulic", "🏗️ Structural", "🏛️ Abutments", "💰 Cost"])
        
        with tabs[0]:  # Summary
            self.ui_components.render_results_summary(results)
            
        with tabs[1]:  # Hydraulic
            self.ui_components.render_hydraulic_results(results)
            
        with tabs[2]:  # Structural
            self.ui_components.render_structural_results(results)
            
        with tabs[3]:  # Abutments
            self.ui_components.render_abutment_results(results)
            
        with tabs[4]:  # Cost
            self.ui_components.render_cost_results(results)
        
        # Navigation
        col1, col2 = st.columns(2)
        with col1:
            if st.button("📈 Generate Excel Report", type="primary", use_container_width=True):
                st.session_state.current_page = 'excel_export'
                st.rerun()
        
        with col2:
            if st.button("📄 Generate PDF Report", type="primary", use_container_width=True):
                st.session_state.current_page = 'pdf_export'
                st.rerun()
    
    def _render_excel_export(self):
        """Render beautiful Excel export page"""
        st.markdown("## 📈 Excel Report Generation")
        
        # Update progress
        st.session_state.design_step = 6
        
        if not st.session_state.get('calculation_results'):
            st.warning("No calculation results available. Please run calculations first.")
            return
        
        st.markdown("""
        <div class="design-card">
            <h3>📊 25+ Sheet Excel Report</h3>
            <p>This will generate a comprehensive Excel file with 25+ sheets covering all bridge components</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Sheet selection
        st.markdown("#### 📋 Sheet Configuration")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**Structural Sheets:**")
            sheets_structural = [
                "Project Information",
                "Hydraulic Analysis", 
                "Slab Design",
                "Pier Design",
                "Foundation Design",
                "Stability Analysis"
            ]
            for sheet in sheets_structural:
                st.checkbox(sheet, value=True, key=f"sheet_{sheet.lower().replace(' ', '_')}")
        
        with col2:
            st.markdown("**Abutment Sheets:**")
            abutment_type = st.session_state.get('abutment_type', 'Type-1')
            
            if abutment_type == 'Type-1':
                sheets_abutment = [
                    "Type-1 Abutment Geometry",
                    "Type-1 Earth Pressure",
                    "Type-1 Stability Check",
                    "Type-1 Steel Design"
                ]
            else:
                sheets_abutment = [
                    "Type-2 Abutment Geometry", 
                    "Type-2 Earth Pressure",
                    "Type-2 Stability Check",
                    "Type-2 Steel Design"
                ]
            
            for sheet in sheets_abutment:
                st.checkbox(sheet, value=True, key=f"sheet_{sheet.lower().replace(' ', '_').replace('-', '_')}")
        
        # Cost and quantity sheets
        st.markdown("**Cost & Quantity Sheets:**")
        cost_sheets = [
            "Material Quantities",
            "Cost Estimation", 
            "Abstract of Cost",
            "Detailed Estimate",
            "Bar Bending Schedule"
        ]
        
        cols = st.columns(len(cost_sheets))
        for i, sheet in enumerate(cost_sheets):
            with cols[i]:
                st.checkbox(sheet, value=True, key=f"sheet_{sheet.lower().replace(' ', '_')}")
        
        # Generation options
        st.markdown("#### ⚙️ Generation Options")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            include_formulas = st.checkbox("Include Excel Formulas", value=True)
        with col2:
            include_formatting = st.checkbox("Professional Formatting", value=True)
        with col3:
            include_charts = st.checkbox("Include Charts", value=True)
        
        # Generate Excel
        if st.button("📈 Generate 25+ Sheet Excel Report", type="primary", use_container_width=True):
            with st.spinner("Generating comprehensive Excel report..."):
                try:
                    excel_file = self.excel_generator.generate_complete_report(
                        st.session_state.calculation_results,
                        include_formulas=include_formulas,
                        include_formatting=include_formatting,
                        include_charts=include_charts
                    )
                    
                    # Download button
                    with open(excel_file, 'rb') as f:
                        st.download_button(
                            label="💾 Download Excel Report",
                            data=f.read(),
                            file_name=f"Bridge_Design_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
                            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        )
                    
                    st.success("✅ Excel report generated successfully!")
                    
                except Exception as e:
                    st.error(f"Excel generation error: {str(e)}")
    
    def _render_pdf_export(self):
        """Render beautiful PDF export page"""
        st.markdown("## 📄 PDF Report Generation")
        
        # Update progress
        st.session_state.design_step = 7
        
        if not st.session_state.get('calculation_results'):
            st.warning("No calculation results available. Please run calculations first.")
            return
        
        st.markdown("""
        <div class="design-card">
            <h3>📄 PDF Report Options</h3>
            <p>Generate professional PDF report with mixed A4 portrait/landscape layouts</p>
        </div>
        """, unsafe_allow_html=True)
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**Page Orientation:**")
            portrait_sheets = st.multiselect(
                "Portrait Pages (A4)",
                ["Cover Page", "Project Info", "Summary", "Cost Summary"],
                default=["Cover Page", "Project Info", "Summary"]
            )
        
        with col2:
            st.markdown("**Landscape Pages (A4):**")
            landscape_sheets = st.multiselect(
                "Landscape Pages (A4)",
                ["Hydraulic Analysis", "Structural Calculations", "Abutment Details", "Detailed Estimate"],
                default=["Hydraulic Analysis", "Structural Calculations"]
            )
        
        # PDF options
        st.markdown("#### 📄 PDF Options")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            include_calculations = st.checkbox("Include Detailed Calculations", value=True)
        with col2:
            include_drawings = st.checkbox("Include Drawings", value=True)  
        with col3:
            include_quantities = st.checkbox("Include Quantities", value=True)
        
        # Generate PDF
        if st.button("📄 Generate PDF Report", type="primary", use_container_width=True):
            with st.spinner("Generating PDF report with mixed orientations..."):
                try:
                    pdf_file = self.pdf_generator.generate_mixed_orientation_report(
                        st.session_state.calculation_results,
                        portrait_sheets=portrait_sheets,
                        landscape_sheets=landscape_sheets,
                        include_calculations=include_calculations,
                        include_drawings=include_drawings,
                        include_quantities=include_quantities
                    )
                    
                    # Download button
                    with open(pdf_file, 'rb') as f:
                        st.download_button(
                            label="💾 Download PDF Report",
                            data=f.read(),
                            file_name=f"Bridge_Design_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                            mime="application/pdf"
                        )
                    
                    st.success("✅ PDF report generated successfully!")
                    
                except Exception as e:
                    st.error(f"PDF generation error: {str(e)}")

def main():
    """Main application entry point"""
    app = BeautifulSlabBridgeDesignApp()
    app.run()

if __name__ == "__main__":
    main()
