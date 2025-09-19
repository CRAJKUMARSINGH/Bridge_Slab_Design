#!/usr/bin/env python3
"""
TEST RIVER SECTION APPLICATION
==============================

Simple test app to demonstrate the new River Section Input Schema
"""

import streamlit as st
from river_section_input_schema import RiverSectionInputUI, HydraulicCalculationEngine

# Page configuration
st.set_page_config(
    page_title="River Section Input Test",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="expanded"
)

def main():
    """Main test application"""
    
    st.title("🌊 River Section Input Schema - Test Application")
    st.markdown("**Testing the comprehensive hydraulic input system**")
    
    # Initialize river section UI
    if 'river_section_ui' not in st.session_state:
        st.session_state.river_section_ui = RiverSectionInputUI()
    
    river_ui = st.session_state.river_section_ui
    
    # Create tabs
    input_tab, viz_tab, calc_tab = st.tabs([
        "📋 Input Schema", 
        "📊 Visualization", 
        "🧮 Calculations"
    ])
    
    with input_tab:
        st.markdown("### Complete River Section Input")
        river_data = river_ui.render_complete_form()
        
        if st.button("💾 Save River Data", type="primary"):
            st.session_state.river_data = river_data
            st.success("✅ River section data saved!")
    
    with viz_tab:
        if 'river_data' in st.session_state:
            river_ui.render_visualization_tab(st.session_state.river_data)
        else:
            st.warning("⚠️ Please complete input first!")
    
    with calc_tab:
        if 'river_data' in st.session_state:
            results = river_ui.render_hydraulic_calculations_tab(st.session_state.river_data)
            if results:
                st.session_state.hydraulic_results = results
        else:
            st.warning("⚠️ Please complete input first!")

if __name__ == "__main__":
    main()