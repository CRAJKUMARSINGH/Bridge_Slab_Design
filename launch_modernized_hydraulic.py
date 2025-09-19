#!/usr/bin/env python3
"""
Simple Launcher for Modernized Hydraulic System
Launches the updated hydraulic application with BridgeSlabDesigner patterns

Author: Hydraulic System Launcher
Version: 1.0.0
"""

import streamlit as st
import subprocess
import sys
import os
import json
from datetime import datetime

st.set_page_config(
    page_title="Modernized Hydraulic System Launcher",
    page_icon="🌊",
    layout="wide"
)

def main():
    # Header
    st.markdown("""
    <div style='text-align: center; padding: 2rem; background: linear-gradient(90deg, #1f4e79 0%, #2c5aa0 100%); border-radius: 10px; margin-bottom: 2rem;'>
        <h1 style='color: white; margin: 0; font-size: 2.5rem;'>🌊 Modernized Hydraulic System</h1>
        <p style='color: #e8f4f8; margin: 0.5rem 0 0 0; font-size: 1.2rem;'>Version 4.0.0 - Updated with BridgeSlabDesigner Patterns</p>
    </div>
    """, unsafe_allow_html=True)
    
    # System overview
    st.markdown("### 🎯 System Overview")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        **🌊 Hydraulic Analysis**
        - Excel data integration (5 sheets)
        - Real-time calculations
        - Professional visualizations
        - Live parameter preview
        """)
    
    with col2:
        st.markdown("""
        **📄 Document Integration**
        - DOC file analysis
        - Cross-validation
        - Content extraction
        - Project documentation
        """)
    
    with col3:
        st.markdown("""
        **📖 Educational Content**
        - Detailed explanations
        - Formula derivations
        - IRC references
        - Step-by-step guides
        """)
    
    st.divider()
    
    # Data status check
    st.markdown("### 📊 Data Status")
    
    excel_available = os.path.exists('extracted_bridge_hydraulic_data.json')
    doc_available = os.path.exists('extracted_doc_content.json')
    explanations_available = os.path.exists('detailed_hydraulic_explanations.py')
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if excel_available:
            st.success("✅ Excel Data Available")
            try:
                with open('extracted_bridge_hydraulic_data.json', 'r') as f:
                    excel_data = json.load(f)
                    st.write(f"Sheets: {len(excel_data.get('sheets', {}))}")
            except:
                pass
        else:
            st.error("❌ Excel Data Missing")
            st.write("Run: `python excel_data_extractor.py`")
    
    with col2:
        if doc_available:
            st.success("✅ DOC Data Available")
            try:
                with open('extracted_doc_content.json', 'r') as f:
                    doc_data = json.load(f)
                    overview = doc_data.get('overview', {})
                    st.write(f"Files: {overview.get('total_doc_files', 0)}")
                    st.write(f"Projects: {overview.get('projects_covered', 0)}")
            except:
                pass
        else:
            st.error("❌ DOC Data Missing")
            st.write("Run: `python doc_content_extractor.py`")
    
    with col3:
        if explanations_available:
            st.success("✅ Explanations Available")
            st.write("Educational module ready")
        else:
            st.warning("⚠️ Limited Explanations")
            st.write("Basic mode available")
    
    st.divider()
    
    # Launch section
    st.markdown("### 🚀 Launch Application")
    
    # Main launch button
    if st.button("🌊 Launch Modernized Hydraulic System", type="primary", use_container_width=True):
        st.success("🚀 Launching Modernized Hydraulic System...")
        
        # Launch instructions
        st.markdown("""
        **Application Starting...**
        
        The modernized hydraulic system will open in a new browser tab with:
        - Modern UI components from BridgeSlabDesigner
        - Professional styling and interactions
        - Live calculation previews
        - Enhanced data management
        
        **Features:**
        ✅ Project setup and configuration
        ✅ Data loading and validation  
        ✅ Comprehensive hydraulic analysis
        ✅ Detailed parameter explanations
        ✅ Document analysis integration
        ✅ Professional report export
        """)
        
        try:
            # Launch the modernized system
            subprocess.Popen([
                sys.executable, "-m", "streamlit", "run", 
                "modernized_hydraulic_system.py",
                "--server.headless", "false"
            ])
            st.balloons()
        except Exception as e:
            st.error(f"Error launching: {str(e)}")
            st.info("**Manual Launch:** Run `streamlit run modernized_hydraulic_system.py`")
    
    st.divider()
    
    # Alternative applications
    st.markdown("### 📚 Alternative Applications")
    
    alt_col1, alt_col2 = st.columns(2)
    
    with alt_col1:
        if st.button("📄 Enhanced System with Documents"):
            try:
                subprocess.Popen([
                    sys.executable, "-m", "streamlit", "run", 
                    "enhanced_hydraulic_with_docs.py"
                ])
                st.success("Launching Enhanced System...")
            except:
                st.error("File not found")
    
    with alt_col2:
        if st.button("📖 Detailed Explanations Module"):
            try:
                subprocess.Popen([
                    sys.executable, "-m", "streamlit", "run", 
                    "detailed_hydraulic_explanations.py"
                ])
                st.success("Launching Explanations Module...")
            except:
                st.error("File not found")
    
    # Instructions
    st.markdown("### 📋 Quick Start Guide")
    
    with st.expander("📖 Getting Started", expanded=False):
        st.markdown("""
        #### 1. Prepare Data (if not done)
        ```bash
        # Extract Excel data
        python excel_data_extractor.py
        
        # Extract DOC content  
        python doc_content_extractor.py
        ```
        
        #### 2. Launch Application
        - Click "Launch Modernized Hydraulic System" above
        - Or run manually: `streamlit run modernized_hydraulic_system.py`
        
        #### 3. Application Workflow
        1. **Project Setup** - Configure project information
        2. **Data Loading** - Load Excel and DOC data
        3. **Hydraulic Analysis** - Perform comprehensive analysis
        4. **Detailed Explanations** - Review parameter details
        5. **Document Analysis** - Analyze project documents
        6. **Export Reports** - Generate professional reports
        
        #### 4. Key Features
        - **Modern UI** - Professional interface with BridgeSlabDesigner patterns
        - **Live Previews** - Real-time calculation updates
        - **Data Integration** - Excel sheets + DOC files
        - **Educational Content** - Line-by-line explanations
        - **Professional Export** - Excel and PDF reports
        """)
    
    # Footer
    st.markdown("""
    ---
    **Modernized Bridge Hydraulic System v4.0.0**  
    *Updated with BridgeSlabDesigner patterns for enhanced user experience*
    """)

if __name__ == "__main__":
    main()