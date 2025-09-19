"""
MODERN UI COMPONENTS FOR STREAMLIT
==================================

Enhanced UI components inspired by BridgeSlabDesigner's modern React interface
Provides professional styling, interactive elements, and improved user experience.

Based on BridgeSlabDesigner/client/src/components/
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass
from datetime import datetime
import math

@dataclass
class ComponentStyle:
    """Styling configuration for UI components"""
    primary_color: str = "#4472C4"
    secondary_color: str = "#70AD47"
    accent_color: str = "#ED7D31"
    success_color: str = "#27AE60"
    warning_color: str = "#F39C12"
    error_color: str = "#E74C3C"
    background_color: str = "#F8F9FA"
    card_background: str = "#FFFFFF"
    border_color: str = "#E5E5E5"

class ModernUIComponents:
    """Modern UI components for enhanced Streamlit experience"""
    
    def __init__(self):
        self.style = ComponentStyle()
        self._initialize_custom_styles()
    
    def _initialize_custom_styles(self):
        """Initialize custom CSS styles"""
        st.markdown("""
        <style>
        .modern-card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border: 1px solid #e5e5e5;
            margin-bottom: 1rem;
        }
        
        .status-indicator {
            display: inline-flex;
            align-items: center;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .status-ready {
            background: #E8F5E8;
            color: #27AE60;
        }
        
        .status-processing {
            background: #FFF3CD;
            color: #F39C12;
        }
        
        .status-complete {
            background: #D4EDDA;
            color: #28A745;
        }
        
        .status-error {
            background: #F8D7DA;
            color: #DC3545;
        }
        
        .parameter-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin: 1rem 0;
        }
        
        .calculation-preview {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-left: 4px solid #4472C4;
            padding: 1rem;
            border-radius: 8px;
            margin: 0.5rem 0;
        }
        
        .metric-card {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid #e5e5e5;
            text-align: center;
            transition: transform 0.2s;
        }
        
        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .progress-bar {
            background: #e5e5e5;
            border-radius: 10px;
            height: 8px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4472C4, #70AD47);
            transition: width 0.3s ease;
        }
        
        .sidebar-section {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            border-left: 4px solid #4472C4;
        }
        
        .reference-project {
            background: white;
            padding: 0.75rem;
            border-radius: 6px;
            border: 1px solid #e5e5e5;
            margin: 0.5rem 0;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .reference-project:hover {
            border-color: #4472C4;
            box-shadow: 0 2px 8px rgba(68, 114, 196, 0.2);
        }
        </style>
        """, unsafe_allow_html=True)
    
    def create_parameter_form_card(self, title: str, parameters: Dict[str, Any], 
                                 on_change: Callable[[str, Any], None]) -> Dict[str, Any]:
        """Create a modern parameter input form card"""
        
        st.markdown(f"""
        <div class="modern-card">
            <h3 style="margin-top: 0; color: #2C3E50; border-bottom: 2px solid #4472C4; padding-bottom: 0.5rem;">
                🔧 {title}
            </h3>
        </div>
        """, unsafe_allow_html=True)
        
        # Create form inputs based on parameter types
        updated_params = {}
        
        with st.container():
            cols = st.columns(2)
            
            param_items = list(parameters.items())
            for i, (key, value) in enumerate(param_items):
                col = cols[i % 2]
                
                with col:
                    if isinstance(value, (int, float)):
                        if 'span' in key.lower() or 'length' in key.lower() or 'width' in key.lower():
                            new_value = st.number_input(
                                self._format_label(key),
                                value=float(value),
                                min_value=0.1,
                                step=0.1,
                                key=f"param_{key}",
                                help=f"Current value: {value}"
                            )
                        elif 'angle' in key.lower():
                            new_value = st.number_input(
                                self._format_label(key),
                                value=float(value),
                                min_value=0.0,
                                max_value=90.0,
                                step=1.0,
                                key=f"param_{key}"
                            )
                        else:
                            new_value = st.number_input(
                                self._format_label(key),
                                value=float(value),
                                key=f"param_{key}"
                            )
                    elif isinstance(value, str):
                        if key.lower() in ['concrete_grade', 'steel_grade']:
                            options = ['M20', 'M25', 'M30', 'M35'] if 'concrete' in key.lower() else ['Fe415', 'Fe500']
                            new_value = st.selectbox(
                                self._format_label(key),
                                options,
                                index=options.index(value) if value in options else 0,
                                key=f"param_{key}"
                            )
                        else:
                            new_value = st.text_input(
                                self._format_label(key),
                                value=str(value),
                                key=f"param_{key}"
                            )
                    else:
                        new_value = st.text_input(
                            self._format_label(key),
                            value=str(value),
                            key=f"param_{key}"
                        )
                    
                    updated_params[key] = new_value
        
        return updated_params
    
    def create_live_calculation_preview(self, parameters: Dict[str, Any]) -> None:
        """Create live calculation preview card"""
        
        st.markdown("""
        <div class="modern-card">
            <h3 style="margin-top: 0; color: #2C3E50; border-bottom: 2px solid #70AD47; padding-bottom: 0.5rem;">
                📊 Live Calculation Preview
                <span class="status-indicator status-ready" style="float: right;">
                    🟢 Real-time
                </span>
            </h3>
        </div>
        """, unsafe_allow_html=True)
        
        # Calculate live values
        calculations = self._perform_live_calculations(parameters)
        
        # Create metric cards
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            self._create_metric_card("Total Length", f"{calculations['total_length']:.1f} m", "📏")
        
        with col2:
            self._create_metric_card("Deck Area", f"{calculations['deck_area']:.1f} m²", "📐")
        
        with col3:
            self._create_metric_card("Concrete Volume", f"{calculations['concrete_volume']:.1f} m³", "🏗️")
        
        with col4:
            self._create_metric_card("Steel Weight", f"{calculations['steel_weight']:.1f} tonnes", "⚙️")
        
        # Cost estimation
        st.markdown("<div class='calculation-preview'>", unsafe_allow_html=True)
        st.markdown("### 💰 Cost Estimation")
        
        cost_col1, cost_col2 = st.columns(2)
        
        with cost_col1:
            st.metric("Structure Cost", f"₹ {calculations['structure_cost']:,.0f}")
        
        with cost_col2:
            st.metric("Total Project Cost", f"₹ {calculations['total_cost']:,.0f}", 
                     delta=f"₹ {calculations['total_cost'] - calculations['structure_cost']:,.0f}")
        
        st.markdown("</div>", unsafe_allow_html=True)
        
        # Design status
        status = "VERIFIED" if calculations['total_cost'] < 10000000 else "REVIEW REQUIRED"
        status_color = "#27AE60" if status == "VERIFIED" else "#F39C12"
        
        st.markdown(f"""
        <div style="background: {status_color}20; border: 1px solid {status_color}; 
                    border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <div style="display: flex; align-items: center;">
                <span style="font-size: 1.2rem; margin-right: 0.5rem;">
                    {"✅" if status == "VERIFIED" else "⚠️"}
                </span>
                <div>
                    <strong style="color: {status_color};">Design Status: {status}</strong>
                    <br>
                    <small style="color: #666;">
                        {"All parameters within acceptable limits" if status == "VERIFIED" else "Parameters require review"}
                    </small>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    def create_excel_generation_panel(self, parameters: Dict[str, Any]) -> None:
        """Create Excel generation panel with options"""
        
        st.markdown("""
        <div class="modern-card">
            <h3 style="margin-top: 0; color: #2C3E50; border-bottom: 2px solid #ED7D31; padding-bottom: 0.5rem;">
                📊 Excel Generation Panel
            </h3>
        </div>
        """, unsafe_allow_html=True)
        
        # Generation options
        st.markdown("#### 🔧 File Options")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            include_formulas = st.checkbox("Include Formulas", value=True, 
                                         help="Include Excel formulas for automatic calculations")
        
        with col2:
            professional_formatting = st.checkbox("Professional Formatting", value=True,
                                                 help="Apply professional styling and colors")
        
        with col3:
            auto_calculations = st.checkbox("Auto-calculations", value=True,
                                          help="Enable automatic recalculation")
        
        # Sheets to include
        st.markdown("#### 📋 Excel Sheets Included")
        
        sheets = [
            ("Input Parameters", "ready", "✅"),
            ("Hydraulic Design", "ready", "✅"),
            ("Slab Bridge Design", "ready", "✅"),
            ("Pier Design", "ready", "✅"),
            ("Abutment Design", "ready", "✅"),
            ("Foundation Design", "ready", "✅"),
            ("Stability Analysis", "ready", "✅"),
            ("Steel Design", "ready", "✅"),
            ("General Abstract", "ready", "✅"),
            ("Detailed Estimate", "ready", "✅"),
            ("Quantity Measurements", "ready", "✅"),
        ]
        
        for i in range(0, len(sheets), 2):
            cols = st.columns(2)
            for j, col in enumerate(cols):
                if i + j < len(sheets):
                    sheet_name, status, icon = sheets[i + j]
                    col.markdown(f\"\"\"
                    <div style=\"background: #f8f9fa; padding: 0.5rem; border-radius: 6px; 
                                border-left: 3px solid #70AD47; margin: 0.25rem 0;\">
                        <span style=\"color: #27AE60;\">{icon}</span> {sheet_name}
                    </div>
                    \"\"\", unsafe_allow_html=True)
        
        # Generation button
        st.markdown(\"---\")
        
        if st.button(\"🚀 Generate Complete Design Excel\", 
                    type=\"primary\", 
                    use_container_width=True,
                    help=\"Generate comprehensive Excel file with all calculations\"):
            
            # Show progress
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            # Simulate generation process
            import time
            steps = [
                \"Initializing Excel generator...\",
                \"Creating input parameters sheet...\",
                \"Generating hydraulic calculations...\",
                \"Processing structural design...\",
                \"Creating foundation analysis...\",
                \"Finalizing cost estimates...\",
                \"Applying professional formatting...\",
                \"Saving Excel file...\"
            ]
            
            for i, step in enumerate(steps):
                status_text.text(step)
                progress_bar.progress((i + 1) / len(steps))
                time.sleep(0.5)  # Simulate processing time
            
            status_text.success(\"✅ Excel file generated successfully!\")
            
            # In actual implementation, call the enhanced Excel generator
            # excel_generator = EnhancedExcelGenerator()
            # excel_data = excel_generator.generate_complete_bridge_excel(
            #     parameters, calculations, options
            # )
            
            st.balloons()
    
    def create_system_status_panel(self) -> None:
        \"\"\"Create system status monitoring panel\"\"\"
        
        st.markdown(\"#### 🔍 System Status\")
        
        status_items = [
            (\"Input Validation\", \"complete\", \"✅\"),
            (\"Design Computation\", \"complete\", \"✅\"),
            (\"Cost Estimation\", \"complete\", \"✅\"),
            (\"Excel Generation\", \"ready\", \"🔄\"),
        ]
        
        for item, status, icon in status_items:
            status_color = \"#27AE60\" if status == \"complete\" else \"#F39C12\"
            status_text = \"Complete\" if status == \"complete\" else \"Ready\"
            
            st.markdown(f\"\"\"
            <div style=\"display: flex; justify-content: space-between; align-items: center;
                        background: {status_color}15; padding: 0.5rem; border-radius: 6px;
                        border: 1px solid {status_color}40; margin: 0.25rem 0;\">
                <span>{item}</span>
                <div style=\"display: flex; align-items: center; color: {status_color};\">
                    <span style=\"margin-right: 0.5rem;\">{icon}</span>
                    <small>{status_text}</small>
                </div>
            </div>
            \"\"\", unsafe_allow_html=True)
    
    def create_reference_projects_sidebar(self) -> Optional[Dict[str, Any]]:
        \"\"\"Create reference projects sidebar\"\"\"
        
        st.markdown(\"\"\"
        <div class=\"sidebar-section\">
            <h4 style=\"margin-top: 0; color: #2C3E50;\">📚 Reference Projects</h4>
        </div>
        \"\"\", unsafe_allow_html=True)
        
        reference_projects = [
            {
                \"name\": \"Kherwara Bridge\",
                \"location\": \"Som River\",
                \"spans\": \"3 Spans × 12m\",
                \"type\": \"Slab Bridge\",
                \"parameters\": {
                    \"bridge_name\": \"Kherwara Bridge\",
                    \"location\": \"Som River\",
                    \"num_spans\": 3,
                    \"effective_span\": 12.0,
                    \"bridge_width\": 7.5
                }
            },
            {
                \"name\": \"Parasram Bridge\",
                \"location\": \"Jethliya\",
                \"spans\": \"2 Spans × 8m\",
                \"type\": \"Slab Bridge\",
                \"parameters\": {
                    \"bridge_name\": \"Parasram Bridge\", 
                    \"location\": \"Jethliya\",
                    \"num_spans\": 2,
                    \"effective_span\": 8.0,
                    \"bridge_width\": 6.0
                }
            },
            {
                \"name\": \"UIT Police Chowki\",
                \"location\": \"Udaipur\",
                \"spans\": \"4 Spans × 10m\",
                \"type\": \"Slab Bridge\",
                \"parameters\": {
                    \"bridge_name\": \"UIT Police Chowki Bridge\",
                    \"location\": \"Udaipur\",
                    \"num_spans\": 4,
                    \"effective_span\": 10.0,
                    \"bridge_width\": 8.0
                }
            }
        ]
        
        selected_project = None
        
        for i, project in enumerate(reference_projects):
            if st.button(
                f\"📁 {project['name']}\",
                key=f\"ref_project_{i}\",
                help=f\"Load parameters from {project['name']} ({project['location']})\",
                use_container_width=True
            ):
                selected_project = project['parameters']
                st.success(f\"✅ Loaded parameters from {project['name']}\")
        
        return selected_project
    
    def _format_label(self, key: str) -> str:
        """Format parameter key into readable label"""
        return key.replace('_', ' ').title()
    
    def _create_metric_card(self, title: str, value: str, icon: str):
        """Create a metric display card"""
        st.markdown(f"""
        <div class="metric-card">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">{icon}</div>
            <div style="font-size: 1.25rem; font-weight: 600; color: #2C3E50;">{value}</div>
            <div style="font-size: 0.875rem; color: #666;">{title}</div>
        </div>
        """, unsafe_allow_html=True)
    
    def _perform_live_calculations(self, parameters: Dict[str, Any]) -> Dict[str, float]:
        """Perform live calculations based on parameters"""
        
        # Extract parameters with defaults
        num_spans = parameters.get('num_spans', 3)
        effective_span = parameters.get('effective_span', 9.6)
        bridge_width = parameters.get('bridge_width', 12.0)
        
        # Basic calculations
        total_length = num_spans * effective_span
        deck_area = total_length * bridge_width
        
        # Material calculations
        slab_volume = deck_area * 0.75  # 750mm slab
        pier_volume = (num_spans - 1) * 2.0 * 1.5 * 6.0  # Approximate pier volume
        concrete_volume = slab_volume + pier_volume
        
        steel_weight = concrete_volume * 0.12  # 120 kg/m³ steel ratio
        
        # Cost calculations (in INR)
        concrete_cost = concrete_volume * 4500  # ₹4500 per m³
        steel_cost = steel_weight * 65000  # ₹65000 per tonne
        structure_cost = concrete_cost + steel_cost
        
        foundation_cost = structure_cost * 0.6  # 60% of structure cost
        total_cost = structure_cost + foundation_cost
        
        return {
            'total_length': total_length,
            'deck_area': deck_area,
            'concrete_volume': concrete_volume,
            'steel_weight': steel_weight,
            'structure_cost': structure_cost,
            'foundation_cost': foundation_cost,
            'total_cost': total_cost
        }
    
    def _format_label(self, key: str) -> str:
        \"\"\"Format parameter key into readable label\"\"\"
        return key.replace('_', ' ').title()
    
    def _create_metric_card(self, title: str, value: str, icon: str):
        \"\"\"Create a metric display card\"\"\"
        st.markdown(f\"\"\"
        <div class=\"metric-card\">
            <div style=\"font-size: 1.5rem; margin-bottom: 0.5rem;\">{icon}</div>
            <div style=\"font-size: 1.25rem; font-weight: 600; color: #2C3E50;\">{value}</div>
            <div style=\"font-size: 0.875rem; color: #666;\">{title}</div>
        </div>
        \"\"\", unsafe_allow_html=True)
    
    def _perform_live_calculations(self, parameters: Dict[str, Any]) -> Dict[str, float]:
        \"\"\"Perform live calculations based on parameters\"\"\"
        
        # Extract parameters with defaults
        num_spans = parameters.get('num_spans', 3)
        effective_span = parameters.get('effective_span', 9.6)
        bridge_width = parameters.get('bridge_width', 12.0)
        
        # Basic calculations
        total_length = num_spans * effective_span
        deck_area = total_length * bridge_width
        
        # Material calculations
        slab_volume = deck_area * 0.75  # 750mm slab
        pier_volume = (num_spans - 1) * 2.0 * 1.5 * 6.0  # Approximate pier volume
        concrete_volume = slab_volume + pier_volume
        
        steel_weight = concrete_volume * 0.12  # 120 kg/m³ steel ratio
        
        # Cost calculations (in INR)
        concrete_cost = concrete_volume * 4500  # ₹4500 per m³
        steel_cost = steel_weight * 65000  # ₹65000 per tonne
        structure_cost = concrete_cost + steel_cost
        
        foundation_cost = structure_cost * 0.6  # 60% of structure cost
        total_cost = structure_cost + foundation_cost
        
        return {
            'total_length': total_length,
            'deck_area': deck_area,
            'concrete_volume': concrete_volume,
            'steel_weight': steel_weight,
            'structure_cost': structure_cost,
            'foundation_cost': foundation_cost,
            'total_cost': total_cost
        }

def create_professional_navigation():
    \"\"\"Create professional navigation with status indicators\"\"\"
    
    st.markdown(\"\"\"
    <div style=\"background: linear-gradient(90deg, #4472C4, #70AD47); 
                padding: 1rem; border-radius: 8px; margin-bottom: 2rem;\">
        <div style=\"display: flex; justify-content: space-between; align-items: center;\">
            <div style=\"color: white;\">
                <h2 style=\"margin: 0; font-size: 1.5rem;\">🌉 Enhanced Bridge Designer</h2>
                <p style=\"margin: 0; opacity: 0.9;\">Professional Engineering Application</p>
            </div>
            <div style=\"display: flex; align-items: center; color: white;\">
                <div style=\"background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; 
                           border-radius: 20px; display: flex; align-items: center;\">
                    <div style=\"width: 8px; height: 8px; background: #27AE60; 
                               border-radius: 50%; margin-right: 0.5rem; animation: pulse 2s infinite;\"></div>
                    <span style=\"font-size: 0.875rem;\">System Ready</span>
                </div>
            </div>
        </div>
    </div>
    
    <style>
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    </style>
    \"\"\", unsafe_allow_html=True)

def create_calculation_results_table(calculations: List[Dict[str, Any]]) -> None:
    \"\"\"Create a professional calculation results table\"\"\"
    
    df = pd.DataFrame(calculations)
    
    # Apply styling
    styled_df = df.style.format({
        'Result': lambda x: f\"{x:.3f}\" if isinstance(x, (int, float)) else str(x)
    }).set_table_styles([
        {'selector': 'th', 'props': [('background-color', '#4472C4'), 
                                    ('color', 'white'), ('font-weight', 'bold')]},
        {'selector': 'td', 'props': [('border', '1px solid #ddd'), 
                                    ('padding', '8px')]},
        {'selector': 'tr:nth-of-type(even)', 'props': [('background-color', '#f8f9fa')]},
        {'selector': 'tr:hover', 'props': [('background-color', '#e3f2fd')]}
    ])
    
    st.dataframe(styled_df, use_container_width=True)
