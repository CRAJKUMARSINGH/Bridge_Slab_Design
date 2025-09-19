"""
HFL CROSS SECTION A4 PRINTER
============================

Simple, effective A4 landscape printable cross-section with Highest Flood Level
Professional engineering drawing for bridge design
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import streamlit as st
from datetime import datetime
from typing import Dict, Any, Optional
from river_section_input_schema import RiverSectionInputSchema

def create_hfl_cross_section_a4(river_data: RiverSectionInputSchema, 
                               project_info: Optional[Dict[str, Any]] = None):
    """
    Create A4 landscape printable cross-section with HFL annotations
    """
    
    # A4 landscape dimensions (297mm x 210mm)
    fig, (ax_main, ax_title) = plt.subplots(2, 1, figsize=(11.69, 8.27), 
                                           gridspec_kw={'height_ratios': [4, 1]},
                                           dpi=300)
    
    # Extract cross-section data
    if not river_data.cross_section_points:
        st.error("No cross-section data available")
        return None
    
    chainages = [p.chainage for p in river_data.cross_section_points]
    elevations = [p.elevation for p in river_data.cross_section_points]
    
    # Plot ground profile
    ax_main.plot(chainages, elevations, 'k-', linewidth=2.5, label='Ground Level', marker='o', markersize=4)
    
    # Fill ground area
    min_elev = min(elevations) - 1
    ax_main.fill_between(chainages, elevations, min_elev, 
                        color='saddlebrown', alpha=0.3, label='Ground')
    
    # Add water levels with clear HFL emphasis
    water_levels = river_data.water_levels
    
    # HFL - Highest Flood Level (Prominent red line)
    ax_main.axhline(y=water_levels.hfl, color='red', linestyle='-', linewidth=3, 
                   label=f'HFL = {water_levels.hfl:.2f}m', zorder=10)
    
    # NWL - Normal Water Level
    ax_main.axhline(y=water_levels.nwl, color='blue', linestyle='--', linewidth=2, 
                   label=f'NWL = {water_levels.nwl:.2f}m')
    
    # LWL - Low Water Level  
    ax_main.axhline(y=water_levels.lwl, color='green', linestyle='--', linewidth=2, 
                   label=f'LWL = {water_levels.lwl:.2f}m')
    
    # Water area at HFL (blue fill)
    water_mask = np.array(elevations) <= water_levels.hfl
    if any(water_mask):
        water_chainages = np.array(chainages)[water_mask]
        water_elevations = np.array(elevations)[water_mask]
        ax_main.fill_between(water_chainages, water_elevations, water_levels.hfl,
                           color='lightblue', alpha=0.5, label='Water Area at HFL')
    
    # Add HFL annotations
    xlim = ax_main.get_xlim()
    
    # HFL text box (prominent)
    ax_main.text(xlim[1] - (xlim[1] - xlim[0]) * 0.02, water_levels.hfl + 0.2,
               f'HIGHEST FLOOD LEVEL\\nHFL = {water_levels.hfl:.2f}m',
               fontsize=12, fontweight='bold', ha='right',
               bbox=dict(boxstyle='round,pad=0.5', facecolor='red', alpha=0.2, edgecolor='red'))
    
    # River width and depth annotations
    river_width = max(chainages) - min(chainages)
    max_depth = water_levels.hfl - min(elevations)
    
    # Add dimension line for river width
    y_dim = max(elevations) + (max(elevations) - min(elevations)) * 0.1
    ax_main.annotate('', xy=(min(chainages), y_dim), xytext=(max(chainages), y_dim),
                    arrowprops=dict(arrowstyle='<->', color='black', lw=1.5))
    ax_main.text((min(chainages) + max(chainages))/2, y_dim + 0.3,
               f'River Width = {river_width:.1f}m', ha='center', fontweight='bold',
               bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7))
    
    # Max depth annotation
    deepest_idx = elevations.index(min(elevations))
    ax_main.annotate(f'Max Depth\\n{max_depth:.2f}m at HFL',
                    (chainages[deepest_idx], elevations[deepest_idx]),
                    xytext=(20, -40), textcoords='offset points',
                    fontweight='bold', ha='center',
                    bbox=dict(boxstyle='round,pad=0.4', facecolor='orange', alpha=0.8),
                    arrowprops=dict(arrowstyle='->', color='orange', lw=2))
    
    # Bridge outline (if data available)
    if hasattr(river_data.bridge_geometry, 'bridge_length') and river_data.bridge_geometry.bridge_length > 0:
        bridge_center = (min(chainages) + max(chainages)) / 2
        bridge_half_width = river_data.bridge_geometry.bridge_length / 2
        clearance = getattr(river_data.bridge_geometry, 'vertical_clearance', 2.0)
        bridge_elevation = water_levels.hfl + clearance
        
        # Bridge deck
        bridge_x = [bridge_center - bridge_half_width, bridge_center + bridge_half_width]
        bridge_y = [bridge_elevation, bridge_elevation]
        ax_main.plot(bridge_x, bridge_y, 'r-', linewidth=4, label='Bridge Deck')
        
        # Clearance annotation
        ax_main.annotate('', xy=(bridge_center, water_levels.hfl),
                        xytext=(bridge_center, bridge_elevation),
                        arrowprops=dict(arrowstyle='<->', color='purple', lw=2))
        ax_main.text(bridge_center + 5, (water_levels.hfl + bridge_elevation)/2,
                    f'Clearance\\n{clearance:.1f}m', fontweight='bold',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='purple', alpha=0.2))
    
    # Format main plot
    ax_main.set_xlabel('Chainage (m)', fontsize=12, fontweight='bold')
    ax_main.set_ylabel('Elevation (m)', fontsize=12, fontweight='bold')
    ax_main.grid(True, alpha=0.3)
    ax_main.legend(loc='upper left', fontsize=10, framealpha=0.9)
    ax_main.set_title(f'RIVER CROSS-SECTION WITH HIGHEST FLOOD LEVEL\\n{river_data.river_name} at {river_data.location}',
                     fontsize=14, fontweight='bold', pad=20)
    
    # Create title block
    ax_title.set_xlim(0, 1)
    ax_title.set_ylim(0, 1)
    ax_title.axis('off')
    
    # Title block border
    title_rect = patches.Rectangle((0.02, 0.1), 0.96, 0.8, 
                                 linewidth=2, edgecolor='black', 
                                 facecolor='lightgray', alpha=0.1)
    ax_title.add_patch(title_rect)
    
    # Title block content
    if project_info is None:
        project_info = {}
    
    # Left section - Project info
    ax_title.text(0.05, 0.7, f"Project: {project_info.get('project_name', river_data.project_name)}", 
                 fontsize=10, fontweight='bold')
    ax_title.text(0.05, 0.5, f"Survey Date: {river_data.survey_date}", fontsize=9)
    ax_title.text(0.05, 0.3, f"Drawing Date: {datetime.now().strftime('%d-%m-%Y')}", fontsize=9)
    
    # Center section - Water levels
    ax_title.text(0.35, 0.7, f"HFL = {water_levels.hfl:.2f}m", fontsize=10, fontweight='bold', color='red')
    ax_title.text(0.35, 0.5, f"NWL = {water_levels.nwl:.2f}m", fontsize=9, color='blue')
    ax_title.text(0.35, 0.3, f"LWL = {water_levels.lwl:.2f}m", fontsize=9, color='green')
    
    # Right section - Technical info
    ax_title.text(0.65, 0.7, f"Discharge = {water_levels.design_discharge:.0f} cumecs", fontsize=9)
    ax_title.text(0.65, 0.5, f"River Width = {river_width:.1f}m", fontsize=9)
    ax_title.text(0.65, 0.3, f"Max Depth = {max_depth:.2f}m", fontsize=9)
    
    # Drawing info
    ax_title.text(0.98, 0.8, "BRIDGE DESIGN APPLICATION", fontsize=10, fontweight='bold', ha='right')
    ax_title.text(0.98, 0.6, f"Drawing No: CS-{datetime.now().strftime('%Y%m%d')}-001", fontsize=8, ha='right')
    ax_title.text(0.98, 0.4, "A4 LANDSCAPE - READY TO PRINT", fontsize=8, ha='right', style='italic')
    
    plt.tight_layout()
    return fig

def add_hfl_cross_section_to_app():
    """Add HFL cross-section functionality to Streamlit app"""
    
    st.markdown("""
    <div style="background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%); 
                color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
        <h2 style="margin: 0; font-size: 1.8rem;">📄 Highest Flood Level (HFL) Cross-Section</h2>
        <p style="margin: 0; opacity: 0.9; font-size: 1.1rem;">A4 Landscape Printable Engineering Drawing</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Check if river data exists
    if 'river_section_data' not in st.session_state:
        st.warning("⚠️ Please complete River Section Input first!")
        st.info("Go to 🌊 River & Hydraulics tab to enter cross-section data.")
        return
    
    river_data = st.session_state.river_section_data
    
    # Configuration options
    st.markdown("### ⚙️ Drawing Options")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        include_bridge = st.checkbox("Include Bridge Deck", value=True)
        show_dimensions = st.checkbox("Show Dimensions", value=True)
    
    with col2:
        drawing_quality = st.selectbox("Quality", ["Standard", "High", "Print"], index=1)
        paper_size = st.selectbox("Paper", ["A4 Landscape", "A4 Portrait"], index=0)
    
    with col3:
        include_annotations = st.checkbox("Detailed Annotations", value=True)
        professional_title = st.checkbox("Professional Title Block", value=True)
    
    # Project information
    st.markdown("### 📋 Project Information")
    
    col1, col2 = st.columns(2)
    
    with col1:
        project_name = st.text_input("Project Name", value=river_data.project_name)
        engineer_name = st.text_input("Engineer", value="Bridge Design Engineer")
    
    with col2:
        drawing_number = st.text_input("Drawing No.", value=f"CS-{datetime.now().strftime('%Y%m%d')}-001")
        scale_info = st.text_input("Scale", value="As Noted")
    
    project_info = {
        'project_name': project_name,
        'engineer_name': engineer_name,
        'drawing_number': drawing_number,
        'scale_info': scale_info
    }
    
    # Generate button
    st.markdown("---")
    
    if st.button("🎨 Generate HFL Cross-Section Drawing", type="primary", use_container_width=True):
        
        with st.spinner("🎨 Creating professional A4 drawing..."):
            
            try:
                # Generate the drawing
                fig = create_hfl_cross_section_a4(river_data, project_info)
                
                if fig is not None:
                    # Display preview
                    st.markdown("### 📄 A4 Drawing Preview")
                    st.pyplot(fig, use_container_width=True)
                    
                    # Save and provide download
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    
                    # Save as PDF
                    pdf_filename = f'HFL_Cross_Section_A4_{timestamp}.pdf'
                    fig.savefig(pdf_filename, format='pdf', dpi=300, bbox_inches='tight',
                               facecolor='white', edgecolor='none')
                    
                    # Save as PNG  
                    png_filename = f'HFL_Cross_Section_A4_{timestamp}.png'
                    fig.savefig(png_filename, format='png', dpi=300, bbox_inches='tight',
                               facecolor='white', edgecolor='none')
                    
                    # Download buttons
                    st.markdown("### 📥 Download A4 Ready Files")
                    
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        with open(pdf_filename, 'rb') as pdf_file:
                            st.download_button(
                                label="📄 Download PDF (A4 Print Ready)",
                                data=pdf_file.read(),
                                file_name=pdf_filename,
                                mime="application/pdf",
                                use_container_width=True
                            )
                    
                    with col2:
                        with open(png_filename, 'rb') as png_file:
                            st.download_button(
                                label="🖼️ Download PNG (High Resolution)",
                                data=png_file.read(),
                                file_name=png_filename,
                                mime="image/png",
                                use_container_width=True
                            )
                    
                    # Drawing specifications
                    st.markdown("### 📏 Drawing Specifications")
                    
                    spec_col1, spec_col2, spec_col3 = st.columns(3)
                    
                    with spec_col1:
                        st.info("""
                        **Paper Size**: A4 Landscape
                        **Dimensions**: 297mm × 210mm
                        **Resolution**: 300 DPI
                        """)
                    
                    with spec_col2:
                        st.info("""
                        **Format**: Professional Engineering
                        **Standards**: Bridge Design
                        **Print Ready**: Yes
                        """)
                    
                    with spec_col3:
                        water_levels = river_data.water_levels
                        st.info(f"""
                        **HFL**: {water_levels.hfl:.2f}m
                        **NWL**: {water_levels.nwl:.2f}m  
                        **LWL**: {water_levels.lwl:.2f}m
                        """)
                    
                    st.success("✅ A4 HFL Cross-Section drawing generated successfully!")
                    st.balloons()
                
                else:
                    st.error("Failed to generate drawing. Please check your data.")
                    
            except Exception as e:
                st.error(f"Error generating drawing: {str(e)}")
    
    # Display current data summary
    st.markdown("---")
    st.markdown("### 📊 Current River Data Summary")
    
    if river_data.cross_section_points:
        summary_col1, summary_col2, summary_col3 = st.columns(3)
        
        chainages = [p.chainage for p in river_data.cross_section_points]
        elevations = [p.elevation for p in river_data.cross_section_points]
        
        with summary_col1:
            st.metric("River Width", f"{max(chainages) - min(chainages):.1f} m")
            st.metric("Survey Points", len(river_data.cross_section_points))
        
        with summary_col2:
            st.metric("HFL Elevation", f"{river_data.water_levels.hfl:.2f} m")
            st.metric("Max Depth at HFL", f"{river_data.water_levels.hfl - min(elevations):.2f} m")
        
        with summary_col3:
            st.metric("Design Discharge", f"{river_data.water_levels.design_discharge:.0f} cumecs")
            st.metric("Velocity at HFL", f"{river_data.water_levels.velocity_at_hfl:.1f} m/s")

if __name__ == "__main__":
    add_hfl_cross_section_to_app()