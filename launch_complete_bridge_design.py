#!/usr/bin/env python3
"""
COMPLETE SLAB BRIDGE DESIGN SYSTEM LAUNCHER
Professional launcher for comprehensive bridge design applications

Features:
- Complete slab bridge design workflow
- Hydraulic analysis integration  
- Abutment design (Type-1 & Type-2)
- Professional Excel & PDF export
- Project templates from reference designs

Author: Complete Bridge Design System Launcher
Version: 5.0.0
"""

import streamlit as st
import subprocess
import sys
import os
import json
from datetime import datetime

st.set_page_config(
    page_title="Complete Bridge Design System Launcher",
    page_icon="🌉",
    layout="wide"
)

def main():
    # Professional header
    st.markdown("""
    <div style='text-align: center; padding: 2.5rem; background: linear-gradient(135deg, #1f4e79 0%, #2c5aa0 50%, #3d6db0 100%); border-radius: 15px; margin-bottom: 2rem; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);'>
        <h1 style='color: white; margin: 0; font-size: 3.8rem; font-weight: 800; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);'>🌉 Complete Slab Bridge Design System</h1>
        <p style='color: #e8f4f8; margin: 1rem 0 0 0; font-size: 1.6rem; font-weight: 400;'>Comprehensive Design • Professional Workflow • Excel & PDF Export</p>
        <div style='margin-top: 1rem; padding: 0.8rem; background: rgba(255,255,255,0.1); border-radius: 10px; display: inline-block;'>
            <span style='color: #a8d8ea; font-size: 1.3rem; font-weight: 500;'>Version 5.0.0 | Complete Integration with BridgeSlabDesigner Patterns</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # System overview
    st.markdown("### 🎯 Complete Bridge Design System Overview")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown("""
        **🏗️ Project Setup**
        - Reference templates (UIT, Chittorgarh, Kherwara)
        - Professional project configuration
        - Bridge type selection
        - Span and width configuration
        """)
    
    with col2:
        st.markdown("""
        **⚙️ Complete Parameters**
        - Hydraulic analysis parameters
        - Structural design parameters
        - Geotechnical properties
        - Material specifications
        """)
    
    with col3:
        st.markdown("""
        **🏛️ Abutment Design**
        - Type-1 Battered Abutment (UIT)
        - Type-2 Cantilever Abutment (Chittorgarh)
        - Professional configuration
        - Design validation
        """)
    
    with col4:
        st.markdown("""
        **📊 Professional Export**
        - 25-sheet Excel reports
        - Professional PDF generation
        - Mixed orientation layouts
        - Complete documentation
        """)
    
    st.divider()
    
    # Design workflow overview
    st.markdown("### 📋 Complete Design Workflow")
    
    # Workflow steps
    workflow_steps = [
        ("🏗️", "Project Setup", "Configure project info and select reference templates"),
        ("⚙️", "Parameters", "Input hydraulic, structural, geotechnical, and material parameters"),
        ("🏛️", "Abutment Design", "Select and configure Type-1 or Type-2 abutment design"),
        ("🧮", "Calculations", "Run comprehensive bridge design analysis"),
        ("📊", "Results", "Review detailed analysis results and design validation"),
        ("📈", "Excel Export", "Generate 25-sheet professional Excel reports"),
        ("📄", "PDF Export", "Generate professional PDF documentation")
    ]
    
    # Display workflow
    cols = st.columns(len(workflow_steps))
    for i, (icon, title, description) in enumerate(workflow_steps):
        with cols[i]:
            st.markdown(f"""
            <div style='text-align: center; padding: 1rem; border: 2px solid #2c5aa0; border-radius: 10px; height: 120px; display: flex; flex-direction: column; justify-content: center;'>
                <div style='font-size: 2rem; margin-bottom: 0.5rem;'>{icon}</div>
                <div style='font-weight: bold; color: #2c5aa0; margin-bottom: 0.5rem;'>{title}</div>
                <div style='font-size: 0.8rem; color: #666;'>{description}</div>
            </div>
            """, unsafe_allow_html=True)
    
    st.divider()
    
    # Application status
    st.markdown("### 📊 System Status")
    
    # Check data availability
    excel_available = os.path.exists('extracted_bridge_hydraulic_data.json')
    doc_available = os.path.exists('extracted_doc_content.json')
    explanations_available = os.path.exists('detailed_hydraulic_explanations.py')
    complete_app_available = os.path.exists('complete_slab_bridge_design.py')
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        if complete_app_available:
            st.success("✅ Complete Design System")
            st.write("Main application ready")
        else:
            st.error("❌ Complete Design System")
    
    with col2:
        if excel_available:
            st.success("✅ Hydraulic Data")
            try:
                with open('extracted_bridge_hydraulic_data.json', 'r') as f:
                    data = json.load(f)
                    st.write(f"Sheets: {len(data.get('sheets', {}))}")
            except:
                pass
        else:
            st.warning("⚠️ Hydraulic Data")
            st.write("Run excel_data_extractor.py")
    
    with col3:
        if doc_available:
            st.success("✅ Project Documentation")
            try:
                with open('extracted_doc_content.json', 'r') as f:
                    data = json.load(f)
                    overview = data.get('overview', {})
                    st.write(f"Projects: {overview.get('projects_covered', 0)}")
            except:
                pass
        else:
            st.warning("⚠️ Project Documentation")
            st.write("Run doc_content_extractor.py")
    
    with col4:
        if explanations_available:
            st.success("✅ Educational Content")
            st.write("Parameter explanations ready")
        else:
            st.warning("⚠️ Educational Content")
            st.write("Limited explanations")
    
    st.divider()
    
    # Main application launch
    st.markdown("### 🚀 Launch Complete Bridge Design System")
    
    # Primary launch section
    st.markdown("""
    <div style='padding: 2rem; background: linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; border-left: 5px solid #2c5aa0; margin-bottom: 2rem;'>
        <h3 style='color: #2c5aa0; margin-bottom: 1rem;'>🎯 Complete Slab Bridge Design Application</h3>
        <p style='margin-bottom: 1rem; font-size: 1.1rem;'>Comprehensive bridge design system with complete workflow from project setup to professional export.</p>
        
        <p><strong>✨ Key Features:</strong></p>
        <ul>
            <li><strong>Project Templates:</strong> UIT Bridges, Chittorgarh PWD, Kherwara Bridge reference designs</li>
            <li><strong>Complete Workflow:</strong> 7-step professional design process with progress tracking</li>
            <li><strong>Abutment Design:</strong> Type-1 Battered and Type-2 Cantilever abutments</li>
            <li><strong>Comprehensive Analysis:</strong> Hydraulic, structural, geotechnical, and cost analysis</li>
            <li><strong>Professional Export:</strong> 25-sheet Excel reports and mixed-orientation PDF documentation</li>
            <li><strong>Session Management:</strong> Advanced state management with auto-save functionality</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)
    
    # Launch button
    if st.button("🌉 Launch Complete Slab Bridge Design System", type="primary", use_container_width=True):
        st.success("🚀 Launching Complete Slab Bridge Design System...")
        
        st.markdown("""
        **🎯 Application Features:**
        
        ✅ **Project Setup** - Reference templates and professional configuration  
        ✅ **Parameter Input** - Comprehensive parameter management with validation  
        ✅ **Abutment Design** - Type-1 (Battered) and Type-2 (Cantilever) selection  
        ✅ **Design Calculations** - Complete structural and hydraulic analysis  
        ✅ **Results Review** - Detailed results with professional visualization  
        ✅ **Excel Export** - 25-sheet comprehensive reports with formulas  
        ✅ **PDF Export** - Professional documentation with mixed orientations  
        
        **🔄 Complete Workflow Process:**
        1. **Project Setup** → Configure project and select reference template
        2. **Parameters** → Input hydraulic, structural, geotechnical, material parameters
        3. **Abutment Design** → Select and configure abutment type
        4. **Calculations** → Run comprehensive bridge design analysis
        5. **Results** → Review detailed analysis results and validation
        6. **Excel Export** → Generate professional 25-sheet Excel reports
        7. **PDF Export** → Generate mixed-orientation PDF documentation
        """)
        
        try:
            subprocess.Popen([
                sys.executable, "-m", "streamlit", "run", 
                "complete_slab_bridge_design.py",
                "--server.headless", "false"
            ])
            st.balloons()
        except Exception as e:
            st.error(f"Error launching: {str(e)}")
            st.info("**Manual Launch:** Run `streamlit run complete_slab_bridge_design.py`")
    
    st.divider()
    
    # Alternative applications
    st.markdown("### 📚 Specialized Applications")
    
    alt_col1, alt_col2, alt_col3 = st.columns(3)
    
    with alt_col1:
        st.markdown("#### 🌊 Hydraulic Analysis Only")
        st.write("Specialized hydraulic analysis with Excel and DOC integration")
        if st.button("🌊 Launch Hydraulic System"):
            try:
                subprocess.Popen([
                    sys.executable, "-m", "streamlit", "run", 
                    "modernized_hydraulic_system.py"
                ])
                st.success("Launching Hydraulic System...")
            except:
                st.error("File not found")
    
    with alt_col2:
        st.markdown("#### 🏛️ Abutment Design Only")
        st.write("Dedicated abutment design application")
        if st.button("🏛️ Launch Abutment Designer"):
            try:
                subprocess.Popen([
                    sys.executable, "-m", "streamlit", "run", 
                    "enhanced_abutment_design_app.py"
                ])
                st.success("Launching Abutment Designer...")
            except:
                st.error("File not found")
    
    with alt_col3:
        st.markdown("#### 📖 Educational Content")
        st.write("Detailed parameter explanations and formulas")
        if st.button("📖 Launch Educational Module"):
            try:
                subprocess.Popen([
                    sys.executable, "-m", "streamlit", "run", 
                    "detailed_hydraulic_explanations.py"
                ])
                st.success("Launching Educational Module...")
            except:
                st.error("File not found")
    
    # Quick setup guide
    st.markdown("### 📋 Quick Setup Guide")
    
    with st.expander("📖 Getting Started with Complete Bridge Design", expanded=False):
        st.markdown("""
        #### 🚀 Quick Start Process
        
        **1. Data Preparation (Optional but Recommended)**
        ```bash
        # Extract hydraulic data from Excel files
        python excel_data_extractor.py
        
        # Extract documentation from DOC files  
        python doc_content_extractor.py
        ```
        
        **2. Launch Complete Design System**
        - Click "Launch Complete Slab Bridge Design System" above
        - Or run manually: `streamlit run complete_slab_bridge_design.py`
        
        **3. Complete Design Workflow**
        
        **Step 1: Project Setup**
        - Select reference template (UIT, Chittorgarh, or Kherwara)
        - Configure project information and bridge geometry
        - Save and proceed to parameters
        
        **Step 2: Parameters Input**
        - **Hydraulic:** Discharge, velocity, HFL, Manning's coefficient
        - **Structural:** Slab thickness, pier dimensions, wearing coat
        - **Geotechnical:** Bearing capacity, friction angle, soil properties
        - **Materials:** Concrete grade, steel grade, cover requirements
        
        **Step 3: Abutment Design**
        - **Type-1 Battered:** Based on UIT Bridges design (sloped stem)
        - **Type-2 Cantilever:** Based on Chittorgarh design (heel and toe)
        - Configure geometry parameters for selected type
        
        **Step 4: Design Calculations**
        - Run comprehensive analysis covering all bridge components
        - Hydraulic analysis with regime width and scour calculations
        - Structural analysis for slab, pier, and foundation design
        - Abutment stability and earth pressure analysis
        - Complete cost estimation with material quantities
        
        **Step 5: Results Review**
        - **Summary:** Project overview and design status
        - **Hydraulic:** Flow analysis, waterway adequacy, scour depth
        - **Structural:** Slab design, pier design, loads and moments
        - **Abutments:** Stability checks, earth pressures, reinforcement
        - **Cost:** Material quantities, cost breakdown, total project cost
        
        **Step 6: Excel Export**
        - Generate 25-sheet comprehensive Excel workbook
        - Professional formatting with formulas and charts
        - Sheets include: Project info, hydraulic analysis, structural design, 
          abutment details, quantities, cost estimation, and more
        
        **Step 7: PDF Export**
        - Generate professional PDF documentation
        - Mixed orientation (portrait and landscape) for optimal layout
        - Includes calculations, drawings, quantities, and specifications
        
        #### 💡 Pro Tips
        - **Start with Templates:** Use reference project templates for faster setup
        - **Progressive Workflow:** Complete each step before proceeding to next
        - **Save Frequently:** System auto-saves but manual saves recommended
        - **Review Results:** Carefully review all analysis results before export
        - **Professional Export:** Use both Excel and PDF for complete documentation
        
        #### 🔧 Technical Requirements
        - Python 3.8+ with Streamlit 1.28+
        - Required packages: pandas, numpy, plotly, openpyxl
        - 4GB RAM recommended for smooth operation
        - Modern web browser (Chrome, Firefox, Edge)
        """)
    
    # Footer
    st.markdown("""
    ---
    **Complete Slab Bridge Design System v5.0.0**  
    *Professional bridge design with comprehensive workflow and expert-level documentation*  
    *Integrated with BridgeSlabDesigner patterns for enhanced user experience*
    """)

if __name__ == "__main__":
    main()