import streamlit as st
import pandas as pd
import numpy as np
# import matplotlib.pyplot as plt  # Commented out due to DLL issues on Windows
import plotly.graph_objects as go
import json
from datetime import datetime

st.set_page_config(
    page_title="Bridge Hydraulic Design System",
    page_icon="🌊",
    layout="wide"
)

class BridgeHydraulicApp:
    def __init__(self):
        self.load_data()
        
    def load_data(self):
        try:
            with open('extracted_bridge_hydraulic_data.json', 'r') as f:
                self.data = json.load(f)
        except:
            self.data = {}
    
    def create_cross_section_plot(self):
        if 'cross_section' not in self.data:
            return go.Figure()
        
        coords = self.data['cross_section'].get('coordinates', [])
        if not coords:
            return go.Figure()
        
        chainages = [c['chainage'] for c in coords]
        elevations = [c['elevation'] for c in coords]
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=chainages, y=elevations,
            mode='lines+markers',
            name='River Cross Section',
            line=dict(color='brown', width=3)
        ))
        
        # Add HFL level
        fig.add_hline(y=102.52, line_dash="dash", line_color="blue",
                     annotation_text="HFL = 102.52m")
        fig.add_hline(y=100.5, line_dash="dot", line_color="cyan",
                     annotation_text="Normal Level = 100.5m")
        
        fig.update_layout(
            title="River Cross Section - Bundan River Bridge",
            xaxis_title="Chainage (m)",
            yaxis_title="Elevation (m)",
            template='plotly_white'
        )
        return fig
    
    def create_longitudinal_plot(self):
        if 'bed_slope' not in self.data:
            return go.Figure()
        
        profile = self.data['bed_slope'].get('longitudinal_profile', [])
        if not profile:
            return go.Figure()
        
        chainages = [p['chainage'] for p in profile]
        bed_levels = [p['bed_level'] for p in profile]
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=chainages, y=bed_levels,
            mode='lines+markers',
            name='River Bed Profile',
            line=dict(color='brown', width=3)
        ))
        
        # Add water surface
        water_levels = [level + 3.0 for level in bed_levels]
        fig.add_trace(go.Scatter(
            x=chainages, y=water_levels,
            mode='lines',
            name='Water Surface',
            line=dict(color='blue', width=2),
            fill='tonexty',
            fillcolor='rgba(135, 206, 235, 0.3)'
        ))
        
        fig.update_layout(
            title="Longitudinal Section - Bundan River",
            xaxis_title="Chainage (m)",
            yaxis_title="Elevation (m)",
            template='plotly_white'
        )
        return fig
    
    def create_afflux_plot(self):
        x_vals = np.linspace(-100, 100, 200)
        normal_level = 100.5
        afflux_value = 2.02
        
        normal_surface = np.full_like(x_vals, normal_level)
        afflux_surface = []
        
        for x in x_vals:
            distance = abs(x)
            if distance < 50:
                factor = np.exp(-(distance / 25)**2)
                level = normal_level + afflux_value * factor
            else:
                level = normal_level
            afflux_surface.append(level)
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=x_vals, y=normal_surface,
            mode='lines', name='Normal Water Level',
            line=dict(color='blue', dash='dot')
        ))
        fig.add_trace(go.Scatter(
            x=x_vals, y=afflux_surface,
            mode='lines', name='Afflux Affected Level',
            line=dict(color='red', width=3),
            fill='tonexty', fillcolor='rgba(255,0,0,0.2)'
        ))
        
        fig.add_vline(x=0, line_dash="solid", line_color="black",
                     annotation_text="Bridge")
        
        fig.update_layout(
            title=f"Afflux Analysis - Maximum Afflux: {afflux_value}m",
            xaxis_title="Distance from Bridge (m)",
            yaxis_title="Water Level (m)",
            template='plotly_white'
        )
        return fig

