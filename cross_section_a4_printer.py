"""
CROSS SECTION A4 LANDSCAPE PRINTABLE
====================================

Professional A4 landscape printable cross-section drawings with HFL
Engineering drawing standards with title blocks and annotations
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Polygon
from matplotlib.figure import Figure
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import streamlit as st
from river_section_input_schema import RiverCrossSectionPoint, WaterLevelData, RiverSectionInputSchema

@dataclass
class DrawingConfig:
    """Configuration for A4 landscape drawing"""
    # A4 landscape dimensions in inches (297mm x 210mm)
    width_inches: float = 11.69  # 297mm
    height_inches: float = 8.27   # 210mm
    dpi: int = 300
    
    # Margins in inches
    margin_left: float = 0.8
    margin_right: float = 0.4
    margin_top: float = 0.6
    margin_bottom: float = 1.2  # Extra space for title block
    
    # Title block dimensions
    title_block_height: float = 0.8
    
    # Drawing area
    @property
    def drawing_width(self) -> float:
        return self.width_inches - self.margin_left - self.margin_right
    
    @property
    def drawing_height(self) -> float:
        return self.height_inches - self.margin_top - self.margin_bottom

class CrossSectionA4Printer:
    """Professional A4 landscape cross-section printer"""
    
    def __init__(self, config: Optional[DrawingConfig] = None):
        self.config = config or DrawingConfig()
        self.fig: Optional[Figure] = None
        self.ax_main = None
        self.ax_title = None
    
    def create_printable_cross_section(self, river_data: RiverSectionInputSchema, 
                                     project_info: Optional[Dict[str, Any]] = None) -> Figure:
        """Create professional A4 landscape cross-section drawing"""
        
        # Create figure with A4 landscape dimensions
        self.fig = plt.figure(figsize=(self.config.width_inches, self.config.height_inches), 
                             dpi=self.config.dpi)
        
        # Set up layout
        self._setup_layout()
        
        # Draw cross-section
        self._draw_cross_section(river_data)
        
        # Add annotations and levels
        self._add_water_levels(river_data.water_levels)
        
        # Add dimensions and annotations
        self._add_dimensions_and_annotations(river_data)
        
        # Create title block
        self._create_title_block(river_data, project_info)
        
        # Final formatting
        self._format_drawing()
        
        return self.fig
    
    def _setup_layout(self):
        """Setup drawing layout with main drawing area and title block"""
        
        # Calculate positions
        main_left = self.config.margin_left / self.config.width_inches
        main_bottom = self.config.margin_bottom / self.config.height_inches
        main_width = self.config.drawing_width / self.config.width_inches
        main_height = self.config.drawing_height / self.config.height_inches
        
        title_left = main_left
        title_bottom = 0.02
        title_width = main_width
        title_height = (self.config.title_block_height - 0.1) / self.config.height_inches
        
        # Create main drawing area
        self.ax_main = self.fig.add_axes([main_left, main_bottom, main_width, main_height])
        
        # Create title block area
        self.ax_title = self.fig.add_axes([title_left, title_bottom, title_width, title_height])
        self.ax_title.set_xlim(0, 1)
        self.ax_title.set_ylim(0, 1)
        self.ax_title.axis('off')
    
    def _draw_cross_section(self, river_data: RiverSectionInputSchema):
        """Draw the main cross-section with professional styling"""
        
        if not river_data.cross_section_points:
            return
        
        # Extract data
        chainages = [p.chainage for p in river_data.cross_section_points]
        elevations = [p.elevation for p in river_data.cross_section_points]
        
        # Draw ground line
        self.ax_main.plot(chainages, elevations, 'k-', linewidth=2.5, label='Ground Level')
        
        # Fill ground area (below lowest point)
        min_elevation = min(elevations)
        ground_fill_y = [min_elevation - 2] * len(chainages) + elevations[::-1]
        ground_fill_x = chainages + chainages[::-1]
        
        self.ax_main.fill(ground_fill_x, ground_fill_y, 
                         color='saddlebrown', alpha=0.3, label='Ground')
        
        # Mark survey points
        self.ax_main.scatter(chainages, elevations, 
                           color='red', s=30, zorder=5, label='Survey Points')
        
        # Add point labels
        for i, (x, y) in enumerate(zip(chainages, elevations)):
            if i % 2 == 0:  # Label every other point to avoid crowding
                self.ax_main.annotate(f'{y:.2f}m', 
                                    (x, y), 
                                    xytext=(5, 10), 
                                    textcoords='offset points',
                                    fontsize=8,
                                    bbox=dict(boxstyle='round,pad=0.3', 
                                            facecolor='white', 
                                            alpha=0.8))
    
    def _add_water_levels(self, water_levels: WaterLevelData):
        """Add water level lines with professional annotations"""
        
        xlim = self.ax_main.get_xlim()
        
        # HFL - Highest Flood Level (Red dashed line)
        self.ax_main.axhline(y=water_levels.hfl, 
                           color='red', linestyle='--', linewidth=2, 
                           label=f'HFL = {water_levels.hfl:.2f}m')
        self.ax_main.text(xlim[1] - (xlim[1] - xlim[0]) * 0.15, water_levels.hfl + 0.1,
                        f'HFL = {water_levels.hfl:.2f}m', 
                        fontsize=10, fontweight='bold', 
                        bbox=dict(boxstyle='round,pad=0.3', facecolor='red', alpha=0.1))
        
        # NWL - Normal Water Level (Blue dashed line)
        self.ax_main.axhline(y=water_levels.nwl, 
                           color='blue', linestyle='--', linewidth=1.5, 
                           label=f'NWL = {water_levels.nwl:.2f}m')
        self.ax_main.text(xlim[1] - (xlim[1] - xlim[0]) * 0.15, water_levels.nwl + 0.1,
                        f'NWL = {water_levels.nwl:.2f}m', 
                        fontsize=9, 
                        bbox=dict(boxstyle='round,pad=0.3', facecolor='blue', alpha=0.1))
        
        # LWL - Low Water Level (Green dashed line)
        self.ax_main.axhline(y=water_levels.lwl, 
                           color='green', linestyle='--', linewidth=1.5, 
                           label=f'LWL = {water_levels.lwl:.2f}m')
        self.ax_main.text(xlim[1] - (xlim[1] - xlim[0]) * 0.15, water_levels.lwl + 0.1,
                        f'LWL = {water_levels.lwl:.2f}m', 
                        fontsize=9, 
                        bbox=dict(boxstyle='round,pad=0.3', facecolor='green', alpha=0.1))
        
        # Water area at HFL (blue transparent fill)
        chainages = [p.chainage for p in self.ax_main.lines[0].get_xydata()]
        elevations = [p.elevation for p in self.ax_main.lines[0].get_xydata()]
        
        # Create water surface polygon
        water_chainages = []
        water_elevations = []
        
        for x, y in zip(chainages, elevations):
            if y <= water_levels.hfl:
                water_chainages.append(x)
                water_elevations.append(max(y, water_levels.lwl))  # Don't go below LWL
        
        if water_chainages:
            # Add water surface line
            water_surface_x = [min(water_chainages), max(water_chainages)]
            water_surface_y = [water_levels.hfl, water_levels.hfl]
            
            # Create water fill
            fill_x = water_chainages + [max(water_chainages), min(water_chainages)]
            fill_y = water_elevations + [water_levels.hfl, water_levels.hfl]
            
            self.ax_main.fill(fill_x, fill_y, 
                            color='lightblue', alpha=0.4, label='Water Area at HFL')
    
    def _add_dimensions_and_annotations(self, river_data: RiverSectionInputSchema):
        """Add dimensions and engineering annotations"""
        
        if not river_data.cross_section_points:
            return
        
        chainages = [p.chainage for p in river_data.cross_section_points]
        elevations = [p.elevation for p in river_data.cross_section_points]
        
        # River width dimension
        river_width = max(chainages) - min(chainages)
        xlim = self.ax_main.get_xlim()
        ylim = self.ax_main.get_ylim()
        
        # Add river width dimension line
        dim_y = ylim[1] - (ylim[1] - ylim[0]) * 0.1
        self.ax_main.annotate('', 
                            xy=(min(chainages), dim_y), 
                            xytext=(max(chainages), dim_y),
                            arrowprops=dict(arrowstyle='<->', color='black', lw=1.5))
        
        self.ax_main.text((min(chainages) + max(chainages)) / 2, dim_y + 0.2,
                        f'River Width = {river_width:.1f}m', 
                        ha='center', fontsize=10, fontweight='bold',
                        bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.3))
        
        # Maximum depth annotation
        max_depth = river_data.water_levels.hfl - min(elevations)
        deepest_point_x = chainages[elevations.index(min(elevations))]
        
        self.ax_main.annotate(f'Max Depth\n{max_depth:.2f}m', 
                            (deepest_point_x, min(elevations)),
                            xytext=(20, -30), 
                            textcoords='offset points',
                            fontsize=9, fontweight='bold',
                            bbox=dict(boxstyle='round,pad=0.4', facecolor='orange', alpha=0.7),
                            arrowprops=dict(arrowstyle='->', color='orange', lw=2))
        
        # Bridge location (if available)
        if hasattr(river_data.bridge_geometry, 'bridge_length'):
            bridge_center = (min(chainages) + max(chainages)) / 2
            bridge_half_width = river_data.bridge_geometry.bridge_length / 2
            
            # Bridge outline
            bridge_elevation = river_data.water_levels.hfl + river_data.bridge_geometry.vertical_clearance
            
            bridge_x = [bridge_center - bridge_half_width, 
                       bridge_center + bridge_half_width,
                       bridge_center + bridge_half_width,
                       bridge_center - bridge_half_width,
                       bridge_center - bridge_half_width]
            
            bridge_y = [bridge_elevation, bridge_elevation, 
                       bridge_elevation + 0.5, bridge_elevation + 0.5, 
                       bridge_elevation]
            
            self.ax_main.plot(bridge_x, bridge_y, 'r-', linewidth=3, label='Bridge Deck')
            self.ax_main.fill(bridge_x, bridge_y, color='gray', alpha=0.3)
            
            # Bridge clearance annotation
            self.ax_main.annotate('', 
                                xy=(bridge_center, river_data.water_levels.hfl),
                                xytext=(bridge_center, bridge_elevation),
                                arrowprops=dict(arrowstyle='<->', color='purple', lw=2))
            
            self.ax_main.text(bridge_center + 5, 
                            (river_data.water_levels.hfl + bridge_elevation) / 2,
                            f'Clearance\n{river_data.bridge_geometry.vertical_clearance:.1f}m',
                            fontsize=9, fontweight='bold',
                            bbox=dict(boxstyle='round,pad=0.3', facecolor='purple', alpha=0.2))
    
    def _create_title_block(self, river_data: RiverSectionInputSchema, 
                          project_info: Dict[str, Any] = None):
        """Create professional engineering title block"""
        
        if project_info is None:
            project_info = {}
        
        # Title block border
        title_rect = patches.Rectangle((0.02, 0.1), 0.96, 0.8, 
                                     linewidth=2, edgecolor='black', 
                                     facecolor='lightgray', alpha=0.1)
        self.ax_title.add_patch(title_rect)
        
        # Title block sections
        # Main title
        self.ax_title.text(0.5, 0.7, 
                         f'RIVER CROSS-SECTION AT {river_data.project_name.upper()}',
                         fontsize=14, fontweight='bold', ha='center')
        
        self.ax_title.text(0.5, 0.55, 
                         f'Location: {river_data.location} | River: {river_data.river_name}',
                         fontsize=11, ha='center')
        
        # Left section - Project details
        left_info = [
            f"Project: {project_info.get('project_name', river_data.project_name)}",
            f"Survey Date: {river_data.survey_date}",
            f"Drawing Date: {datetime.now().strftime('%d-%m-%Y')}",
            f"Scale: As Noted"
        ]
        
        for i, info in enumerate(left_info):
            self.ax_title.text(0.05, 0.4 - i*0.08, info, fontsize=9, fontweight='bold')
        
        # Center section - Water levels
        center_info = [
            f"HFL = {river_data.water_levels.hfl:.2f}m",
            f"NWL = {river_data.water_levels.nwl:.2f}m", 
            f"LWL = {river_data.water_levels.lwl:.2f}m",
            f"Discharge = {river_data.water_levels.design_discharge:.0f} cumecs"
        ]
        
        for i, info in enumerate(center_info):
            self.ax_title.text(0.35, 0.4 - i*0.08, info, fontsize=9)
        
        # Right section - Technical details
        right_info = [
            f"Drawing No: CS-{datetime.now().strftime('%Y%m%d')}-001",
            f"Sheet: 1 of 1",
            f"Drawn By: Bridge Design App",
            f"Checked By: Engineer"
        ]
        
        for i, info in enumerate(right_info):
            self.ax_title.text(0.65, 0.4 - i*0.08, info, fontsize=9)
        
        # Company/organization section
        self.ax_title.text(0.98, 0.85, "BRIDGE DESIGN APPLICATION", 
                         fontsize=10, fontweight='bold', ha='right')
        self.ax_title.text(0.98, 0.75, "Professional Engineering Software", 
                         fontsize=8, ha='right', style='italic')
    
    def _format_drawing(self):
        """Apply final formatting to the drawing"""
        
        # Set equal aspect ratio for accurate representation
        self.ax_main.set_aspect('equal', adjustable='box')
        
        # Grid
        self.ax_main.grid(True, alpha=0.3, linestyle='-', linewidth=0.5)
        
        # Labels
        self.ax_main.set_xlabel('Chainage (m)', fontsize=11, fontweight='bold')
        self.ax_main.set_ylabel('Elevation (m)', fontsize=11, fontweight='bold')
        
        # Legend
        legend = self.ax_main.legend(loc='upper left', fontsize=9, 
                                   framealpha=0.9, fancybox=True, shadow=True)
        legend.get_frame().set_facecolor('white')
        
        # Tick formatting
        self.ax_main.tick_params(axis='both', which='major', labelsize=9)
        
        # Borders around main drawing
        for spine in self.ax_main.spines.values():
            spine.set_linewidth(2)
            spine.set_color('black')
    
    def save_a4_pdf(self, filename: str = None) -> str:
        """Save as A4 PDF for printing"""
        
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'River_Cross_Section_A4_{timestamp}.pdf'
        
        # Ensure .pdf extension
        if not filename.endswith('.pdf'):
            filename += '.pdf'
        
        # Save with high quality
        self.fig.savefig(filename, 
                        format='pdf', 
                        dpi=self.config.dpi,
                        bbox_inches='tight',
                        pad_inches=0.1,
                        facecolor='white',
                        edgecolor='none')
        
        return filename
    
    def save_a4_png(self, filename: str = None) -> str:
        """Save as high-resolution PNG"""
        
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'River_Cross_Section_A4_{timestamp}.png'
        
        # Ensure .png extension
        if not filename.endswith('.png'):
            filename += '.png'
        
        # Save with high quality
        self.fig.savefig(filename, 
                        format='png', 
                        dpi=self.config.dpi,
                        bbox_inches='tight',
                        pad_inches=0.1,
                        facecolor='white',
                        edgecolor='none')
        
        return filename

def create_streamlit_printable_interface(river_data: RiverSectionInputSchema):
    """Streamlit interface for A4 printable cross-sections"""
    
    st.markdown("""
    <div style="background: linear-gradient(135deg, #2E8B57 0%, #228B22 100%); 
                color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
        <h2 style="margin: 0; font-size: 1.8rem;">📄 A4 Landscape Printable Cross-Section</h2>
        <p style="margin: 0; opacity: 0.9; font-size: 1.1rem;">Professional engineering drawing with HFL annotations</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Configuration options
    st.markdown("### ⚙️ Drawing Configuration")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        include_bridge = st.checkbox("Include Bridge Outline", value=True, 
                                   help="Show bridge deck and clearance")
        
        show_dimensions = st.checkbox("Show Dimensions", value=True,
                                    help="Add dimension lines and annotations")
    
    with col2:
        drawing_quality = st.selectbox("Drawing Quality", 
                                     ["Standard (150 DPI)", "High (300 DPI)", "Print (600 DPI)"],
                                     index=1, help="Higher quality = larger file size")
        
        paper_orientation = st.selectbox("Paper Orientation", 
                                       ["A4 Landscape", "A4 Portrait"], 
                                       index=0, help="A4 landscape recommended")
    
    with col3:
        include_title_block = st.checkbox("Include Title Block", value=True,
                                        help="Professional engineering title block")
        
        color_scheme = st.selectbox("Color Scheme", 
                                  ["Professional", "Color", "Black & White"],
                                  index=0, help="Drawing color scheme")
    
    # Project information for title block
    if include_title_block:
        st.markdown("### 📋 Project Information for Title Block")
        
        col1, col2 = st.columns(2)
        
        with col1:
            project_name = st.text_input("Project Name", 
                                       value=river_data.project_name,
                                       help="Full project name for title block")
            
            engineer_name = st.text_input("Drawn By", 
                                        value="Bridge Design Engineer",
                                        help="Engineer's name")
        
        with col2:
            drawing_number = st.text_input("Drawing Number", 
                                         value=f"CS-{datetime.now().strftime('%Y%m%d')}-001",
                                         help="Unique drawing identifier")
            
            checked_by = st.text_input("Checked By", 
                                     value="Senior Engineer",
                                     help="Reviewing engineer's name")
        
        project_info = {
            'project_name': project_name,
            'engineer_name': engineer_name,
            'drawing_number': drawing_number,
            'checked_by': checked_by
        }
    else:
        project_info = {}
    
    # Generate drawing button
    st.markdown("---")
    
    if st.button("🎨 Generate A4 Printable Cross-Section", type="primary", use_container_width=True):
        
        # Configure drawing settings
        dpi_map = {"Standard (150 DPI)": 150, "High (300 DPI)": 300, "Print (600 DPI)": 600}
        config = DrawingConfig()
        config.dpi = dpi_map[drawing_quality]
        
        # Create progress indicator
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        try:
            # Generate drawing
            status_text.text("🎨 Creating professional drawing...")
            progress_bar.progress(0.2)
            
            printer = CrossSectionA4Printer(config)
            
            status_text.text("📐 Adding cross-section geometry...")
            progress_bar.progress(0.4)
            
            fig = printer.create_printable_cross_section(river_data, project_info)
            
            status_text.text("🌊 Adding water levels and HFL...")
            progress_bar.progress(0.6)
            
            # Display the drawing
            st.markdown("### 📄 A4 Landscape Drawing Preview")
            st.pyplot(fig, use_container_width=True)
            
            status_text.text("💾 Preparing download files...")
            progress_bar.progress(0.8)
            
            # Save options
            st.markdown("### 📥 Download Options")
            
            col1, col2 = st.columns(2)
            
            with col1:
                # PDF download
                pdf_filename = printer.save_a4_pdf()
                with open(pdf_filename, 'rb') as pdf_file:
                    st.download_button(
                        label="📄 Download PDF (A4 Ready)",
                        data=pdf_file.read(),
                        file_name=f"Cross_Section_A4_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                        mime="application/pdf",
                        help="High-quality PDF ready for A4 printing"
                    )
            
            with col2:
                # PNG download
                png_filename = printer.save_a4_png()
                with open(png_filename, 'rb') as png_file:
                    st.download_button(
                        label="🖼️ Download PNG (High-Res)",
                        data=png_file.read(),
                        file_name=f"Cross_Section_A4_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png",
                        mime="image/png",
                        help="High-resolution PNG image"
                    )
            
            progress_bar.progress(1.0)
            status_text.success("✅ A4 drawing generated successfully!")
            
            # Drawing specifications
            st.markdown("### 📏 Drawing Specifications")
            
            spec_col1, spec_col2, spec_col3 = st.columns(3)
            
            with spec_col1:
                st.info(f"""
                **Paper Size**: A4 Landscape
                **Dimensions**: 297mm × 210mm
                **Resolution**: {config.dpi} DPI
                """)
            
            with spec_col2:
                st.info(f"""
                **Margins**: Professional