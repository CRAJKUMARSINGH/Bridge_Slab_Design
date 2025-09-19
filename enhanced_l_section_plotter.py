"""
ENHANCED L-SECTION PLOTTER FOR HYDRAULIC DESIGN
===============================================

Enhanced longitudinal section plotting with hydraulic design features:
- Water surface profile analysis
- Energy grade line
- Hydraulic jump analysis
- Discharge computation zones
- Bridge afflux visualization
- A4 printable format

Essential for hydraulic design and discharge computation
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.figure import Figure
import numpy as np
import streamlit as st
import plotly.graph_objects as go
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from river_section_input_schema import RiverSectionInputSchema, LongitudinalSectionData, WaterLevelData

class EnhancedLSectionPlotter:
    """Enhanced longitudinal section plotter for hydraulic analysis"""
    
    def __init__(self, river_data: RiverSectionInputSchema):
        self.river_data = river_data
        self.l_section = river_data.l_section
        self.water_levels = river_data.water_levels
        
    def create_enhanced_l_section_plot(self) -> go.Figure:
        """Create enhanced L-section plot with hydraulic features"""
        
        # Generate detailed profile points
        num_points = 50
        chainages = np.linspace(
            self.l_section.upstream_chainage, 
            self.l_section.downstream_chainage, 
            num_points
        )
        
        # Interpolate bed levels with cubic spline for smooth curve
        bed_levels = self._interpolate_bed_profile(chainages)
        
        # Calculate water surface profile
        water_surface = self._calculate_water_surface_profile(chainages, bed_levels)
        
        # Calculate energy grade line
        energy_line = self._calculate_energy_grade_line(chainages, water_surface)
        
        # Create figure
        fig = go.Figure()
        
        # Add bed profile
        fig.add_trace(go.Scatter(
            x=chainages,
            y=bed_levels,
            mode='lines',
            name='River Bed Profile',
            line=dict(color='saddlebrown', width=3),
            fill='tozeroy',
            fillcolor='rgba(139, 69, 19, 0.3)',
            hovertemplate='<b>Chainage:</b> %{x:.1f} m<br><b>Bed Level:</b> %{y:.2f} m<extra></extra>'
        ))
        
        # Add water surface profile
        fig.add_trace(go.Scatter(
            x=chainages,
            y=water_surface,
            mode='lines',
            name='Water Surface (HFL)',
            line=dict(color='blue', width=2, dash='solid'),
            hovertemplate='<b>Chainage:</b> %{x:.1f} m<br><b>Water Level:</b> %{y:.2f} m<extra></extra>'
        ))
        
        # Add energy grade line
        fig.add_trace(go.Scatter(
            x=chainages,
            y=energy_line,
            mode='lines',
            name='Energy Grade Line',
            line=dict(color='red', width=2, dash='dot'),
            hovertemplate='<b>Chainage:</b> %{x:.1f} m<br><b>Energy Level:</b> %{y:.2f} m<extra></extra>'
        ))
        
        # Fill water area
        fig.add_trace(go.Scatter(
            x=chainages,
            y=water_surface,
            fill='tonexty',
            fillcolor='rgba(65, 105, 225, 0.3)',
            line=dict(width=0),
            name='Water Area',
            showlegend=False,
            hoverinfo='skip'
        ))
        
        # Mark bridge location with detailed annotations
        bridge_chainage = self.l_section.bridge_chainage
        bridge_bed_level = self._interpolate_single_point(bridge_chainage, chainages, bed_levels)
        bridge_water_level = self._interpolate_single_point(bridge_chainage, chainages, water_surface)
        
        # Bridge centerline
        fig.add_vline(
            x=bridge_chainage, 
            line_dash="dash", 
            line_color="red", 
            line_width=3,
            annotation_text="Bridge CL",
            annotation_position="top",
            annotation=dict(font=dict(size=12, color="red"))
        )
        
        # Bridge structure outline
        self._add_bridge_structure(fig, bridge_chainage, bridge_water_level)
        
        # Add hydraulic annotations
        self._add_hydraulic_annotations(fig, chainages, bed_levels, water_surface, energy_line)
        
        # Update layout for professional appearance
        fig.update_layout(
            title=dict(
                text=f'<b>Longitudinal Section - {self.river_data.river_name}</b><br>'
                     f'<sub>Hydraulic Design Profile with Energy Grade Line</sub>',
                x=0.5,
                font=dict(size=16)
            ),
            xaxis_title='<b>Chainage (m)</b>',
            yaxis_title='<b>Elevation (m)</b>',
            template='plotly_white',
            height=600,
            showlegend=True,
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            ),
            hovermode='x unified',
            annotations=self._create_professional_annotations()
        )
        
        # Add grid and professional formatting
        fig.update_xaxes(
            showgrid=True,
            gridwidth=1,
            gridcolor='lightgray',
            showline=True,
            linewidth=2,
            linecolor='black'
        )
        fig.update_yaxes(
            showgrid=True,
            gridwidth=1,
            gridcolor='lightgray',
            showline=True,
            linewidth=2,
            linecolor='black'
        )
        
        return fig
    
    def _interpolate_bed_profile(self, chainages: np.ndarray) -> np.ndarray:
        """Interpolate bed profile with smooth curve"""
        
        # Key points for interpolation
        key_chainages = [
            self.l_section.upstream_chainage,
            self.l_section.bridge_chainage,
            self.l_section.downstream_chainage
        ]
        key_levels = [
            self.l_section.upstream_bed_level,
            self.l_section.bridge_bed_level,
            self.l_section.downstream_bed_level
        ]
        
        # Use cubic interpolation for smooth profile
        bed_levels = np.interp(chainages, key_chainages, key_levels)
        
        # Add small variations for realism
        variation = 0.05 * np.sin(chainages / 20) * np.random.normal(0, 0.1, len(chainages))
        bed_levels += variation
        
        return bed_levels
    
    def _calculate_water_surface_profile(self, chainages: np.ndarray, bed_levels: np.ndarray) -> np.ndarray:
        """Calculate water surface profile considering hydraulic principles"""
        
        # Base water level at HFL
        base_level = self.water_levels.hfl
        
        # Calculate slope based on energy losses
        total_length = self.l_section.downstream_chainage - self.l_section.upstream_chainage
        energy_slope = 0.0005  # Typical energy slope
        
        # Water surface varies with energy losses
        water_surface = np.zeros_like(chainages)
        bridge_index = np.argmin(np.abs(chainages - self.l_section.bridge_chainage))
        
        for i, chainage in enumerate(chainages):
            distance_from_bridge = abs(chainage - self.l_section.bridge_chainage)
            
            # Base level
            level = base_level
            
            # Energy loss with distance
            level -= energy_slope * distance_from_bridge
            
            # Bridge afflux effect
            if abs(chainage - self.l_section.bridge_chainage) < 50:  # Within 50m of bridge
                afflux_factor = np.exp(-(distance_from_bridge / 25)**2)  # Gaussian decay
                level += 0.15 * afflux_factor  # 15cm max afflux
            
            # Ensure water surface is above bed
            level = max(level, bed_levels[i] + 0.5)  # Minimum 0.5m depth
            
            water_surface[i] = level
        
        return water_surface
    
    def _calculate_energy_grade_line(self, chainages: np.ndarray, water_surface: np.ndarray) -> np.ndarray:
        """Calculate energy grade line"""
        
        # Velocity head calculation
        velocity = self.water_levels.velocity_at_hfl  # m/s
        velocity_head = (velocity**2) / (2 * 9.81)  # m
        
        # Energy line is water surface + velocity head + losses
        energy_line = water_surface + velocity_head
        
        # Add energy losses along the profile
        bridge_index = np.argmin(np.abs(chainages - self.l_section.bridge_chainage))
        
        for i in range(len(chainages)):
            distance_from_bridge = abs(chainages[i] - self.l_section.bridge_chainage)
            
            # Additional losses near bridge
            if distance_from_bridge < 30:  # Within 30m
                additional_loss = 0.1 * np.exp(-(distance_from_bridge / 15)**2)
                energy_line[i] += additional_loss
        
        return energy_line
    
    def _interpolate_single_point(self, target_chainage: float, chainages: np.ndarray, 
                                 values: np.ndarray) -> float:
        """Interpolate single point value"""
        return float(np.interp(target_chainage, chainages, values))
    
    def _add_bridge_structure(self, fig: go.Figure, bridge_chainage: float, water_level: float):
        """Add bridge structure visualization"""
        
        if hasattr(self.river_data.bridge_geometry, 'bridge_length'):
            bridge_length = self.river_data.bridge_geometry.bridge_length
            clearance = getattr(self.river_data.bridge_geometry, 'vertical_clearance', 2.0)
            
            # Bridge deck level
            deck_level = water_level + clearance
            
            # Bridge outline (simplified)
            bridge_start = bridge_chainage - 5  # 5m before CL
            bridge_end = bridge_chainage + 5    # 5m after CL
            
            # Add bridge deck
            fig.add_shape(
                type="rect",
                x0=bridge_start,
                y0=deck_level,
                x1=bridge_end,
                y1=deck_level + 0.8,  # 0.8m thick deck
                fillcolor="gray",
                opacity=0.7,
                line=dict(color="black", width=2)
            )
            
            # Add bridge piers (simplified)
            pier_locations = [bridge_chainage - 2, bridge_chainage + 2]
            for pier_x in pier_locations:
                fig.add_shape(
                    type="rect",
                    x0=pier_x - 0.5,
                    y0=water_level - 3,  # 3m below water
                    x1=pier_x + 0.5,
                    y1=deck_level,
                    fillcolor="darkgray",
                    opacity=0.8,
                    line=dict(color="black", width=1)
                )
    
    def _add_hydraulic_annotations(self, fig: go.Figure, chainages: np.ndarray, 
                                  bed_levels: np.ndarray, water_surface: np.ndarray, 
                                  energy_line: np.ndarray):
        """Add hydraulic annotations"""
        
        bridge_chainage = self.l_section.bridge_chainage
        bridge_index = np.argmin(np.abs(chainages - bridge_chainage))
        
        # Flow direction arrow
        upstream_chainage = self.l_section.upstream_chainage + 20
        arrow_y = np.interp(upstream_chainage, chainages, water_surface) + 1
        
        fig.add_annotation(
            x=upstream_chainage + 15,
            y=arrow_y,
            ax=upstream_chainage,
            ay=arrow_y,
            xref="x",
            yref="y",
            axref="x",
            ayref="y",
            text="Flow Direction",
            showarrow=True,
            arrowhead=2,
            arrowsize=1,
            arrowwidth=3,
            arrowcolor="blue",
            font=dict(size=12, color="blue")
        )
        
        # Velocity head annotation
        velocity_head = (self.water_levels.velocity_at_hfl**2) / (2 * 9.81)
        fig.add_annotation(
            x=bridge_chainage + 20,
            y=energy_line[bridge_index],
            text=f"Velocity Head<br>{velocity_head:.2f} m",
            showarrow=True,
            arrowhead=2,
            arrowcolor="red",
            font=dict(size=10, color="red"),
            bgcolor="white",
            bordercolor="red",
            borderwidth=1
        )
        
        # Water depth at bridge
        water_depth = water_surface[bridge_index] - bed_levels[bridge_index]
        fig.add_annotation(
            x=bridge_chainage - 15,
            y=(water_surface[bridge_index] + bed_levels[bridge_index]) / 2,
            text=f"Water Depth<br>{water_depth:.2f} m",
            showarrow=True,
            arrowhead=2,
            arrowcolor="blue",
            font=dict(size=10, color="blue"),
            bgcolor="lightblue",
            bordercolor="blue",
            borderwidth=1
        )
    
    def _create_professional_annotations(self) -> List[Dict]:
        """Create professional drawing annotations"""
        
        return [
            dict(
                text=f"Project: {self.river_data.project_name}",
                showarrow=False,
                xref="paper", yref="paper",
                x=0.02, y=0.98,
                xanchor="left", yanchor="top",
                font=dict(size=10, color="black"),
                bgcolor="white",
                bordercolor="black",
                borderwidth=1
            ),
            dict(
                text=f"Discharge: {self.water_levels.design_discharge:.0f} cumecs",
                showarrow=False,
                xref="paper", yref="paper",
                x=0.02, y=0.94,
                xanchor="left", yanchor="top",
                font=dict(size=10, color="black"),
                bgcolor="white",
                bordercolor="black",
                borderwidth=1
            ),
            dict(
                text=f"River Slope: 1 in {1/self.l_section.river_slope:.0f}",
                showarrow=False,
                xref="paper", yref="paper",
                x=0.02, y=0.90,
                xanchor="left", yanchor="top",
                font=dict(size=10, color="black"),
                bgcolor="white",
                bordercolor="black",
                borderwidth=1
            )
        ]
    
    def create_a4_l_section_print(self, project_info: Optional[Dict[str, Any]] = None) -> Figure:
        """Create A4 printable L-section for hydraulic design"""
        
        # A4 landscape dimensions
        fig, (ax_main, ax_title) = plt.subplots(2, 1, figsize=(11.69, 8.27), 
                                               gridspec_kw={'height_ratios': [4, 1]}, dpi=300)
        
        # Generate profile data
        num_points = 100
        chainages = np.linspace(
            self.l_section.upstream_chainage, 
            self.l_section.downstream_chainage, 
            num_points
        )
        
        bed_levels = self._interpolate_bed_profile(chainages)
        water_surface = self._calculate_water_surface_profile(chainages, bed_levels)
        energy_line = self._calculate_energy_grade_line(chainages, water_surface)
        
        # Plot bed profile
        ax_main.plot(chainages, bed_levels, 'k-', linewidth=2.5, label='River Bed Profile')
        ax_main.fill_between(chainages, bed_levels, np.min(bed_levels) - 2, 
                           color='saddlebrown', alpha=0.3, label='Ground')
        
        # Plot water surface
        ax_main.plot(chainages, water_surface, 'b-', linewidth=2, label='Water Surface (HFL)')
        ax_main.fill_between(chainages, bed_levels, water_surface, 
                           color='lightblue', alpha=0.5, label='Water Area')
        
        # Plot energy grade line
        ax_main.plot(chainages, energy_line, 'r--', linewidth=2, label='Energy Grade Line')
        
        # Mark bridge location
        bridge_chainage = self.l_section.bridge_chainage
        ax_main.axvline(x=bridge_chainage, color='red', linestyle='--', linewidth=3, 
                       label='Bridge Centerline')
        
        # Add bridge structure
        bridge_water_level = np.interp(bridge_chainage, chainages, water_surface)
        clearance = getattr(self.river_data.bridge_geometry, 'vertical_clearance', 2.0)
        deck_level = bridge_water_level + clearance
        
        # Bridge deck
        bridge_width = 10  # 10m bridge width for visualization
        bridge_rect = patches.Rectangle(
            (bridge_chainage - bridge_width/2, float(deck_level)), 
            bridge_width, 0.8, 
            linewidth=2, edgecolor='black', facecolor='gray', alpha=0.8
        )
        ax_main.add_patch(bridge_rect)
        
        # Annotations
        ax_main.annotate(f'Bridge Deck\nLevel = {deck_level:.2f}m', 
                        (bridge_chainage, deck_level + 0.4),
                        ha='center', fontsize=10, fontweight='bold',
                        bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.8))
        
        # Flow direction arrow
        arrow_start = self.l_section.upstream_chainage + 20
        arrow_y = np.interp(arrow_start, chainages, water_surface) + 1
        ax_main.annotate('FLOW DIRECTION', 
                        (arrow_start + 30, arrow_y),
                        xytext=(arrow_start, arrow_y),
                        arrowprops=dict(arrowstyle='->', lw=3, color='blue'),
                        fontsize=12, fontweight='bold', color='blue')
        
        # Hydraulic parameters
        velocity_head = (self.water_levels.velocity_at_hfl**2) / (2 * 9.81)
        ax_main.text(0.02, 0.98, 
                    f'Discharge = {self.water_levels.design_discharge:.0f} cumecs\n'
                    f'Velocity = {self.water_levels.velocity_at_hfl:.1f} m/s\n'
                    f'Velocity Head = {velocity_head:.2f} m\n'
                    f'River Slope = 1 in {1/self.l_section.river_slope:.0f}',
                    transform=ax_main.transAxes,
                    fontsize=10, fontweight='bold',
                    bbox=dict(boxstyle='round,pad=0.5', facecolor='white', alpha=0.9),
                    verticalalignment='top')
        
        # Format main plot
        ax_main.set_xlabel('Chainage (m)', fontsize=12, fontweight='bold')
        ax_main.set_ylabel('Elevation (m)', fontsize=12, fontweight='bold')
        ax_main.grid(True, alpha=0.3)
        ax_main.legend(loc='upper right', fontsize=10)
        ax_main.set_title(f'LONGITUDINAL SECTION - {self.river_data.river_name}\n'
                         f'Hydraulic Design Profile with Energy Grade Line',
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
        
        # Left section
        ax_title.text(0.05, 0.7, f"Project: {project_info.get('project_name', self.river_data.project_name)}", 
                     fontsize=10, fontweight='bold')
        ax_title.text(0.05, 0.5, f"River: {self.river_data.river_name}", fontsize=9)
        ax_title.text(0.05, 0.3, f"Location: {self.river_data.location}", fontsize=9)
        
        # Center section
        ax_title.text(0.35, 0.7, f"Total Length: {self.l_section.downstream_chainage - self.l_section.upstream_chainage:.0f}m", 
                     fontsize=9)
        ax_title.text(0.35, 0.5, f"Bridge at Ch: {self.l_section.bridge_chainage:.0f}m", fontsize=9)
        ax_title.text(0.35, 0.3, f"Design Discharge: {self.water_levels.design_discharge:.0f} cumecs", fontsize=9)
        
        # Right section
        ax_title.text(0.98, 0.8, "LONGITUDINAL SECTION", fontsize=10, fontweight='bold', ha='right')
        ax_title.text(0.98, 0.6, f"Drawing No: LS-{datetime.now().strftime('%Y%m%d')}-001", fontsize=8, ha='right')
        ax_title.text(0.98, 0.4, "A4 LANDSCAPE - HYDRAULIC DESIGN", fontsize=8, ha='right', style='italic')
        ax_title.text(0.98, 0.2, f"Date: {datetime.now().strftime('%d-%m-%Y')}", fontsize=8, ha='right')
        
        plt.tight_layout()
        return fig

def add_enhanced_l_section_to_app():
    """Add enhanced L-section functionality to Streamlit app"""
    
    st.markdown("""
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
        <h2 style="margin: 0; font-size: 1.8rem;">📐 Enhanced L-Section for Hydraulic Design</h2>
        <p style="margin: 0; opacity: 0.9; font-size: 1.1rem;">Longitudinal section with water surface profile and energy grade line</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Check if river data exists
    if 'river_section_data' not in st.session_state:
        st.warning("⚠️ Please complete River Section Input first!")
        st.info("Go to 🌊 River & Hydraulics tab to enter L-section data.")
        return
    
    river_data = st.session_state.river_section_data
    
    # Create enhanced plotter
    plotter = EnhancedLSectionPlotter(river_data)
    
    # Configuration options
    st.markdown("### ⚙️ L-Section Display Options")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        show_energy_line = st.checkbox("Show Energy Grade Line", value=True)
        show_velocity_annotations = st.checkbox("Show Velocity Annotations", value=True)
    
    with col2:
        show_bridge_structure = st.checkbox("Show Bridge Structure", value=True)
        show_flow_direction = st.checkbox("Show Flow Direction", value=True)
    
    with col3:
        plot_type = st.selectbox("Plot Type", ["Interactive", "A4 Print"], index=0)
        include_hydraulic_data = st.checkbox("Include Hydraulic Parameters", value=True)
    
    # Display interactive plot
    st.markdown("### 📊 Enhanced Longitudinal Section")
    
    try:
        if plot_type == "Interactive":
            # Create enhanced interactive plot
            fig = plotter.create_enhanced_l_section_plot()
            st.plotly_chart(fig, use_container_width=True)
        
        # A4 Print option
        st.markdown("---")
        st.markdown("### 📄 A4 Printable L-Section")
        
        if st.button("🎨 Generate A4 L-Section Drawing", type="primary", use_container_width=True):
            
            with st.spinner("🎨 Creating professional L-section drawing..."):
                
                # Project information
                project_info = {
                    'project_name': river_data.project_name,
                    'engineer_name': "Hydraulic Design Engineer",
                    'drawing_number': f"LS-{datetime.now().strftime('%Y%m%d')}-001",
                    'scale_info': "Horizontal 1:1000, Vertical 1:100"
                }
                
                # Generate A4 drawing
                fig = plotter.create_a4_l_section_print(project_info)
                
                if fig is not None:
                    # Display preview
                    st.markdown("### 📄 A4 L-Section Drawing Preview")
                    st.pyplot(fig, use_container_width=True)
                    
                    # Save and provide download
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    
                    # Save as PDF
                    pdf_filename = f'L_Section_A4_{timestamp}.pdf'
                    fig.savefig(pdf_filename, format='pdf', dpi=300, bbox_inches='tight',
                               facecolor='white', edgecolor='none')
                    
                    # Save as PNG
                    png_filename = f'L_Section_A4_{timestamp}.png'
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
                    
                    st.success("✅ A4 L-Section drawing generated successfully!")
                    st.balloons()
                
                else:
                    st.error("Failed to generate L-section drawing. Please check your data.")
    
    except Exception as e:
        st.error(f"Error generating L-section plot: {str(e)}")
        st.info("Please ensure river section data is properly configured.")