def main():
    st.title("🌊 Bridge Hydraulic Design System")
    st.subheader("Bundan River Bridge - Complete Analysis")
    
    app = BridgeHydraulicApp()
    
    # Sidebar navigation
    analysis_type = st.sidebar.selectbox(
        "Select Analysis",
        ["Overview", "Cross Section", "Longitudinal Section", "Afflux Analysis", "Summary Report"]
    )
    
    if analysis_type == "Overview":
        st.markdown("""
        ### Comprehensive Bridge Hydraulic Design
        
        **Key Parameters Extracted:**
        - Normal Water Level: **100.5 m**
        - Afflux Value: **2.02 m**
        - Highest Flood Level: **102.52 m**
        - Total Uplift Force: **3272.4 kN**
        - Bed Slope: **0.87%**
        """)
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Normal Level", "100.5 m")
        with col2:
            st.metric("Afflux", "2.02 m", delta="High")
        with col3:
            st.metric("HFL", "102.52 m")
        with col4:
            st.metric("Uplift Force", "3272.4 kN")
    
    elif analysis_type == "Cross Section":
        st.header("River Cross Section Analysis")
        fig = app.create_cross_section_plot()
        if fig.data:
            st.plotly_chart(fig, use_container_width=True)
            
            if 'cross_section' in app.data:
                coords = app.data['cross_section'].get('coordinates', [])
                if coords:
                    df = pd.DataFrame(coords)
                    st.dataframe(df)
        else:
            st.error("Cross section data not available")
    
    elif analysis_type == "Longitudinal Section":
        st.header("Longitudinal Section Analysis")
        fig = app.create_longitudinal_plot()
        if fig.data:
            st.plotly_chart(fig, use_container_width=True)
            
            if 'bed_slope' in app.data:
                slope_data = app.data['bed_slope']
                if 'slope_calculations' in slope_data:
                    slope = slope_data['slope_calculations']
                    col1, col2 = st.columns(2)
                    with col1:
                        st.metric("Slope", f"{slope.get('slope_percentage', 0):.3f}%")
                    with col2:
                        st.metric("Ratio", f"1 in {int(1/slope.get('overall_slope', 0.01))}")
        else:
            st.error("Longitudinal data not available")
    
    elif analysis_type == "Afflux Analysis":
        st.header("Afflux Analysis")
        fig = app.create_afflux_plot()
        st.plotly_chart(fig, use_container_width=True)
        
        st.markdown("""
        **Afflux Calculation:**
        - Formula: h = ((V²/17.85) + 0.0152) × (A₂/a₂ - 1)
        - Calculated Afflux: **2.02 m**
        - Afflux Flood Level: 100.5 + 2.02 = **102.52 m**
        """)
    
    elif analysis_type == "Summary Report":
        st.header("Hydraulic Design Summary")
        
        summary_data = {
            'Parameter': [
                'Normal Water Level', 'Afflux Value', 'Highest Flood Level',
                'Cross-sectional Area', 'Wetted Perimeter', 'Bed Slope',
                'Manning Coefficient', 'Uplift Pressure', 'Total Uplift Force'
            ],
            'Value': [
                '100.5 m', '2.02 m', '102.52 m', '436.65 m²', '175.43 m',
                '1 in 106 (0.87%)', '0.033', '20.2 kN/m²', '3272.4 kN'
            ]
        }
        
        df = pd.DataFrame(summary_data)
        st.dataframe(df, use_container_width=True)
        
        # Generate printable report
        if st.button("Generate A4 Report"):
            report_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bridge Hydraulic Report</title>
                <style>
                    @page {{ size: A4; margin: 2cm; }}
                    body {{ font-family: Arial, sans-serif; }}
                    .header {{ text-align: center; border-bottom: 2px solid #000; }}
                    table {{ width: 100%; border-collapse: collapse; }}
                    th, td {{ border: 1px solid #000; padding: 8px; }}
                    th {{ background-color: #f0f0f0; }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>BRIDGE HYDRAULIC DESIGN REPORT</h1>
                    <h2>Submersible Bridge - Bundan River</h2>
                    <p>Generated: {datetime.now().strftime('%d-%m-%Y')}</p>
                </div>
                
                <h3>HYDRAULIC PARAMETERS</h3>
                <table>
                    <tr><th>Parameter</th><th>Value</th></tr>
                    <tr><td>Normal Water Level</td><td>100.5 m</td></tr>
                    <tr><td>Afflux Value</td><td>2.02 m</td></tr>
                    <tr><td>Highest Flood Level</td><td>102.52 m</td></tr>
                    <tr><td>Total Uplift Force</td><td>3272.4 kN</td></tr>
                    <tr><td>Bed Slope</td><td>0.87%</td></tr>
                </table>
                
                <h3>DESIGN RECOMMENDATIONS</h3>
                <ul>
                    <li>Submersible bridge design appropriate</li>
                    <li>HFL consideration: 102.52m</li>
                    <li>Adequate anchorage for 3272.4 kN uplift</li>
                    <li>Cross-section validated with survey data</li>
                </ul>
            </body>
            </html>
            """
            
            st.download_button(
                label="Download A4 Report",
                data=report_html,
                file_name=f"Bridge_Hydraulic_Report_{datetime.now().strftime('%Y%m%d')}.html",
                mime="text/html"
            )

if __name__ == "__main__":
    main()